# Adaptive Learning System - Architecture Diagram

## Data Collection Flow

The system collects question-level data from **two main sources**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA SOURCE 1: GAMES                              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    GameArena Component                               │
│  • Tracks each question answered                                     │
│  • Records: answer, correctness, time taken                          │
│  • Collects all data during session                                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Game Ends → onGameEnd()                          │
│  • Score, accuracy, questions, answers                               │
│  • isCorrectAnswers[], timeTaken[]                                   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  POST /api/game/save                                 │
│  • Saves session summary                                             │
│  • Calls saveQuestionStats()                                         │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               └───────────────┐
                                               │
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA SOURCE 2: TESTS                              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Test Taking Page                                  │
│  • User answers test questions                                       │
│  • Records: answer for each question                                 │
│  • Tracks progress through test                                      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Test Ends → submitTest()                         │
│  • Score, accuracy, questions with answers                           │
│  • questionsWithAnswers[{question, userAnswer, isCorrect}]          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  POST /api/tests/attempts                            │
│  • Saves test attempt summary                                        │
│  • Calls completeTestAttempt()                                       │
│  • Calls saveTestQuestionStats() ⭐ NEW!                             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               └───────────────┐
                                               │
                                               ▼
                                    ┌──────────────────┐
                                    │  UNIFIED STORAGE │
                                    └──────────┬───────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Database: question_stats                            │
│  • Stores individual question performance from ALL sources           │
│  • Links to user_id and session_id (can be game or test)            │
│  • Fields: num1, num2, operation, is_correct, time_taken             │
│  • Unified storage for games, tests, and practice sessions           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Analysis & Aggregation                             │
│  • Analyzes ALL question_stats entries                               │
│  • Groups by (user_id, num1, num2, operation)                        │
│  • Calculates: accuracy_rate, times_incorrect                        │
│  • Filters: questions seen >= 2 times                                │
│  • Source-agnostic: treats game and test data equally                │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│              USER CLICKS "SLIMME OEFENING" 🎯                        │
└──────────────────────────────┬──────────────────────────────────────┘
```
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│               GET /api/practice/weak-questions                       │
│  • Fetches weak questions for user                                   │
│  • Returns: weakQuestions[], hasEnoughData                           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
                        ┌──────┴──────┐
                        │             │
                 hasEnoughData?       │
                        │             │
            ┌───────────┼────────┐    │
            │           │        │    │
           NO          YES       │    │
            │           │        │    │
            ▼           ▼        │    │
    ┌──────────┐  ┌──────────┐  │    │
    │ Show     │  │ Generate │  │    │
    │ "Need    │  │ Adaptive │  │    │
    │ More     │  │ Questions│  │    │
    │ Data"    │  └─────┬────┘  │    │
    │ Message  │        │        │    │
    └──────────┘        │        │    │
                        ▼        │    │
            ┌───────────────────────────────┐
            │ generateAdaptiveQuestions()   │
            │                               │
            │ Weight Assignment:            │
            │  • <50% accuracy  = 10x       │
            │  • 50-75% accuracy = 5x       │
            │  • 75-90% accuracy = 3x       │
            │  • >90% accuracy  = 1x        │
            │                               │
            │ Mix: 70% weak + 30% random    │
            └──────────┬────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  Practice Session    │
            │  (GameArena)         │
            │  • Uses weighted     │
            │    question pool     │
            │  • Same game UX      │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  Save Results        │
            │  (back to top)       │
            │  • Updates stats     │
            │  • Refines analysis  │
            └──────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  Continuous          │
            │  Improvement Loop    │
            │  • User gets better  │
            │  • Weights adjust    │
            │  • New weak areas    │
            │    identified        │
            └──────────────────────┘
```

## Data Flow Example

### Example 1: User Struggles with 3×8 (Mixed Sources)

```
Game Session 1: 3×8 = ?
├─> User answers: 21 (wrong)
├─> Saves via saveQuestionStats()
└─> question_stats: { 3, 8, multiplication, false, session_id: game123 }

Test Attempt: 3×8 = ?
├─> User answers: 23 (wrong)  
├─> Saves via saveTestQuestionStats() ⭐ NEW!
└─> question_stats: { 3, 8, multiplication, false, session_id: test456 }

Game Session 2: 3×8 = ?
├─> User answers: 24 (correct!)
├─> Saves via saveQuestionStats()
└─> question_stats: { 3, 8, multiplication, true, session_id: game789 }

Analysis (combines ALL sources):
├─> times_seen: 3 (2 from games, 1 from test)
├─> times_incorrect: 2
├─> accuracy_rate: 0.33 (33%)
└─> WEIGHT: 10x (high priority for practice!)

Practice Session:
├─> 3×8 appears ~7 times out of 20 questions
├─> User practices intensively
└─> Accuracy improves → weight decreases
```

### Example 2: Test Provides Rich Data Quickly

```
Child completes a test with 20 questions:
├─> Gets wrong: 3×8, 6×7, 9×4, 7×6, 8×9
├─> Gets correct: other 15 questions
└─> ALL 20 questions saved to question_stats

Immediate Smart Practice Benefits:
├─> 5 weak questions identified from single test
├─> No need to wait for multiple game sessions
├─> Smart Practice can activate immediately
└─> Practice focuses on these 5 weak areas

Next Test or Game:
├─> More data for existing weak questions
├─> Refined accuracy rates
└─> Better practice recommendations
```

### Example 2: User Masters 2×5

