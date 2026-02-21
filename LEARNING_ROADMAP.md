# Learning Science Roadmap 🧠

> Prioritized improvements to transform Factor Forge from a practice app into an effective learning system

**Last Updated:** February 20, 2026

---

## 📊 Current State Assessment

### ✅ What's Working Well
- **Active recall** - No multiple choice, kids must produce answers
- **Immediate feedback** - They know right away if they're correct
- **Gamification** - Streaks, combos, leaderboard create motivation
- **Adaptive practice** - Focusing on weak questions is excellent
- **Progress tracking** - Visual feedback helps maintain motivation

### ⚠️ Key Gaps
- No spaced repetition for long-term retention
- Limited question format variety (only `a × b = ?` format)
- Binary feedback (correct/incorrect) without explanation
- No mastery-based progression system
- Parents can't see which specific facts kids struggle with
- No confidence ratings to identify lucky guesses vs true knowledge

### 🎮 Current Modes
1. **Game Mode** (`/game`) - Timed, competitive, leaderboard-tracked
2. **Tafel Oefening** (`/exercise`) - Choose specific table, untimed practice
3. **Slimme Oefening** (`/practice`) - Adaptive practice on weak areas, untimed

---

## 🎯 Prioritized Feature Roadmap

### **Tier 1: Critical Learning Science Improvements** ⭐⭐⭐
*High impact on actual learning, worth doing first*

#### 1. Spaced Repetition System (SRS)
**Why:** Most research-backed method for long-term retention. Currently, the app focuses heavily on weak questions immediately, but learning science shows that spacing out review over time is more effective than massed practice.

**Impact:** 🔥🔥🔥 High - transforms short-term performance into durable knowledge

**Effort:** ⚙️⚙️ Medium

**Implementation Details:**
- Add database table to track review schedule for each fact per user
- Implement SM-2 or similar algorithm (intervals: 1 day, 3 days, 7 days, 14 days, 30 days)
- Questions answered correctly "graduate" to longer intervals
- Questions answered incorrectly reset to shorter intervals
- Create "Daily Review" mode that pulls due facts from the schedule
- Show badge/stat: "X facts mastered" (facts at 30+ day interval)

