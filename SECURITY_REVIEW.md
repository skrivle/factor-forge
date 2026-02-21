# Security Review: Roles & Backend Authorization

## How roles are assigned and passed

### Assignment
- **Source of truth:** `users.role` in the database (`'admin' | 'parent' | 'child'`).
- **At login:** `lib/auth.ts` uses `verifyUserPin(name, pin)` which loads the user from DB; the returned `user.role` is the only source.
- **Session:** NextAuth JWT stores `token.role`; the session callback adds `session.user.role`. Role is **not** client-editable; it is set once at login from the DB.

### Passing
- **Backend:** API routes use `(session.user as any).role` and `(session.user as any).id` after `await auth()`. So authorization is based on server-side session, not client input.
- **Frontend:** Pages use `useSession()` and read `session.user.role` for UI (e.g. show/hide admin link, difficulty). This is only for UX; enforcement is on the API.

**Verdict:** Role assignment and passing are secure: role comes from DB at login and is carried in the signed session; endpoints rely on `auth()`, not request body/query for identity.

---

## Endpoint-by-endpoint summary

| Endpoint | Auth | Role / scope check | Notes |
|----------|------|--------------------|--------|
| **Auth** | | | |
| `POST /api/auth/signup` | No (public) | N/A | Correct for signup; uses invite code. |
| **User** | | | |
| `GET /api/user/profile` | ✅ | Own profile only | OK. |
| `GET /api/user/stats` | ✅ | Own stats only | OK. |
| **Groups** | | | |
| `GET /api/groups` | ✅ | ✅ same group or app admin | Fixed: `groupId` access enforced via `canAccessGroup`. |
| `POST /api/groups` | ✅ | ✅ parent only | OK. |
| **Game / practice** | | | |
| `POST /api/game/save` | ✅ | Uses session `userId` | OK. |
| `POST /api/practice/save-stats` | ✅ | Uses session `userId` | OK. |
| `GET /api/practice/weak-questions` | ✅ | Own data | OK. |
| **Tests** | | | |
| `GET /api/tests` | ✅ | ✅ test in user's group | Fixed: single-test and list scoped to group via `canAccessGroup` / `getUserGroupId`. |
| `POST /api/tests` | ✅ | ✅ parent + own group | Fixed: `canAccessGroup` ensures create only in user's group. |
| `DELETE /api/tests` | ✅ | ✅ parent + own group | Fixed: test's group checked with `canAccessGroup` before delete. |
| `GET/POST /api/tests/attempts` | ✅ | ✅ test in user's group | Fixed: test group checked with `canAccessGroup` before read/submit. |
| **Leaderboard** | | | |
| `GET /api/leaderboard` | ✅ | ✅ auth + group access | Fixed: auth required; `groupId` restricted via `canAccessGroup`; else user's group. |
| **Activity** | | | |
| `GET /api/activity` | ✅ | Own activity | OK. |
| `GET /api/activity/users` | ✅ | ✅ same-group users only | Fixed: `filterUserIdsToSameGroup` restricts to current user's group. |
| **Admin** | | | |
| `POST /api/admin/create-member` | ✅ | ✅ admin of group or app admin | OK. |
| `PATCH /api/admin/group-settings` | ✅ | ✅ admin of group or app admin | OK. |
| `GET/POST/DELETE /api/admin/members` | ✅ | ✅ admin of group or app admin | OK. |
| `DELETE /api/admin/delete-group` | ✅ | ✅ admin of that group only | OK (only group's admin can delete). |
| **Invite / debug** | | | |
| `POST /api/invite/validate` | No | N/A | Acceptable for signup flow; only validates code. |
| `GET /api/debug/codes` | *(removed)* | — | Endpoint deleted; no longer present. |

---

## Issues fixed

1. ~~**GET /api/debug/codes**~~ – Removed (was exposing all invite codes).
2. ~~**GET /api/groups?groupId=**~~ – Fixed: `canAccessGroup(userId, groupId)` enforces same group (user must belong to that group).
3. ~~**GET /api/leaderboard**~~ – Fixed: auth required; optional `groupId` restricted via `canAccessGroup`; otherwise user's own group used.
4. ~~**GET/DELETE /api/tests** and **GET/POST /api/tests/attempts**~~ – Fixed: test's `group_id` checked with `canAccessGroup` before read/delete/attempts; POST create validates `groupId` with `canAccessGroup`.
5. ~~**GET /api/activity/users**~~ – Fixed: `filterUserIdsToSameGroup(currentUserId, userIds)` so only same-group users' activity is returned.
6. ~~**POST /api/tests**~~ – Fixed: parent can create tests only for their own group.

---

## Implementation details

**Helpers in `lib/db/queries.ts`:**
- **`getUserGroupId(userId)`** – Returns the user's `group_id` or `null`.
- **`canAccessGroup(userId, groupId)`** – Returns true only if the user belongs to that group (same `group_id`). Admins can only access their own group, not other groups.
- **`filterUserIdsToSameGroup(currentUserId, userIds)`** – Returns only those `userIds` that belong to the same group as `currentUserId`. Used for `/api/activity/users`.

---

## Role semantics

- **admin:** Can access `/admin` and manage their own group only. In `delete-group`, only the group's own admin can delete that group. Admins cannot access other groups' data.
- **parent:** Can create groups, create/delete tests, see all attempts in their group. Enforced by role checks and group scope (via `canAccessGroup`).
- **child:** Can only use game/practice and own data; parents see more within the group. Enforcement is via role and group checks.

`isUserAdminOfGroup(userId, groupId)` correctly checks `users.role = 'admin'` and `users.group_id = groupId`, so "group admin" is consistent. All group-scoped resources now use explicit same-group checks via the helpers above.
