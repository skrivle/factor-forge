# Adaptive Learning Feature - Implementation Guide

## Overview
This feature tracks which questions users answer incorrectly and creates personalized practice sessions focusing on their weak areas.

## How It Works

### 1. Question-Level Tracking
- Every question answered during a game is tracked with:
  - Question details (num1, num2, operation)
  - User's answer
  - Correctness (correct/incorrect)
  - Time taken to answer
  - Session reference

### 2. Weak Question Detection
- The system analyzes user performance to identify weak questions
- **Data sources:**
  - Regular game sessions
  - Test attempts (toetsen)
  - Practice sessions
- Questions are considered "weak" if:
  - Seen at least 2 times
  - Answered incorrectly more often than correctly
- Weak questions are ranked by:
  - Accuracy rate (ascending)
  - Number of incorrect attempts (descending)

### 3. Adaptive Question Generation
- Practice sessions use weighted question selection:
  - Questions with <50% accuracy get 10x weight
  - Questions with 50-75% accuracy get 5x weight
  - Questions with 75-90% accuracy get 3x weight
  - 70% of questions come from weak areas
  - 30% of questions are random (for variety)

### 4. Practice Mode
- Dedicated practice mode accessible from home page
- Shows user their weak question count
- Requires minimum data (5 weak questions) before activating
- Same game mechanics as regular mode
- Results are saved and update weak question analysis

## Database Schema

### New Table: `question_stats`
```sql
CREATE TABLE question_stats (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_id UUID REFERENCES sessions(id),
  num1 INTEGER NOT NULL,
  num2 INTEGER NOT NULL,
  operation TEXT NOT NULL,
  correct_answer INTEGER NOT NULL,
  user_answer INTEGER,
  is_correct BOOLEAN NOT NULL,
  time_taken DECIMAL,
  created_at TIMESTAMP
);
```

### View: `user_weak_questions`
Aggregates question statistics to identify weak areas per user.

## Files Modified/Created

### Database
- Question tracking tables defined in `lib/db/schema.ts`
- Migrations managed by Drizzle ORM in `drizzle/` folder

### Type Definitions
- `lib/db/client.ts` - Added QuestionStat and WeakQuestion types
- `lib/game/engine.ts` - Extended GameState with tracking fields

### Database Queries
- `lib/db/queries.ts` - Added:
  - `saveQuestionStats()` - Save detailed question performance from games
  - `saveTestQuestionStats()` - Save detailed question performance from tests
  - `getUserWeakQuestions()` - Get user's weak questions (from all sources)
  - `getQuestionStats()` - Get stats for specific question

### Game Logic
- `lib/game/engine.ts` - Added:
  - `generateAdaptiveQuestions()` - Smart question generation
  - `WeakQuestionData` type
  - Support for `preGeneratedQuestions` in GameConfig

### Components
- `components/game/GameArena.tsx` - Enhanced to track:
  - Time taken per question
  - Correctness per question
  - User answers per question

### Pages
- `app/practice/page.tsx` - New practice mode page
- `app/page.tsx` - Added "Slimme Oefening" button
- `app/game/page.tsx` - Updated to pass detailed stats

### API Routes
- `app/api/game/save/route.ts` - Enhanced to save question stats
- `app/api/tests/attempts/route.ts` - Enhanced to save test question stats
- `app/api/practice/weak-questions/route.ts` - New endpoint for fetching weak questions

## User Flow

1. **Normal Game Play & Tests**
   - User plays regular game OR completes a test
   - Each question answer is tracked in detail
   - Data saved to `question_stats` table
   - Both games and tests contribute to learning data

2. **Building History**
   - After 2+ game sessions with varied questions
   - System has enough data to identify patterns

3. **Practice Mode Activation**
   - User clicks "Slimme Oefening 🎯" on home page
   - System checks if enough weak questions exist (minimum 5)
   - If yes: Practice mode loads with adaptive questions
   - If no: Shows message to play more regular games

4. **Adaptive Practice**
   - 70% questions from weak areas (weighted by difficulty)
   - 30% random questions for variety
   - Same game mechanics and scoring
   - Results saved and improve future recommendations

