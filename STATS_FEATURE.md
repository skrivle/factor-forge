# User Progress Visualization Feature

## Overview
The stats page provides comprehensive visualizations and insights into user progress, performance trends, and areas for improvement.

## Location
Access via: `/stats` or click "Jouw Voortgang 📊" button on the home page.

## Features

### 1. Progress Overview (4 Key Metrics)
Visual cards displaying:
- **Huidige Reeks** (Current Streak) - With fire emoji for 3+ day streaks
- **Beste Score** (Best Score) - Highest score achieved
- **Totaal Correct** (Total Correct) - Total correct answers across all games
- **Spellen Gespeeld** (Games Played) - Total number of sessions

### 2. Performance Insights 💡
Advanced analytics showing:
- **Score Trend** - Compares recent (last 5 games) vs earlier performance
  - Shows average score and trend direction (🚀 improving, 📈 slight improvement, ➡️ stable, 📉 declining)
- **Accuracy Trend** - Tracks improvement in answer accuracy
  - Shows percentage change compared to earlier games
- **Consistency** - Measures performance stability
  - Ratings: Uitstekend (Excellent), Goed (Good), Gemiddeld (Average), Variabel (Variable)
  - Based on score variance analysis
- **Weekly Activity** - Games played in the last 7 days
  - Encouragement messages based on play frequency

### 3. Score Progress Chart 📈
Interactive line chart showing:
- Score per game session (purple line)
- 5-game rolling average (green dashed line)
- Date labels for each game
- Hover for detailed information

### 4. Accuracy Trend Chart 🎯
Line chart tracking:
- Accuracy percentage over time
- Area fill for visual emphasis
- Clear trend visualization

### 5. Performance by Difficulty 🎚️
Bar chart comparing:
- Average scores across Easy, Medium, and Hard difficulties
- Color-coded bars (green, yellow, red)
- Game counts for each difficulty level
- Helps users understand their strength areas

### 6. Recent Games List 🎮
Detailed list of last 10 games showing:
- Difficulty level (color-coded badge)
- Date and time (smart formatting: "Vandaag", "Gisteren", or date)
- Score (color-coded by performance)
- Accuracy percentage
- Animated appearance

### 7. Weak Areas Chart 🎓
Horizontal bar chart displaying:
- Top 10 weakest questions (lowest accuracy)
- Question format (e.g., "7 × 8", "54 ÷ 9")
- Accuracy percentage for each question
- Color coding:
  - Red: < 50% accuracy
  - Yellow: 50-75% accuracy
  - Green: 75%+ accuracy
- Hover shows: times seen and times incorrect
- Direct link to "Slimme Oefening" feature

## Technical Implementation

### Page Structure
```
/app/stats/page.tsx (Server Component)
├── Fetches user sessions (last 50 games)
├── Fetches user stats
├── Calculates current streak
└── Renders client components with data
```

### Components Created

#### 1. `ProgressOverview.tsx`
- 4-card grid layout
- Animated entrance (framer-motion)
- Responsive design (2 cols mobile, 4 cols desktop)

#### 2. `PerformanceInsights.tsx`
- Advanced calculations:
  - Recent vs older averages
  - Trend analysis
  - Consistency scoring (using standard deviation)
  - Weekly activity counting
- Dynamic color coding
- Motivational messaging

#### 3. `StatsCharts.tsx`
- Uses Chart.js and react-chartjs-2
- Three chart types:
  - Line charts for score/accuracy trends
  - Bar chart for difficulty comparison
- Rolling average calculation
- Custom styling for dark theme
- Responsive height

#### 4. `WeakAreasChart.tsx`
- Fetches weak questions from API
- Horizontal bar chart (better for question labels)
- Dynamic color coding based on accuracy
- Custom tooltips with extra info

#### 5. `RecentGamesList.tsx`
- Scrollable list of recent games
- Smart date formatting
- Animated list items
- Color-coded difficulty and performance

### Dependencies Added
```json
{
  "chart.js": "^latest",
  "react-chartjs-2": "^latest"
}
```

## Data Requirements

### Minimum Data Thresholds
- **Basic Stats**: Available immediately (even with 0 games)
- **Charts**: Require at least 1 game
- **Performance Insights**: Require at least 5 games (for trend analysis)
- **Weak Areas**: Require at least 5 games with question stats

### Data Sources
1. **Sessions Table**: Score, accuracy, difficulty, timestamp
2. **User Stats Table**: Best score, total correct answers
3. **Question Stats Table**: Question-level performance (for weak areas)

## User Benefits

### For Students
- **Visual Progress Tracking**: See improvement over time
- **Motivation**: Trends and achievements visible
- **Targeted Practice**: Identify weak areas quickly
- **Goal Setting**: Personal records to beat

### For Parents
- **Monitor Progress**: Understand child's learning trajectory
- **Identify Gaps**: See which operations need more practice
- **Celebrate Success**: Track streaks and improvements
- **Informed Guidance**: Data-driven decisions on practice focus

## Navigation
- Added to home page as "Jouw Voortgang 📊" button
- Cyan color scheme for visual distinction
- NavigationButtons component for easy return

## Responsive Design
- Mobile-first approach
- Grid layouts adapt: 2 cols → 4 cols
- Charts maintain aspect ratio
- Text sizes scale: sm:text-xl, text-lg
- Touch-friendly spacing

## Color Scheme
Chart colors match app theme:
- Purple: Primary scores/trends
- Green: Averages/success
- Blue: Accuracy metrics
- Orange: Streaks/activity
- Red/Yellow/Green: Difficulty/performance levels

## Performance Considerations
- Server-side data fetching (fast initial load)
- Client-side rendering for interactive charts
- Efficient queries (indexes on user_id, completed_at)
- Batch data fetching with Promise.all
- Lazy chart rendering (only when data available)

## Future Enhancements
Potential additions:
- Export stats as PDF/image
- Compare with family members
- Monthly/yearly reports
- Achievement badges based on stats
- Practice recommendations based on charts
- Time-of-day performance analysis
- Question category breakdown
- Learning velocity metrics

## Testing the Feature

1. **With No Games**:
   - Shows empty state message
   - Overview shows zeros
   - Clean, encouraging UI

2. **With 1-4 Games**:
   - Shows basic charts
   - No insights yet (need 5+ games)
   - Recent games list appears

3. **With 5+ Games**:
   - Full feature set unlocked
   - Performance insights calculated
   - Trends become meaningful
   - Weak areas identified

4. **With Mixed Difficulties**:
   - Difficulty comparison chart shows all levels
   - Can see strength areas
   - Balanced view of performance

## Accessibility
- High contrast colors
- Clear labels and legends
- Semantic HTML structure
- Keyboard navigation support (chart tooltips)
- Screen reader friendly text

## Mobile Experience
- Optimized for small screens
- Swipeable charts
- Stacked layouts
- Readable font sizes
- Touch-friendly controls
