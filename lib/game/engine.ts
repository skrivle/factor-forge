export interface Question {
  num1: number;
  num2: number;
  answer: number;
}

export interface GameConfig {
  allowedTables: number[]; // Specific multiplication tables to use
  questionCount: number;
  timePerQuestion: number; // in seconds
  decreaseTime: boolean; // for parent mode
}

export interface GameState {
  questions: Question[];
  currentQuestionIndex: number;
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  startTime: number;
  endTime?: number;
  userAnswers: (number | null)[];
  combo: number;
  timeLeft: number;
}

// Custom tables: 1, 2, 3, 4, 5, 8, and 10
const ALLOWED_TABLES = [1, 2, 3, 4, 5, 8, 10];

export const DIFFICULTY_CONFIGS = {
  child: {
    allowedTables: ALLOWED_TABLES,
    questionCount: 20,
    timePerQuestion: 60,
    decreaseTime: false,
  } as GameConfig,
  parent: {
    allowedTables: ALLOWED_TABLES,
    questionCount: 20,
    timePerQuestion: 5,
    decreaseTime: true,
  } as GameConfig,
};

export function generateQuestion(allowedTables: number[]): Question {
  // Pick any multiplier from 1 to 10 (first number)
  const num1 = Math.floor(Math.random() * 10) + 1;
  // Pick a random table from allowed tables (second number)
  const num2 = allowedTables[Math.floor(Math.random() * allowedTables.length)];
  return {
    num1,
    num2,
    answer: num1 * num2,
  };
}

// Helper function to shuffle an array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateQuestions(config: GameConfig): Question[] {
  const { allowedTables, questionCount } = config;
  const questions: Question[] = [];
  const usedQuestions = new Set<string>();
  
  // First, create a complete set of all possible questions
  // For each multiplier (1-10), multiply by allowed tables (1,2,3,4,5,8,10)
  const baseQuestions: Question[] = [];
  
  for (let multiplier = 1; multiplier <= 10; multiplier++) {
    for (const table of allowedTables) {
      baseQuestions.push({
        num1: multiplier,
        num2: table,
        answer: multiplier * table,
      });
    }
  }
  
  // Shuffle the base questions (10 multipliers × 7 tables = 70 unique questions)
  const shuffledBase = shuffleArray(baseQuestions);
  
  // Take questions from shuffled pool, avoiding exact duplicates
  for (const question of shuffledBase) {
    if (questions.length >= questionCount) break;
    
    const key = `${question.num1}x${question.num2}`;
    if (!usedQuestions.has(key)) {
      questions.push(question);
      usedQuestions.add(key);
    }
  }
  
  // If we still need more questions (unlikely with current settings), generate random unique ones
  let attempts = 0;
  const maxAttempts = 1000;
  
  while (questions.length < questionCount && attempts < maxAttempts) {
    attempts++;
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = allowedTables[Math.floor(Math.random() * allowedTables.length)];
    const key = `${num1}x${num2}`;
    
    if (!usedQuestions.has(key)) {
      questions.push({
        num1,
        num2,
        answer: num1 * num2,
      });
      usedQuestions.add(key);
    }
  }
  
  // Final shuffle to randomize the order
  return shuffleArray(questions.slice(0, questionCount));
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function calculateScore(
  correctAnswers: number,
  combo: number,
  timeBonus: number
): number {
  const baseScore = correctAnswers * 10;
  const comboBonus = combo * 5;
  return baseScore + comboBonus + timeBonus;
}

export function getTimeForQuestion(
  questionIndex: number,
  baseTime: number,
  decreaseTime: boolean
): number {
  if (!decreaseTime) return baseTime;
  
  // Decrease time by 0.2 seconds per question, minimum 2 seconds
  const decrease = questionIndex * 0.2;
  return Math.max(2, baseTime - decrease);
}
