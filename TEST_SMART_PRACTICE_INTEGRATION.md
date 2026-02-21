# Test Integration with Smart Practice (Slimme Oefening)

## Overview

The smart practice feature now integrates data from **tests (toetsen)** in addition to regular game sessions. This provides a more comprehensive learning profile and faster weak area detection.

## What Changed

### Before
- Only regular game sessions contributed to smart practice
- Required multiple game sessions to identify weak questions
- Test data was stored but not used for adaptive learning

### After ✅
- **Both games AND tests** contribute to smart practice
- Test completion provides many data points at once
- Faster weak area detection and better recommendations
- Unified analysis across all question attempts

## How It Works

### 1. Data Collection

When a child completes a test:
```
Test: 20 questions answered
  ↓
Each question saved individually
  ↓
question_stats table updated
  ↓
Smart practice algorithm sees the data
```

### 2. Unified Storage

All question attempts (from games, tests, and practice) are stored in the same `question_stats` table:

| Field | Description | Example |
|-------|-------------|---------|
| `user_id` | Child's ID | `abc-123` |
| `session_id` | Game or test ID | `game-456` or `test-789` |
| `num1` | First number | `3` |
| `num2` | Second number | `8` |
| `operation` | Math operation | `multiplication` |
| `correct_answer` | Right answer | `24` |
| `user_answer` | Child's answer | `21` |
| `is_correct` | Boolean | `false` |
| `time_taken` | Seconds (optional) | `4.5` or `null` |

### 3. Smart Analysis

The `getUserWeakQuestions()` function analyzes ALL entries:
- Groups by question (e.g., all instances of "3 × 8")
- Calculates accuracy rate across all sources
- Identifies weak questions (seen ≥2 times, accuracy <50%)
- Ranks by difficulty for practice

### 4. Adaptive Practice

Smart practice sessions now benefit from:
- **More data**: Tests + Games = Better insights
- **Faster activation**: 1 test can provide 20+ data points
- **Better targeting**: More accurate weak area identification
- **Consistent treatment**: Test and game data weighted equally

## Example Scenario

### Scenario: Child Struggles with Multiplication of 7 and 8

```
Day 1: Regular Game
├─> Answers 7×8 = 54 (wrong)
└─> Data saved to question_stats

Day 2: Parent Creates Test (includes 7×8)
├─> Child answers 7×8 = 54 (wrong again)
└─> Data saved to question_stats ⭐ NEW!

Day 3: Another Game
├─> Answers 7×8 = 56 (correct!)
└─> Data saved to question_stats

Smart Practice Analysis:
├─> 7×8 seen 3 times (2 from games, 1 from test)
├─> Answered correctly 1/3 times = 33% accuracy
├─> Marked as weak question
└─> High priority in practice sessions (10x weight)

Day 4: Uses "Slimme Oefening"
├─> 7×8 appears ~7 times out of 20 questions
├─> Child practices intensively
├─> Accuracy improves
└─> Weight decreases automatically
```

## Benefits

### For Children
- 🎯 More personalized practice based on comprehensive data
- 📊 Faster identification of areas needing help
- 🚀 Progress reflected from all learning activities
- 💪 Better reinforcement of weak areas

### For Parents
- 👀 Tests now contribute to learning analytics
- 📈 More data = more accurate insights
- 🎓 Complete picture of child's progress
- ⏱️ Quicker activation of smart practice

### For the System
- 🔄 Unified data model (no duplicate systems)
- 📦 Single source of truth for all question attempts
- 🧠 More training data = better recommendations
- 🛠️ Easy to maintain and extend

## Technical Implementation

### Files Modified

1. **`lib/db/queries.ts`**
   - Added `saveTestQuestionStats()` function
   - Converts test format to unified question_stats format

2. **`app/api/tests/attempts/route.ts`**
   - Imports `saveTestQuestionStats`
   - Calls it after test completion
   - Includes error handling

3. **Documentation**
   - Updated `ADAPTIVE_LEARNING.md`
   - Updated `ADAPTIVE_LEARNING_ARCHITECTURE.md`
   - Created this integration guide

### Code Changes

```typescript
// In /api/tests/attempts when completing a test
const completedAttempt = await completeTestAttempt(
  attemptId,
  score,
  accuracy,
  timeTakenSeconds,
  questions
);

// NEW: Save individual question stats for smart practice
try {
  await saveTestQuestionStats(userId, attemptId, questions);
} catch (error) {
  console.error('Error saving test question stats:', error);
  // Don't fail the request if question stats fail
}
```

### Database Impact

- No schema changes needed ✅
- Uses existing `question_stats` table ✅
- No migrations required ✅
- Backwards compatible ✅

## Testing the Feature

### Step 1: Complete a Test
1. Log in as a parent
2. Create a test at `/tests/create`
3. Log in as a child
4. Take the test at `/tests`
5. Intentionally get some questions wrong

### Step 2: Check Data
Query the database to verify question stats were saved:
```sql
SELECT * FROM question_stats 
WHERE user_id = 'YOUR_CHILD_ID' 
ORDER BY created_at DESC;
```

You should see entries with:
- `session_id` matching test attempt ID
- Individual questions from the test
- Correct/incorrect status

### Step 3: Use Smart Practice
1. Go to `/practice` as the child
2. Click "Start Oefensessie"
3. Verify that questions from the test appear
4. Check that weak questions appear more frequently

### Step 4: Verify Integration
1. Complete more games and tests
2. Return to smart practice
3. Confirm that both sources contribute to recommendations

## Troubleshooting

### Smart practice not showing test questions

**Check:**
- Test was completed (not just started)
- Question stats were saved successfully
- Check server logs for errors
- Verify question_stats table has entries

**Solution:**
```sql
-- Verify test data exists
SELECT COUNT(*) FROM question_stats 
WHERE session_id IN (
  SELECT id FROM test_attempts WHERE user_id = 'YOUR_USER_ID'
);
```

### Questions from tests not weighted correctly

**Check:**
- Multiple attempts exist for the same question
- Accuracy rate is being calculated correctly
- Weak question threshold is met (seen ≥2 times)

**Solution:**
```sql
-- Check weak questions analysis
SELECT 
  num1, num2, operation,
  COUNT(*) as times_seen,
  AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) as accuracy
FROM question_stats
WHERE user_id = 'YOUR_USER_ID'
GROUP BY num1, num2, operation
HAVING COUNT(*) >= 2;
```

### Test completion fails

**Note:** If `saveTestQuestionStats()` fails, the test completion still succeeds! The error is logged but doesn't block the response.

**Check:**
- Server logs for specific error
- Database connection
- Question format compatibility

## Future Enhancements

Possible improvements:
- Track per-question time in tests
- Show data source in analytics (game vs test)
- Parent dashboard showing test contribution to learning
- Weighted importance (tests vs casual games)
- Time-decay for older question attempts
- Separate practice mode for test preparation

## Summary

✅ **Tests now contribute to smart practice**
✅ **No breaking changes**
✅ **Faster weak area detection**
✅ **More comprehensive learning data**
✅ **Better practice recommendations**

The integration is seamless and requires no user action - it just works! 🎉
