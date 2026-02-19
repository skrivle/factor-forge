#!/bin/bash

# Migration script to add adaptive learning feature
# Run this script to update your database with the new question tracking tables

echo "🚀 Starting Adaptive Learning Feature Migration..."
echo ""

# Check if POSTGRES_URL is set
if [ -z "$POSTGRES_URL" ]; then
    echo "❌ Error: POSTGRES_URL environment variable is not set"
    echo "Please set it with: export POSTGRES_URL='your-postgres-connection-string'"
    exit 1
fi

echo "✅ Found POSTGRES_URL"
echo ""

# Run the migration
echo "📊 Creating question_stats table and views..."
psql "$POSTGRES_URL" -f db/migrations/003_add_question_stats.sql

# Check if migration succeeded
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Start your development server: npm run dev"
    echo "2. Play a few game sessions to generate data"
    echo "3. Try the new 'Slimme Oefening' (Smart Practice) mode"
    echo ""
    echo "📖 For more information, see ADAPTIVE_LEARNING.md"
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
