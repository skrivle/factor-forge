# SRS-Only Slimme Oefening – Design

## Goal

- **Slimme Oefening = SRS only.** One system: “what’s due for review?” No separate “weak questions” pool or merge.
- **Drop** the current weak-questions-based practice content. Keep `question_stats` for analytics and for **migrating existing data into SRS**.
- **Keep games unchanged.** They only feed SRS (and still write to `question_stats`).
- **Gentle “learning first” hint** when there are items due (e.g. on home and after game over).

---

## 1. Why SRS-Only (No Combined System)

- **One mental model:** “What’s due today?” instead of merging “due” and “weak.”
- **Weak is already in SRS:** Wrong answer → short interval (due again soon). Correct → longer interval. Things you get wrong become “frequently due” until they’re right.
- **Less code:** One question source, one algorithm. No merging, no weighting by accuracy for practice content.
- **Research:** Spacing beats massed practice on errors for long-term retention.

**We drop:**

- Using `getUserWeakQuestions` as the driver for practice content.
- The “need 5 weak questions” gate for opening Slimme Oefening.
- Any merge of “due” + “weak” in `generateAdaptiveQuestions`.

**We keep:**

- `question_stats`: analytics, streaks, and **one-time migration** into SRS (see below).
- Optionally: weak-questions query for **display only** (e.g. stats page / parent dashboard “weak areas”), but not for choosing practice questions.

---

## 1.1 Evidence alignment (Ebbinghaus, Roediger & Karpicke, kid-specific advice)

| Evidence / recommendation | In the app |
|---------------------------|------------|
| **Forgetting curve** – SRS interrupts decay by reviewing at the right time | ✅ Intervals 1→2→3→4→7→14→30 days; correct → longer, wrong → reset. |
| **“Buffer” / Learning vs Review** – Don’t start long intervals until the fact is learned | ✅ **Learning buffer:** at the 1-day step we require **2 correct** before advancing to 2 days. So the SRS “timer” only moves into longer intervals after a short learning phase. |
| **Immediate feedback when wrong** – Show correct answer so they don’t practice mistakes | ✅ Practice UI shows “Correct antwoord: X” immediately on wrong answer. |
| **Interleaving** – Mix tables (don’t block by table) | ✅ Due list is all facts due today from any table; session is shuffled. |
| **First interval ~24h, then 3d, then 1w; wrong → reset** | ✅ Ladder is 1→2→3→4→7→14→30; wrong → interval 1, next review tomorrow. |

---

## 2. Data Model: SRS Table

One row per (user, fact). Fact = (num1, num2, operation).

```sql
CREATE TABLE spaced_repetition_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  num1 INT NOT NULL,
  num2 INT NOT NULL,
  operation VARCHAR(20) NOT NULL,
  interval_days INT DEFAULT 1,
  easiness_factor FLOAT DEFAULT 2.5,
  next_review_date DATE NOT NULL,
  repetitions INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, num1, num2, operation)
);

CREATE INDEX idx_srs_user_next ON spaced_repetition_schedule(user_id, next_review_date);
```

- **interval_days**: e.g. 1, 3, 7, 14, 30.
- **next_review_date**: when this fact is next due.
- **repetitions**: successful reviews in a row (for interval steps).
- **easiness_factor**: optional (SM-2); can start with fixed steps.

**When to create/update:**

- After **every** answer (game or practice): upsert one row per (user, num1, num2, operation).
  - **Correct** → increase interval (e.g. 1 → 3 → 7 → 14 → 30), set `next_review_date = today + interval_days`.
  - **Incorrect** → reset to interval 1, `next_review_date = tomorrow`, optionally reset `repetitions`.

Same events that write to `question_stats` also drive SRS.

---

## 3. Slimme Oefening: 100% SRS

- **Content:** Only “due today” (and overdue): `next_review_date <= today` for the user.
- **Session:** Build N questions (e.g. 20) by sampling from due facts (with repetition if due count < N).
- **Gate:** No “5 weak questions” requirement. New logic:
  - If **due count > 0** → show “Start Oefensessie” as now.
  - If **due count === 0** → show a friendly state: “Geen sommen vandaag – speel een spelletje om je oefenlijst op te bouwen!” with CTA to game (and still link to Slimme Oefening for explanation).
