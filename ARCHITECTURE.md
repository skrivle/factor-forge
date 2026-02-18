# Factor Forge - Architecture Documentation

## System Overview

Factor Forge is a full-stack multiplication practice application built with the Vercel ecosystem, emphasizing speed, simplicity, and family collaboration.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (Browser)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Home Page   │  │  Game Arena  │  │ Leaderboard  │      │
│  │              │  │              │  │              │      │
│  │  - Stats     │  │  - Questions │  │  - Rankings  │      │
│  │  - Streak    │  │  - Timer     │  │  - Stats     │      │
│  │  - CTA       │  │  - Numpad    │  │  - Filters   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                     NextAuth.js                              │
│                     (Session)                                │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              │ HTTPS
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    Next.js App Router                        │
│                    (Server Components)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/auth    │  │ /api/game    │  │/api/leaderboard│    │
│  │              │  │              │  │              │      │
│  │ - Sign In    │  │ - Save Score │  │ - All-Time   │      │
│  │ - Sign Out   │  │ - Update     │  │ - Weekly     │      │
│  │ - Session    │  │   Stats      │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                     Database Layer                           │
│                     (lib/db/queries.ts)                      │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              │ SQL
                              │
┌─────────────────────────────▼───────────────────────────────┐
│              PostgreSQL (Neon/Vercel Postgres)              │
│                                                              │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  users   │  │  sessions    │  │  user_stats  │         │
│  │          │  │              │  │              │         │
│  │ - name   │  │ - score      │  │ - streak     │         │
│  │ - pin    │  │ - accuracy   │  │ - best_score │         │
│  │ - role   │  │ - difficulty │  │ - total      │         │
│  └──────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack Details

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Component Library**: Shadcn UI
- **Animations**: Framer Motion
- **Type Safety**: TypeScript 5

### Backend
- **Runtime**: Node.js (Vercel Edge Functions)
- **API Routes**: Next.js App Router API Routes
- **Authentication**: NextAuth.js v5 (beta)
- **Database Client**: @vercel/postgres (SQL)

### Database
- **Primary**: Neon (recommended)
- **Alternative**: Vercel Postgres (deprecated but working)
- **Schema**: PostgreSQL with UUID primary keys
- **ORM**: None (raw SQL for simplicity)

### Deployment
- **Platform**: Vercel
- **Build System**: Turbopack
- **CDN**: Vercel Edge Network
- **Environment**: Edge Functions

## Data Flow

### 1. User Authentication Flow

```
User → Sign In Page → Enter Name + PIN
                ↓
        NextAuth Credentials Provider
                ↓
        Verify PIN (lib/db/queries.ts)
                ↓
        Create JWT Session
                ↓
        Store in Cookie
                ↓
        Redirect to Home
```

### 2. Game Session Flow

```
User → Start Game → GameArena Component
                         ↓
              Generate 20 Questions
                         ↓
              Start Timer & Game Loop
                         ↓
              User Types Answer
                         ↓
              Check on Each Keystroke
                         ↓
            ┌─────────────┴──────────────┐
            │                            │
         Correct                      Wrong
            │                            │
     Play Sound                   Play Sound
     Show Animation               Show Animation
     Update Combo                 Reset Combo
     Next Question                Clear Input
            │                            │
            └─────────────┬──────────────┘
                          ↓
                  All Questions Done
                          ↓
                  Calculate Score
                          ↓
              POST /api/game/save
                          ↓
           Update Database (sessions, user_stats)
                          ↓
              Show Results Screen
```

### 3. Leaderboard Flow

```
User → Leaderboard Page
            ↓
    Select: All-Time / Weekly
            ↓
    GET /api/leaderboard?type=...
            ↓
    Database Query (JOIN users + stats)
            ↓
    Return Sorted Results
            ↓
    Render with Animations
```

## Database Schema

### Tables

#### `users`
```sql
id              UUID PRIMARY KEY
name            TEXT UNIQUE NOT NULL
pin             TEXT NOT NULL (4 digits)
role            TEXT ('parent' | 'child')
created_at      TIMESTAMP
```