5. **Continuous Improvement**
   - As user improves on weak questions, weights adjust
   - New weak questions detected automatically
   - Practice sessions always stay relevant

## Configuration

### Difficulty Weights
Located in `lib/game/engine.ts`:
```typescript
// Accuracy < 50% = 10x weight (most practice)
// Accuracy 50-75% = 5x weight (moderate practice)
// Accuracy 75-90% = 3x weight (light practice)
// Accuracy > 90% = 1x weight (occasional review)
```

### Mix Ratio
- 70% weak questions (high focus on improvement)
- 30% random questions (maintain variety and fun)

### Minimum Data Requirement
- At least 5 weak questions needed
- Questions must be seen at least 2 times
- Prevents premature practice recommendations

## Testing the Feature

1. **Database Setup**
   
   Migrations run automatically! Just start your dev server:
   ```bash
   npm run dev
   ```
   
   Or manually run migrations:
   ```bash
   npm run db:migrate
   ```

2. **Play Regular Games**
   - Play 3-5 normal game sessions
   - Intentionally answer some questions wrong
   - Vary which questions you miss

3. **Check Data**
   ```sql
   -- View your question stats
   SELECT * FROM question_stats WHERE user_id = 'YOUR_USER_ID';
   
   -- View your weak questions
   SELECT * FROM user_weak_questions WHERE user_id = 'YOUR_USER_ID';
   ```

4. **Try Practice Mode**
   - Go to home page
   - Click "Slimme Oefening 🎯"
   - Observe that weak questions appear more frequently
   - Complete practice and verify improvements

## Future Enhancements

Possible improvements:
- Show detailed analytics of weak areas
- Progress charts showing improvement over time
- Parent dashboard to view child's weak questions
- Customizable practice session length
- Achievement badges for conquering weak areas
- Spaced repetition scheduling
- Daily practice recommendations
- Question type breakdown (specific operations or number ranges)

## Troubleshooting

### Practice mode shows "Not enough data"
- Play at least 2-3 more game sessions
- Complete at least one test
- Ensure you're not getting 100% correct every time
- Check `question_stats` table has entries

### Same questions keep appearing
- This is expected - weak questions should appear frequently
- As you improve, weights will adjust automatically
- Mix includes 30% random questions for variety

### Questions aren't being tracked
- Check API response in browser dev tools
- Verify `saveQuestionStats` or `saveTestQuestionStats` is being called
- Check for database connection errors in server logs

## Test Integration

### How Tests Contribute to Smart Practice

The adaptive learning system now integrates data from **both regular games AND tests** to provide comprehensive learning insights:

#### Data Collection
When a child completes a test:
1. Test completion is saved to `test_attempts` table
2. Each individual question is also saved to `question_stats` table
3. Question stats include: num1, num2, operation, correct/incorrect, user's answer

#### Unified Analysis
- The `getUserWeakQuestions()` query analyzes ALL entries in `question_stats`
- This includes data from:
  - Regular game sessions
  - Test attempts
  - Practice sessions
- The system treats all question attempts equally, regardless of source

#### Benefits
- **More comprehensive data**: Tests often cover specific topics thoroughly
- **Faster weak area detection**: Tests provide many data points at once
- **Better recommendations**: More data = more accurate smart practice
- **Consistent learning**: Practice mode reinforces both game and test material

#### Example Scenario
1. Child completes a test with 20 questions
2. Struggles with 3×8, 6×7, and 9×4 (gets them wrong)
3. These questions are now tracked in `question_stats`
4. Next time they use "Slimme Oefening" (Smart Practice):
   - These weak questions will appear more frequently
   - They're weighted the same as questions from regular games
   - The practice adapts as they improve

#### Implementation Details
- Function: `saveTestQuestionStats()` in `lib/db/queries.ts`
- Called by: `/api/tests/attempts` when test is completed
- Format: Converts test question format to question_stats format
- Session ID: Uses test attempt ID for traceability

This integration ensures that all learning activities contribute to the child's adaptive learning profile!