- **Learning needed:** `learningNeeded = dueCount > 0`. Hint on home and after game when `dueCount > 0` (no weak-count condition needed).

Optional later: if due count is 0, we could offer “random practice from your tables” so the page never feels empty; for v1, “play a game to build your queue” is enough.

---

## 4. Migration: question_stats → SRS

**Goal:** Existing users don’t start from zero. One-time backfill from `question_stats` into `spaced_repetition_schedule`.

**Per (user_id, num1, num2, operation):**

1. Take all rows from `question_stats` for that fact, ordered by `created_at` desc.
2. **Last response:**
   - If **last was correct** and happened “recently” (e.g. within last 7 days): seed with `interval_days = 3` (or 7), `next_review_date = last_seen_date + interval_days`, `repetitions = 1`.
   - If **last was correct** and longer ago: treat as due now → `interval_days = 1`, `next_review_date = today`, `repetitions = 0`.
   - If **last was incorrect** (or we only have wrong/mixed history): `interval_days = 1`, `next_review_date = today`, `repetitions = 0`.
3. If a fact has **never** been seen, no SRS row (SRS grows as they play).

**Implementation options:**

- **Migration script** (e.g. npm script or one-off API): for each user, aggregate `question_stats` by (num1, num2, operation), compute last outcome and last date, then insert/update `spaced_repetition_schedule`. Run once after deploy.
- **Lazy backfill:** first time we need “due” for a user, if SRS is empty for them, run the same logic and populate; then use SRS from then on. Simpler but slightly more logic in the “get due” path.

**Edge cases:**

- Same fact appears in both `question_stats` and already in SRS (e.g. after first game post-deploy): normal SRS update wins; migration only runs for users who had data before SRS existed.

---

## 5. “Learning Needed” and Hints

- **Definition:** `learningNeeded = (dueCount > 0)`.
- **API:** e.g. `GET /api/learning/status` → `{ learningNeeded, dueCount }`. (We can keep `weakCount` in the response for stats/dashboard only.)
- **Home:** If `learningNeeded`, show: *“Je hebt X sommen om te oefenen vandaag – oefen eerst even, dan wordt je volgende spel nóg leuker! 🎯”* and highlight Slimme Oefening. No hard block.
- **Game over:** If `learningNeeded`, show: *“Wil je deze sommen nog even oefenen? Slimme Oefening 🎯”* + button, alongside “Speel opnieuw” / “Terug naar Home.”

---

## 6. Implementation Order

1. **Database:** Add `spaced_repetition_schedule` (schema + migration).
2. **SRS core:**  
   - `updateSrsOnAnswer(userId, num1, num2, operation, isCorrect)`.  
   - `getDueFacts(userId)`
3. **Wire into saves:** After `saveQuestionStats` (game + practice), call `updateSrsOnAnswer` for each question.
4. **Migration:** Backfill SRS from `question_stats` (script or lazy).
5. **Practice API:** Replace weak-questions with due-only: e.g. `GET /api/practice/weak-questions` → returns `{ dueQuestions, dueCount, hasEnoughData: dueCount > 0 }` (or new endpoint and update practice page to use “due” wording).
6. **Practice page + engine:**  
   - Fetch due facts; build session from due only (new or adapted `generateAdaptiveQuestions` that only takes a list of due facts).  
   - Gate: “Geen sommen vandaag” when due count === 0, with CTA to game.
7. **Learning status API:** `GET /api/learning/status` with `dueCount`, `learningNeeded`.
8. **UI:** Home hint when `learningNeeded`; game-over hint + Slimme Oefening button when `learningNeeded`.

---

## 7. Success Criteria

- Slimme Oefening uses **only** SRS “due today” for content.
- No merge with weak-questions for practice; weak-questions can remain for analytics/dashboard only.
- Existing users get SRS seeded from `question_stats` so they have a due list from day one.
- Games unchanged; learning hint appears when `dueCount > 0`.

---

## 8. Optional Later

- “Facts mastered” badge (e.g. facts with interval ≥ 30 days).
- Parent dashboard: due count, SRS mastery.
- If due count is 0: optional “random practice” so the practice page always has something to do.
