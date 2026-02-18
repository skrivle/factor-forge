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

// Custom tables: 1, 2, 3, 4, 5, and 8
const ALLOWED_TABLES = [1, 2, 3, 4, 5, 8];

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
  // Pick random numbers from the allowed tables
  const num1 = allowedTables[Math.floor(Math.random() * allowedTables.length)];
  const num2 = allowedTables[Math.floor(Math.random() * allowedTables.length)];
  return {
    num1,
    num2,
    answer: num1 * num2,
  };
}

export function generateQuestions(config: GameConfig): Question[] {
  const questions: Question[] = [];
  for (let i = 0; i < config.questionCount; i++) {
    questions.push(generateQuestion(config.allowedTables));
  }
  return questions;
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