```
Sessions 1-5: 2×5 = ?
├─> All correct
├─> Average time: 1.8s
└─> accuracy_rate: 1.00 (100%)

Analysis:
├─> times_seen: 5
├─> times_incorrect: 0
├─> accuracy_rate: 1.00
└─> WEIGHT: 1x (occasional review only)

Practice Session:
├─> 2×5 appears ~1 time out of 20 questions
├─> Just for maintenance
└─> Focus stays on harder questions
```

## Database Schema Visual

```
┌──────────────────────┐
│      users           │
├──────────────────────┤
│ id (PK)              │◄───┐
│ name                 │    │
│ pin                  │    │
│ role                 │    │
└──────────────────────┘    │
                            │
┌──────────────────────┐    │
│     sessions         │    │
├──────────────────────┤    │
│ id (PK)              │◄───┼───┐
│ user_id (FK)         │────┘   │
│ score                │        │
│ accuracy             │        │
│ completed_at         │        │
└──────────────────────┘        │
                                │
┌───────────────────────────────┼────┐
│     question_stats            │    │
├───────────────────────────────┼────┤
│ id (PK)                       │    │
│ user_id (FK)                  │────┘
│ session_id (FK)               │────┘
│ num1                          │
│ num2                          │
│ operation                     │
│ correct_answer                │
│ user_answer                   │
│ is_correct                    │
│ time_taken                    │
│ created_at                    │
└───────────────────────────────┘
        │
        │ (aggregated by)
        │
        ▼
┌──────────────────────────────┐
│  user_weak_questions (VIEW)  │
├──────────────────────────────┤
│ user_id                      │
│ num1                         │
│ num2                         │
│ operation                    │
│ times_seen                   │
│ times_incorrect              │
│ accuracy_rate                │
│ avg_time_taken               │
└──────────────────────────────┘
```

## Code Flow

### 1. During Game
```typescript
GameArena.tsx:
  handleAnswer(answer) →
    • Calculate timeTaken
    • Update userAnswers[i]
    • Update isCorrectAnswers[i]
    • Update timeTaken[i]
    • Move to next question

  onGameEnd() →
    • Return all collected data
    • { questions, userAnswers, isCorrectAnswers, timeTaken }
```

### 2. Saving Results
```typescript
/api/game/save:
  • Save session summary
  • Call saveQuestionStats(userId, sessionId, details)
  
lib/db/queries.ts:
  saveQuestionStats() →
    • Loop through all questions
    • Insert into question_stats
    • One row per question
```

### 3. Practice Mode
```typescript
/practice page:
  • Fetch weak questions via API
  • Generate adaptive questions
  • Start GameArena with preGeneratedQuestions

lib/game/engine.ts:
  generateAdaptiveQuestions(config, weakQuestions) →
    • Calculate weights per question
    • Build weighted pool
    • Mix 70% weak + 30% random
    • Shuffle and return
```

## Performance Considerations

- **Indexes**: Added on (user_id, num1, num2, operation)
- **Batch Inserts**: All questions saved in one transaction
- **View Caching**: Aggregation happens at query time
- **Lazy Loading**: Weak questions fetched only when needed

## Security

- All endpoints check authentication
- User can only access own question stats
- Database queries use parameterized statements
- No sensitive data exposed in responses

## Test Integration Implementation Details

### New Function: `saveTestQuestionStats()`

Located in `lib/db/queries.ts`, this function converts test attempt data into the unified question_stats format:

```typescript
export async function saveTestQuestionStats(
  userId: string,
  testAttemptId: string,
  questions: any[]
) {
  // Extract question data from test attempt format
  const values = questions.map(item => ({
    user_id: userId,
    session_id: testAttemptId, // Test attempt ID used as session reference
    num1: item.question.num1,
    num2: item.question.num2,
    operation: item.question.operation,
    correct_answer: item.question.answer,
    user_answer: item.userAnswer,
    is_correct: item.isCorrect,
    time_taken: null, // Tests don't track per-question time
  }));

  // Insert all question stats
  for (const stat of values) {
    await sql`INSERT INTO question_stats (...)`;
  }
}
```

### API Integration

Modified `/api/tests/attempts` route to call the new function:

```typescript
// In POST /api/tests/attempts when action === 'complete'
const completedAttempt = await completeTestAttempt(...);

// Save individual question stats for smart practice
await saveTestQuestionStats(userId, attemptId, questions);

return NextResponse.json({ attempt: completedAttempt });
```

### Data Format Compatibility

**Test Questions Format (input):**
```javascript
[
  {
    question: { num1: 3, num2: 8, operation: 'multiplication', answer: 24 },
    userAnswer: 21,
    isCorrect: false
  },
  // ... more questions
]
```

**Question Stats Format (output):**
```javascript
{
  user_id: 'uuid',
  session_id: 'test-attempt-uuid',
  num1: 3,
  num2: 8,
  operation: 'multiplication',
  correct_answer: 24,
  user_answer: 21,
  is_correct: false,
  time_taken: null
}
```

### Benefits of Unified Storage

1. **Single Source of Truth**: All question performance data in one table
2. **Simplified Analysis**: One query analyzes all data regardless of source
3. **Consistent Weights**: Test and game data weighted equally in practice mode
4. **Faster Learning**: Tests provide many data points quickly
5. **Traceability**: session_id links back to original test attempt or game session

### Key Implementation Points

- ✅ No changes needed to existing game question tracking
- ✅ No changes needed to smart practice algorithm
- ✅ Tests automatically contribute to weak question detection
- ✅ Backwards compatible with existing data
- ✅ Error handling prevents test completion failure if stats fail to save
