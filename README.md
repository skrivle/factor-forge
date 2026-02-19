# Factor Forge ⚡

A competitive, family-oriented multiplication practice app focused on speed, accuracy, and daily habits. Built with Next.js, TypeScript, and Vercel ecosystem.

## Features

- 🎮 **Active Recall Gameplay** - No multiple choice, type your answers
- ⚡ **Speed-Focused** - Auto-submit on correct answer, instant feedback
- 🔥 **Combo System** - Build streaks for bonus points with fire effects
- 🏆 **Family Leaderboard** - Compete with family members
- 📊 **Daily Streaks** - Track and maintain your practice habits
- 🎯 **Adaptive Difficulty** - Different modes for kids (1-12 tables) and adults (2-20 tables with decreasing time)
- 🧠 **Adaptive Learning** - AI-powered practice sessions that focus on your weak areas (NEW!)
- 🎨 **Arcade Vibe** - Dark mode with neon colors and animations
- 🔊 **Sound Effects** - Browser-native synth tones for feedback
- 📱 **Cross-Device** - Works on desktop and mobile with on-screen numpad

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Vercel Postgres (or Neon)
- **Auth**: NextAuth.js (Credentials Provider with name + 4-digit PIN)
- **Styling**: Tailwind CSS + Shadcn UI
- **Animations**: Framer Motion
- **Deployment**: Vercel

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Database (Vercel Postgres)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
```

Generate a secret key:
```bash
openssl rand -base64 32
```

### 3. Set Up Database

**Automated Setup (Recommended):**

The project uses an automated migration system. Just start the dev server and migrations will run automatically:

```bash
npm run dev
```

Migrations run automatically and set up all required tables!

**Manual Setup (Legacy):**

1. Create a Neon database (Vercel Postgres is deprecated)
2. Copy the connection string to your `.env.local` as `POSTGRES_URL`
3. Run migrations manually:

```bash
npm run db:migrate
```

**See `MIGRATIONS.md` for complete documentation on the migration system.**

### 4. Create Your First User

Since this is a family app with simple PIN authentication, you'll need to manually create users in the database:

```sql
INSERT INTO users (name, pin, role)
VALUES 
  ('Dad', '1234', 'parent'),
  ('Mom', '5678', 'parent'),
  ('Alice', '1111', 'child'),
  ('Bob', '2222', 'child');
```

**Security Note**: In a production environment, PINs should be hashed. For a family app on a private network, plain text may be acceptable.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with a user name and PIN.

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth routes
│   │   ├── game/         # Game session saving
│   │   ├── leaderboard/  # Leaderboard data
│   │   └── user/         # User stats
│   ├── auth/signin/      # Sign-in page
│   ├── game/             # Game page
│   ├── leaderboard/      # Leaderboard page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   ├── game/             # Game components
│   │   ├── GameArena.tsx # Main game logic
│   │   └── Numpad.tsx    # On-screen numpad
│   └── ui/               # Shadcn UI components
├── lib/
│   ├── db/               # Database utilities
│   │   ├── client.ts     # Database client & types
│   │   └── queries.ts    # Database queries
│   ├── game/             # Game logic
│   │   ├── engine.ts     # Game engine & question generation
│   │   └── sounds.ts     # Sound effects
│   └── auth.ts           # NextAuth configuration
├── db/
│   └── schema.sql        # Database schema
└── types/
    └── next-auth.d.ts    # NextAuth type extensions
```

## Game Modes

**Custom Tables**: All modes now use multiplication tables 1, 2, 3, 4, 5, 8, and 10.

### Child Mode
- Tables: 1, 2, 3, 4, 5, 8, 10
- Time: 60 seconds total (fixed)
- Questions: 20

### Parent Mode
- Tables: 1, 2, 3, 4, 5, 8, 10
- Time: Starts at 5 seconds per question, decreases by 0.2s each question (minimum 2s)
- Questions: 20

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Set up Neon database (recommended) or Vercel Postgres
5. Run the schema SQL in your database
6. Deploy!

### Database Setup on Vercel

If using Neon (recommended):
1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string
4. Add to Vercel environment variables
5. Use the Vercel-Neon integration for automatic setup

## Features Breakdown

### Auto-Submit Logic
The game checks your answer on every keystroke. As soon as you type the correct answer, it automatically moves to the next question with a success animation.

### Combo System
- Get 5 correct answers in a row → Fire emoji appears 🔥
- Combo bonus adds to your final score
- Wrong answer resets combo to 0

### Daily Streaks
- Play every day to maintain your streak
- Yesterday = increment streak
- Same day = maintain streak  
- Miss a day = reset to 1

### Leaderboard
- **All-Time**: Best score, current streak, total correct answers
- **Weekly**: Total weekly score, games played, average accuracy

## Development

### Add More Components

```bash
npx shadcn@latest add [component-name]
```

### Database Queries

All database queries are in `lib/db/queries.ts`. Add new queries there as needed.

## Troubleshooting

### Database Connection Issues
- Ensure your `.env.local` has correct database credentials
- Check if the database is accessible from your network
- Verify the schema has been run

### Authentication Issues
- Ensure `NEXTAUTH_SECRET` is set
- Check that users exist in the database with correct PINs
- Clear browser cookies and try again

### Build Errors
- Run `npm run build` to check for TypeScript errors
- Ensure all dependencies are installed
- Check that environment variables are set

## Future Enhancements

- [ ] Add user registration flow (parent approval)
- [ ] Calendar heatmap for streak visualization
- [ ] Achievement system
- [ ] Custom table selection
- [ ] Timed challenges
- [ ] Division/addition/subtraction modes
- [ ] PWA support for offline play
- [ ] Dark/light mode toggle
- [ ] Sound on/off toggle
- [ ] Export statistics as CSV

## Contributing

This is a family project, but feel free to fork and customize for your own family!

## License

MIT

---

**Built with ❤️ for families who love math!**