#### `sessions`
```sql
id              UUID PRIMARY KEY
user_id         UUID (FK to users)
score           INTEGER
accuracy        DECIMAL
difficulty_level TEXT ('easy' | 'medium' | 'hard')
completed_at    TIMESTAMP
```

#### `user_stats`
```sql
user_id                 UUID PRIMARY KEY (FK to users)
current_streak          INTEGER
last_played_date        DATE
best_score              INTEGER
total_correct_answers   INTEGER
```

### Relationships
- `sessions.user_id` → `users.id` (ON DELETE CASCADE)
- `user_stats.user_id` → `users.id` (ON DELETE CASCADE)

### Indexes
- `idx_sessions_user_id` on `sessions(user_id)`
- `idx_sessions_completed_at` on `sessions(completed_at)`
- `idx_user_stats_user_id` on `user_stats(user_id)`

## Component Architecture

### Client Components
All game and interactive components are client-side:

```
app/
├── page.tsx (Client) - Home with user stats
├── game/page.tsx (Client) - Game wrapper
├── leaderboard/page.tsx (Client) - Leaderboard with tabs
└── auth/signin/page.tsx (Client) - Sign in form

components/
├── game/
│   ├── GameArena.tsx (Client) - Main game logic
│   └── Numpad.tsx (Client) - On-screen keyboard
└── AuthProvider.tsx (Client) - NextAuth session wrapper
```

### Server Components
API routes are server-side:

```
app/api/
├── auth/[...nextauth]/route.ts - NextAuth handlers
├── game/save/route.ts - Save game session
├── leaderboard/route.ts - Fetch rankings
└── user/stats/route.ts - Fetch user stats
```

## Game Engine Design

### Question Generation
```typescript
// Pseudocode
function generateQuestion(minTable, maxTable) {
  num1 = random(minTable, maxTable)
  num2 = random(minTable, maxTable)
  return { num1, num2, answer: num1 * num2 }
}
```

### Auto-Submit Logic
```typescript
// On every keystroke
useEffect(() => {
  if (userInput === correctAnswer) {
    handleCorrect()
    moveToNextQuestion()
  }
}, [userInput])
```

### Timer System
```typescript
// Decrease time based on difficulty
if (role === 'parent') {
  timePerQuestion = max(2, 5 - (questionIndex * 0.2))
} else {
  timePerQuestion = 60 // total time for all questions
}
```

### Scoring Algorithm
```typescript
score = (correctAnswers * 10) + (combo * 5) + timeBonus
```

## Authentication Design

### Session Management
- **Type**: JWT (signed, httpOnly cookie)
- **Duration**: 30 days (NextAuth default)
- **Storage**: Browser cookie
- **Validation**: On each protected API call

### Credentials Provider
```typescript
authorize(credentials) {
  1. Validate PIN format (4 digits)
  2. Query database for user
  3. Compare PIN (plain text for now)
  4. Return user object or null
}
```

### Protected Routes
Middleware checks session for:
- `/` (home)
- `/game`
- `/leaderboard`
- `/api/*` (except `/api/auth/*`)

## State Management

### No Global State Library
We use React's built-in state:

1. **URL State**: Next.js routing
2. **Server State**: NextAuth session
3. **Local State**: useState for UI
4. **Form State**: Controlled components

### Why No Redux/Zustand?
- Simple app with minimal shared state
- NextAuth provides auth state
- Each page fetches its own data
- No need for complex state management

## Performance Optimizations

### Frontend
1. **Code Splitting**: Automatic via Next.js
2. **Image Optimization**: Next.js Image component
3. **Font Optimization**: next/font with Geist
4. **CSS**: Tailwind with PurgeCSS
5. **Animations**: Hardware-accelerated via Framer Motion

### Backend
1. **Database Indexes**: On frequently queried columns
2. **Connection Pooling**: Via Neon/Vercel Postgres
3. **Edge Functions**: Low latency via Vercel Edge
4. **No N+1 Queries**: Use JOINs for leaderboard

