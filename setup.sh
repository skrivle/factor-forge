#!/bin/bash

# Factor Forge Setup Script

echo "🎮 Factor Forge Setup Script"
echo "=============================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "📝 Creating .env.local file..."
  echo ""
  
  # Generate a random secret
  SECRET=$(openssl rand -base64 32)
  
  cat > .env.local << EOF
NEXTAUTH_SECRET=$SECRET
NEXTAUTH_URL=http://localhost:3000

# Database (Vercel Postgres or Neon)
# Add your database connection strings here
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
EOF
  
  echo "✅ .env.local created with a generated NEXTAUTH_SECRET"
  echo ""
else
  echo "⚠️  .env.local already exists, skipping..."
  echo ""
fi

echo "📋 Next Steps:"
echo "1. Add your database connection strings to .env.local"
echo "2. Run the schema: cat db/schema.sql (then execute in your database)"
echo "3. Create your first users in the database"
echo "4. Run: npm run dev"
echo ""
echo "🚀 Happy coding!"