**Database Schema:**
```sql
CREATE TABLE spaced_repetition_schedule (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  num1 INT NOT NULL,
  num2 INT NOT NULL,
  operation VARCHAR(20) NOT NULL,
  interval_days INT DEFAULT 1,
  easiness_factor FLOAT DEFAULT 2.5,
  next_review_date TIMESTAMP NOT NULL,
  repetitions INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Success Metrics:**
- Retention rate after 7, 14, 30 days
- Number of facts that reach 30-day interval

---

#### 2. Rich Explanatory Feedback
**Why:** Wrong answers are prime learning opportunities. Research shows that explanatory feedback significantly improves learning compared to binary correct/incorrect. Currently, kids only see ❌ or ✅ without understanding WHY.

**Impact:** 🔥🔥🔥 High - helps kids understand *why* they're wrong

**Effort:** ⚙️⚙️ Medium

**Implementation Details:**
- For incorrect answers, show:
  - Correct answer with explanation
  - Strategy hint based on the specific fact
  - Related fact they might know (scaffolding)
- For correct answers (especially in learning modes):
  - Occasional strategy reinforcement
  - Pattern recognition ("Notice: 8×4 is double of 8×2!")
- Add to all three modes (Game, Exercise, Practice)
- In Game mode: brief explanation (2 seconds)
- In Exercise/Practice modes: longer explanation with "Got it!" button

**Example Explanations:**
```typescript
const explanations = {
  multiplication: {
    general: (num1, num2, answer) => 
      `${num1} × ${num2} = ${answer}. Think: ${num1} groups of ${num2}`,
    patterns: {
      "x2": "Double it!",
      "x5": "Half of x10",
      "x10": "Just add a zero",
      "x9": "One less than x10",
      "x4": "Double, then double again",
      "x8": "Double three times"
    }
  },
  division: {
    general: (num1, num2, answer) => 
      `${num1} ÷ ${num2} = ${answer}. Think: How many groups of ${num2} fit in ${num1}?`,
    connection: (num1, num2, answer) =>
      `Because ${answer} × ${num2} = ${num1}`
  }
};
```

**Success Metrics:**
- Improvement rate after seeing explanations
- Reduction in repeated errors on same fact
- User preference in settings (can be toggled on/off)

---

#### 3. Confidence Ratings
**Why:** Builds metacognitive awareness. Helps identify "lucky guesses" vs true knowledge. Kids learn to monitor their own understanding.

**Impact:** 🔥🔥🔥 High - improves self-awareness and data quality

**Effort:** ⚙️ Low - quick addition

**Implementation Details:**
- After typing answer, before seeing if correct:
  - Show 3 emoji buttons: 😟 Not sure | 😐 Maybe | 😊 Confident
  - Quick tap/click (don't slow down flow)
- Track confidence alongside correctness
- Create 4 quadrants:
  1. Confident + Correct = ✅ Mastered
  2. Confident + Wrong = ⚠️ Misconception (needs explanation)
  3. Unsure + Correct = 🎲 Lucky guess (needs more practice)
  4. Unsure + Wrong = 📚 Still learning
- Show in parent dashboard: "80% of correct answers were confident"
- Use in spaced repetition: confident+correct = longer interval

**Database Addition:**
```sql
ALTER TABLE question_stats 
ADD COLUMN confidence_level INT; -- 1=unsure, 2=maybe, 3=confident
```

**Success Metrics:**
- Correlation between confidence and correctness
- Growth in confident+correct answers over time
- Improved self-awareness (confidence calibration)

---

### **Tier 2: Enhanced Learning Features** ⭐⭐
*Good learning outcomes, medium effort*

#### 4. Question Format Variety
**Why:** Seeing the same format (a × b = ?) creates pattern matching, not true understanding. Variety builds flexible knowledge.

**Impact:** 🔥🔥 Medium-High - improves transfer and retention

**Effort:** ⚙️⚙️ Medium

**Implementation Details:**
- Three formats per fact:
  1. Standard: `6 × 8 = ?`
  2. Missing factor 1: `? × 8 = 48`
  3. Missing factor 2: `6 × ? = 48`
- Mix formats within sessions (not all one type)
- Track performance by format (some kids struggle more with missing factors)
- UI: Different input hint based on format

**Technical Changes:**
```typescript
interface Question {
  num1: number;
  num2: number;
  answer: number;
  operation: OperationType;
  format: 'standard' | 'missing-factor-1' | 'missing-factor-2'; // NEW
}
```

**Success Metrics:**
- Performance across different formats
- Transfer to division problems

---

#### 5. Confidence Ratings
**Why:** Builds metacognitive awareness. Helps identify "lucky guesses" vs true knowledge. Kids learn to monitor their own understanding.

**Impact:** 🔥🔥 Medium - improves self-awareness and data quality

**Effort:** ⚙️ Low

**Implementation Details:**
- After typing answer, before seeing if correct:
  - Show 3 emoji buttons: 😟 Not sure | 😐 Maybe | 😊 Confident
  - Quick tap/click (don't slow down flow)
- Track confidence alongside correctness
- Create 4 quadrants:
  1. Confident + Correct = ✅ Mastered
  2. Confident + Wrong = ⚠️ Misconception (needs explanation)
  3. Unsure + Correct = 🎲 Lucky guess (needs more practice)
  4. Unsure + Wrong = 📚 Still learning
- Show in parent dashboard: "80% of correct answers were confident"

**Database Addition:**
```sql
ALTER TABLE question_stats 
ADD COLUMN confidence_level INT; -- 1=unsure, 2=maybe, 3=confident
```

**Success Metrics:**
- Correlation between confidence and correctness
- Growth in confident+correct answers over time

---

#### 6. Parent Dashboard
**Why:** Parents are partners in learning. They need visibility into specific struggles to provide targeted help.

**Impact:** 🔥🔥🔥 High - enables targeted help at home

**Effort:** ⚙️⚙️ Medium

**Implementation Details:**
- New route: `/parent-dashboard` (requires parent role)
- Overview: All children's stats side-by-side
- Per child:
  - **Struggle Facts**: Top 10 facts with <60% accuracy (sortable)
  - **Confidence Patterns**: Confident vs unsure performance
  - **Progress Trend**: Week-over-week improvement
  - **Time Patterns**: Best/worst time of day
  - **Spaced Repetition Status**: How many facts "mastered"
  - **Recommended Focus**: "Practice 6×7, 8×7, 9×7 this week"
- Export button: Download CSV of child's data

**New API Endpoints:**
- `GET /api/parent/children-overview`
- `GET /api/parent/child/:id/weak-facts`
- `GET /api/parent/child/:id/progress`

**Success Metrics:**
- Parent engagement (how often they check)
- Correlation between parent dashboard usage and child improvement

---

#### 7. Mastery-Based Table Progression
**Why:** Cognitive load theory shows that limiting scope improves learning. Ensures solid foundations before adding complexity.

**Impact:** 🔥🔥 Medium-High - especially for beginners

**Effort:** ⚙️⚙️ Medium

**Implementation Details:**
- User profile adds: `unlocked_tables` array
- New users start with: [2, 3, 5] (easiest tables)
- Unlock criteria: 90%+ accuracy over last 3 sessions for current tables
- Unlock order: 2, 3, 5 → 4 → 10 → 8 (hardest last)
- Visual unlock celebration: "🎉 You unlocked the 4 times table!"
- Option for parents to override (some kids may know tables already)
- "Challenge Mode" still uses all tables (for advanced kids)

**Database Addition:**
```sql
ALTER TABLE users 
ADD COLUMN unlocked_tables INT[] DEFAULT ARRAY[2, 3, 5];
```

**Success Metrics:**
- Time to unlock each table
- Accuracy before vs after unlocking new table
- Overall mastery rate (% of unlocked facts mastered)

---

### **Tier 3: UX & Motivation Enhancements** ⭐
*Improves engagement and stickiness*

#### 8. Smart Streak Recovery
**Why:** Research on habit formation shows that "all-or-nothing" thinking kills motivation. Allow minor failures without destroying progress.

**Impact:** 🔥 Medium - reduces discouragement

**Effort:** ⚙️ Low

**Implementation Details:**
- Allow 1 "streak freeze" per week (use it to protect your streak)
- Or: "Streak revival" - spend earned stars to revive streak within 48 hours
- Show visual indicator: "❄️ Freeze available" or "💫 Revival available"
- Still encourage daily practice, but don't punish occasional misses
- Track "perfect weeks" separately (7/7 days) for high achievers

**Success Metrics:**
- Streak retention rate
- Long-term engagement (30+ day retention)

---

#### 9. Achievement System
**Why:** Different kids are motivated by different things. Achievements recognize diverse progress beyond just "high score."

**Impact:** 🔥 Medium - broadens motivation beyond leaderboard

**Effort:** ⚙️⚙️ Medium

**Implementation Details:**
- Badge categories:
  - **Consistency**: "7 Day Streak", "30 Day Streak", "Perfect Week"
  - **Mastery**: "Mastered the 3's", "All Tables Unlocked", "100 Confident Answers"
  - **Volume**: "100 Questions Answered", "1000 Questions Answered"
  - **Learning**: "Turned a Red Fact Green", "Perfect Learning Session"
  - **Social**: "Family Challenge Winner", "Beat Your Best Score"
- Show badge collection page
- Notify on unlock with animation
- Show next badge progress: "3/5 perfect sessions for next badge"

**Database Table:**
```sql
CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_key VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_key)
);
```

**Success Metrics:**
- Badge unlock rate
- Correlation between badge unlocks and continued engagement

---

#### 10. Visual/Conceptual Representations (Optional)
**Why:** Some kids are visual learners. Seeing the concept helps understanding, especially for younger children.

**Impact:** 🔥 Low-Medium - benefits some learning styles

**Effort:** ⚙️⚙️⚙️ High

**Implementation Details:**
- Toggle in settings: "Show visual hints"
- For small facts (≤5×5), show:
  - Array model: Grid of dots
  - Group model: 3 groups of 4 stars
  - Bar model: Three bars of 4 units
- Animation: Build the array as hint
- Don't show for timed mode (too distracting)
- Available in learning mode only

**Success Metrics:**
- Preference rate (do kids turn it on/off?)
- Performance difference with/without visuals

---

### **Tier 4: Advanced Analytics** ⭐
*Nice to have, lower priority*

#### 11. Time-of-Day Performance Analysis
**Why:** Chronotype affects performance. Some kids learn better in morning, others in evening.

**Impact:** 🔥 Low - interesting insight, limited actionability

**Effort:** ⚙️ Low

**Implementation Details:**
- Track session timestamp
- Show chart: "Your accuracy by time of day"
- Insight: "You perform best between 7-9 PM"
- Recommend: "Try practicing around this time"

---

#### 12. Detailed Error Pattern Analysis
**Why:** Reveals systematic mistakes and conceptual gaps.

**Impact:** 🔥 Medium - reveals conceptual gaps

**Effort:** ⚙️⚙️ Medium

**Implementation Details:**
- Detect patterns:
  - "Off by one table": Consistently answers 6×7=48 (confusing with 6×8)
  - "Skip counting errors": 6, 12, 18, 24 → gets 6×5=35 wrong
  - "Commutative confusion": Knows 3×8 but not 8×3
- Show in dashboard: "Pattern detected: Often confuses 7's and 8's"
- Suggest: "Practice skip counting by 7s and 8s together"

---

#### 13. Collaborative Family Challenges
**Why:** Cooperation can be as motivating as competition.

**Impact:** 🔥 Low-Medium - fun but not core learning

**Effort:** ⚙️⚙️ Medium

**Implementation Details:**
- Weekly family goals:
  - "Get 500 correct answers together this week"
  - "Everyone maintain their streak"
  - "Unlock 3 new badges as a family"
- Progress shown on home page
- Reward: Special family badge or unlock special theme
- Builds team mentality vs only competition

---

### **Tier 5: Technical Improvements** ⚙️
*Behind-the-scenes enhancements*

#### 14. PWA Support
**Why:** Works offline, feels like native app, easier access.

**Impact:** 🔥 Low - convenience feature

**Effort:** ⚙️⚙️ Low-Medium

**Implementation Details:**
- Add manifest.json
- Service worker for offline support
- Cache questions locally
- Sync results when back online
- Install prompt for mobile devices

---

#### 15. Data Export
**Why:** Data portability, allows external analysis, builds trust.

**Impact:** 🔥 Low - power user feature

**Effort:** ⚙️ Low

**Implementation Details:**
- Button in settings: "Export My Data"
- CSV format with all sessions, questions, results
- Include: timestamps, accuracy, confidence, time taken
- Parents can import into spreadsheets for custom analysis

---

#### 16. Sound/Haptic Settings
**Why:** Accessibility and user preference.

**Impact:** 🔥 Low - quality of life

**Effort:** ⚙️ Low

**Implementation Details:**
- Settings page:
  - Sound: On/Off/Volume slider
  - Haptic: On/Off (mobile)
  - Animation: Full/Reduced/Off
- Persist per user in database

---

## 📅 Suggested Implementation Phases

### **Phase 1: Learning Foundation** (Weeks 1-3)
**Goal:** Transform from "practice app" to "learning system"

**Features:**
1. Spaced Repetition System (#1)
2. Rich Explanatory Feedback (#2)
3. Confidence Ratings (#3)

**Why This Order:**
- SRS is the foundation for long-term learning
- Explanatory feedback maximizes learning from mistakes
- Confidence ratings add valuable metacognitive dimension
- These three work together as a complete learning system

**Success Criteria:**
- SRS schedule populated with 50+ facts per child
- Kids seeing explanations and showing improvement on repeated errors
- Confidence ratings show improving calibration over time

---

### **Phase 2: Enhanced Intelligence** (Weeks 4-6)
**Goal:** Deepen learning and provide insights

**Features:**
4. Question Format Variety (#4)
5. Parent Dashboard (#6)
6. Mastery-Based Progression (#7)

**Why This Order:**
- Format variety builds on SRS foundation
- Parent dashboard synthesizes all the new data (confidence + SRS + weak areas)
- Mastery progression provides clear learning path

**Success Criteria:**
- Performance stable across all question formats
- Parents actively using dashboard
- Kids successfully unlocking new tables with celebration

---

### **Phase 3: Engagement & Polish** (Weeks 7-8)
**Goal:** Sustain long-term motivation

**Features:**
8. Smart Streak Recovery (#8)
9. Achievement System (#9)

**Why This Order:**
- Streak recovery prevents drop-off from all-or-nothing thinking
- Achievements celebrate diverse progress types (not just high scores)

**Success Criteria:**
- Streak survival rate improves by 30%
- Badge unlocks correlate with continued engagement
- Kids motivated by different achievement types

---

### **Phase 4: Nice-to-Have** (As time permits)
**Features:** #10-16 based on user feedback and usage patterns

---

## 🎯 Quick Wins (Implement Today)

If you want immediate improvements with minimal effort:

### 1. **Confidence Ratings** (1 hour)
- Add three emoji buttons after answer input: 😟 😐 😊
- Store confidence level (1-3) in question_stats table
- Don't analyze yet, just start collecting data
- Works across all modes (Game, Exercise, Practice)

### 2. **Basic Explanatory Feedback** (3 hours)
- On incorrect answer, show: "❌ The correct answer is X"
- Add simple strategy hints per table (store in config)
- Show for 2-3 seconds before moving on (Game mode)
- Show with "Got it!" button in Exercise/Practice modes

### 3. **Smart Streak Freeze** (1 hour)
- Add `streak_freezes_available` column to users (default 1)
- In streak calculation: if missed yesterday but have freeze, use it
- Show "❄️ Streak Freeze available" on home page
- Reset freezes to 1 every Monday

### 4. **Enhanced Exercise Stats** (2 hours)
- In Exercise mode, show running stats: "You're at 85% accuracy!"
- Add visual progress bar
- Show "Most missed: 7×8" in real-time
- Encourage kids with milestones: "10 in a row! 🔥"

**Total Time:** ~7 hours for meaningful improvements

**Recommended Order:** #1 → #2 → #3 (Start collecting confidence data while adding feedback)

---

## 📈 Success Metrics to Track

### Learning Outcomes (Primary)
- **Retention Rate**: Accuracy on facts after 7, 14, 30 days
- **Mastery Growth**: Number of facts reaching 30+ day SRS interval
- **Improvement Velocity**: Week-over-week accuracy gains
- **Confidence Calibration**: Correlation between confidence and correctness

### Engagement (Secondary)
- **Daily Active Users**: % of family using app each day
- **Session Length**: Time spent per session
- **Mode Usage**: Learning mode vs Game mode vs Practice mode
- **Streak Survival**: % maintaining 7+ day streaks

### Parent Involvement (Tertiary)
- **Dashboard Usage**: % of parents checking weekly
- **Targeted Practice**: Correlation between dashboard insights and practice focus

---

## 🔬 Research References

Key learning science principles applied:

1. **Spaced Repetition**: Ebbinghaus (1885), Cepeda et al. (2006)
2. **Retrieval Practice**: Roediger & Karpicke (2006)
3. **Interleaving**: Rohrer & Taylor (2007)
4. **Explanatory Feedback**: Hattie & Timperley (2007)
5. **Metacognition**: Flavell (1979), Dunlosky & Metcalfe (2009)
6. **Cognitive Load**: Sweller (1988)
7. **Desirable Difficulties**: Bjork (1994)

---

## 💬 Discussion Questions

Before implementing, consider:

1. **Age Range**: How old are your kids? Some features work better for different ages
2. **Current Struggles**: Which specific tables/facts do they struggle with most?
3. **Motivation**: What currently motivates them? Competition? Progress? Autonomy?
4. **Time Available**: How much daily practice time is realistic?
5. **Parent Involvement**: How much do you want to monitor vs let them be independent?

---

## ✅ Next Steps

1. Review this roadmap
2. Decide which phase to start with (recommend Phase 1)
3. Set up a simple project board (can use GitHub issues or simple checklist)
4. Start with one feature at a time
5. Test with your kids and iterate based on their feedback

**Ready to start? Let me know which feature you'd like to tackle first!**