### Database
1. **Indexes**: Added on foreign keys and dates
2. **Proper Data Types**: UUID, INTEGER, DECIMAL
3. **Cascading Deletes**: Automatic cleanup

## Security Considerations

### Current Implementation
- ✅ HTTPS everywhere (Vercel)
- ✅ JWT signing with secret
- ✅ SQL injection prevention (@vercel/postgres escapes)
- ✅ XSS prevention (React auto-escapes)
- ⚠️ Plain text PINs (acceptable for family use)
- ⚠️ No rate limiting (low risk for family)

### Production Recommendations
1. **Hash PINs**: Use bcrypt (see DEPLOYMENT.md)
2. **Rate Limiting**: Use Upstash Redis
3. **CAPTCHA**: On sign-in page
4. **CORS**: Already handled by Next.js
5. **CSP Headers**: Add to next.config.ts

## Scalability

### Current Limits
- **Users**: ~100 family members (easy)
- **Games/day**: ~1000 (no problem)
- **Database**: 10 GB free tier (years of data)
- **API Requests**: Unlimited on Vercel Hobby

### Scale Beyond Family
If expanding to schools or public:
1. **Database**: Upgrade Neon or use connection pooling
2. **Caching**: Add Redis for leaderboard
3. **CDN**: Already using Vercel Edge
4. **Load Balancing**: Automatic with Vercel

## Error Handling

### Frontend
- Try-catch on API calls
- Fallback UI for errors
- Toast notifications (could add)

### Backend
- API routes return proper HTTP codes
- Database errors caught and logged
- NextAuth errors shown on sign-in page

### Database
- Transactions for critical operations
- Constraints prevent invalid data
- Foreign keys ensure referential integrity

## Testing Strategy

### Manual Testing Checklist
- [ ] Sign in with valid credentials
- [ ] Sign in with invalid credentials
- [ ] Play a full game (child mode)
- [ ] Play a full game (parent mode)
- [ ] View leaderboard (all-time)
- [ ] View leaderboard (weekly)
- [ ] Check streak increments
- [ ] Check combo system works
- [ ] Test keyboard input
- [ ] Test numpad on mobile
- [ ] Test timer countdown
- [ ] Test auto-submit

### Future: Automated Testing
- Unit tests: Game engine logic
- Integration tests: API routes
- E2E tests: Playwright/Cypress

## Monitoring & Observability

### Built-in (Free)
- Vercel deployment logs
- Vercel Analytics (enable in settings)
- Neon query performance dashboard
- Browser DevTools

### Recommended Additions
- Sentry for error tracking
- PostHog for analytics
- Custom logging to Vercel logs

## Future Enhancements

See README.md for full list. Key architectural changes:

1. **User Registration**: Add registration flow with parent approval
2. **Real-time**: WebSockets for live leaderboard updates
3. **Offline Mode**: PWA with service worker
4. **Mobile Apps**: React Native wrapper
5. **AI Tutor**: Adaptive difficulty based on performance

## Development Workflow

```bash
# Local development
npm run dev

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build (production)
npm run build

# Preview production build
npm start
```

## Deployment Workflow

```bash
# Connect to Vercel
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

Or use GitHub integration for automatic deployments.

## Environment Variables

### Required
- `NEXTAUTH_SECRET`: JWT signing key
- `NEXTAUTH_URL`: App URL
- `POSTGRES_URL`: Database connection

### Optional
- `POSTGRES_PRISMA_URL`: For connection pooling
- `POSTGRES_URL_NON_POOLING`: For migrations
- Database credentials (if not using URL)

---

## Conclusion

Factor Forge is intentionally simple and focused. The architecture prioritizes:
1. **Ease of deployment** (one-click to Vercel)
2. **Maintainability** (minimal dependencies, clear structure)
3. **Family-friendly** (no complex auth, simple UI)
4. **Extensibility** (easy to add features later)

For questions, see README.md or DEPLOYMENT.md.
