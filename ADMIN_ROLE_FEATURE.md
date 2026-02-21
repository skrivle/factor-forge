# Admin Role Feature

## Overview
The admin role allows designated users to manage their group's settings and members. This feature enables better control over group composition and the times tables that members can practice.

## Admin Capabilities

### 1. Member Management
- **Add Members**: Admins can add new users to their group from a list of available users (users not currently in any group)
- **Remove Members**: Admins can remove members from the group (except themselves)
- View all group members with their roles (Admin, Parent, or Child)

### 2. Group Settings
- **Supported Times Tables**: Admins can configure which times tables (1-10) are available for practice in their group
- These settings apply to all group exercises and tests
- At least one table must be selected at all times

## Implementation Details

### Database Schema Changes
- **Users Table**: Added `'admin'` as a valid role (in addition to `'parent'` and `'child'`)
- **Groups Table**: Added `supported_tables` integer array field (default: [1,2,3,4,5,6,7,8,9,10])

### API Endpoints

#### `/api/admin/members`
- **GET**: Fetch available users to add to the group (requires admin role)
- **POST**: Add a member to the group (requires admin role)
- **DELETE**: Remove a member from the group (requires admin role)

#### `/api/admin/group-settings`
- **PATCH**: Update group settings including supported times tables (requires admin role)

### Authorization
All admin endpoints check:
1. User is authenticated
2. User has 'admin' role AND belongs to the group they're managing
3. Operations are performed only on the user's own group

### UI Components
- **Admin Dashboard** (`/app/admin/page.tsx`): Central hub for admin operations
  - Visible only to users with admin role
  - Shows group members list
  - Provides interface to add/remove members
  - Allows editing supported times tables
- **Home Page**: Shows "Admin Dashboard" button only to admin users

## Migration
The migration file `0003_add_admin_role_and_group_tables.sql` adds:
- Admin role to the user role constraint
- `supported_tables` field to groups table with default values

## Usage

### Creating an Admin User
To create a user with admin role, use the `createUser` function:
```typescript
await createUser('Admin Name', '1234', 'admin');
```

### Accessing Admin Dashboard
1. Log in as a user with admin role
2. Click "Admin Dashboard ⚙️" button on the home page
3. Manage members and group settings from the dashboard

## Security Considerations
- All admin operations require authentication
- Admins can only manage their own group
- Admins cannot remove themselves from the group
- At least one times table must be selected in group settings
- Times tables must be between 1 and 10

## Future Enhancements
- Allow admins to promote/demote users to different roles
- Support for multiple admins per group
- Audit log for admin actions
- Group-wide analytics and reports
- Custom difficulty settings per group
