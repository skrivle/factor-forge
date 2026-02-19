export type OperationType = 'multiplication' | 'division';

export interface Question {
  num1: number;
  num2: number;
  answer: number;
  operation: OperationType;
}

export interface GameConfig {
  allowedTables: number[]; // Specific multiplication tables to use
  questionCount: number;
  timePerQuestion: number; // in seconds
  decreaseTime: boolean; // for parent mode
  operations: OperationType[]; // Which operations to include
  preGeneratedQuestions?: Question[]; // Optional pre-generated questions for practice mode
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
  timeTaken: (number | null)[]; // Track time taken per question
  isCorrectAnswers: boolean[]; // Track if each answer was correct
  questionStartTime: number; // Track when current question started
}

// Custom tables: 1, 2, 3, 4, 5, 8, and 10
const ALLOWED_TABLES = [1, 2, 3, 4, 5, 8, 10];

export const DIFFICULTY_CONFIGS = {
  child: {
    allowedTables: ALLOWED_TABLES,
    questionCount: 20,
    timePerQuestion: 60,
    decreaseTime: false,
    operations: ['multiplication', 'division'] as OperationType[],
  } as GameConfig,
  parent: {
    allowedTables: ALLOWED_TABLES,
    questionCount: 20,
    timePerQuestion: 5,
    decreaseTime: true,
    operations: ['multiplication', 'division'] as OperationType[],
  } as GameConfig,
};

export function generateQuestion(allowedTables: number[], operations: OperationType[] = ['multiplication']): Question {
  // Pick a random operation from allowed operations
  const operation = operations[Math.floor(Math.random() * operations.length)];
  
  // Pick any multiplier from 1 to 10 (first number)
  const multiplier = Math.floor(Math.random() * 10) + 1;
  // Pick a random table from allowed tables (second number)
  const table = allowedTables[Math.floor(Math.random() * allowedTables.length)];
  
  if (operation === 'division') {
    // For division: result ÷ table = multiplier
    // Example: 3 × 8 = 24 becomes 24 ÷ 8 = 3
    const result = multiplier * table;
    return {
      num1: result,
      num2: table,
      answer: multiplier,
      operation: 'division',
    };
  } else {
    // Multiplication: multiplier × table = result
    return {
      num1: multiplier,
      num2: table,
      answer: multiplier * table,
      operation: 'multiplication',
    };
  }
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
  const { allowedTables, questionCount, operations } = config;
  const questions: Question[] = [];
  const usedQuestions = new Set<string>();
  
  // Define weights for each table (lower weight = less frequent)
  // Tables 1, 2, 10 get very low weight, others get much higher weight
  const tableWeights: Record<number, number> = {
    1: 0.5,
    2: 1,
    3: 5,
    4: 5,
    5: 5,
    8: 5,
    10: 0.5,
  };
  
  // Define weights for multipliers (the first number)
  // 1, 2, 10 get very low weight, others get higher weight
  const multiplierWeights: Record<number, number> = {
    1: 0.5,
    2: 1,
    3: 5,
    4: 5,
    5: 5,
    6: 5,
    7: 5,
    8: 5,
    9: 5,
    10: 0.5,
  };
  
  // Create a weighted pool of questions
  // Each question appears multiple times based on both table and multiplier weights
  const weightedQuestions: Question[] = [];
  
  for (let multiplier = 1; multiplier <= 10; multiplier++) {
    for (const table of allowedTables) {
      // Combine both weights (multiply them together)
      const tableWeight = tableWeights[table] || 1;
      const multiplierWeight = multiplierWeights[multiplier] || 1;
      const combinedWeight = Math.round(tableWeight * multiplierWeight);
      
      // For each operation type, create questions
      for (const operation of operations) {
        let question: Question;
        
        if (operation === 'division') {
          // Division: result ÷ table = multiplier
          const result = multiplier * table;
          question = {
            num1: result,
            num2: table,
            answer: multiplier,
            operation: 'division',
          };
        } else {
          // Multiplication: multiplier × table = result
          question = {
            num1: multiplier,
            num2: table,
            answer: multiplier * table,
            operation: 'multiplication',
          };
        }
        
        // Add the question 'combinedWeight' times to increase its probability
        for (let i = 0; i < combinedWeight; i++) {
          weightedQuestions.push(question);
        }
      }
    }
  }
  
  // Shuffle the weighted pool
  const shuffledWeighted = shuffleArray(weightedQuestions);
  
  // Take questions from shuffled pool, avoiding exact duplicates
  for (const question of shuffledWeighted) {
    if (questions.length >= questionCount) break;
    
    const key = `${question.num1}${question.operation === 'division' ? '÷' : 'x'}${question.num2}`;
    if (!usedQuestions.has(key)) {
      questions.push(question);
      usedQuestions.add(key);
    }
  }
  
  // If we still need more questions (unlikely with current settings), 
  // generate from weighted pool to maintain distribution
  let attempts = 0;
  const maxAttempts = 1000;
  
  while (questions.length < questionCount && attempts < maxAttempts) {
    attempts++;
    
    // Select operation
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    // Select table with weighted probability
    const totalTableWeight = allowedTables.reduce((sum, t) => sum + (tableWeights[t] || 1), 0);
    let randomTable = Math.random() * totalTableWeight;
    let selectedTable = allowedTables[0];
    
    for (const table of allowedTables) {
      randomTable -= (tableWeights[table] || 1);
      if (randomTable <= 0) {
        selectedTable = table;
        break;
      }
    }
    
    // Select multiplier with weighted probability
    const allMultipliers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const totalMultiplierWeight = allMultipliers.reduce((sum, m) => sum + (multiplierWeights[m] || 1), 0);
    let randomMultiplier = Math.random() * totalMultiplierWeight;
    let selectedMultiplier = 1;
    
    for (const multiplier of allMultipliers) {
      randomMultiplier -= (multiplierWeights[multiplier] || 1);
      if (randomMultiplier <= 0) {
        selectedMultiplier = multiplier;
        break;
      }
    }
    
    let question: Question;
    const key = operation === 'division' 
      ? `${selectedMultiplier * selectedTable}÷${selectedTable}`
      : `${selectedMultiplier}x${selectedTable}`;
    
    if (!usedQuestions.has(key)) {
      if (operation === 'division') {
        const result = selectedMultiplier * selectedTable;
        question = {
          num1: result,
          num2: selectedTable,
          answer: selectedMultiplier,
          operation: 'division',
        };
      } else {
        question = {
          num1: selectedMultiplier,
          num2: selectedTable,
          answer: selectedMultiplier * selectedTable,
          operation: 'multiplication',
        };
      }
      questions.push(question);
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
  decreaseTime: boolean,
  question?: Question
): number {
  let time = baseTime;
  
  if (decreaseTime) {
    // Decrease time by 0.2 seconds per question, minimum 2 seconds
    const decrease = questionIndex * 0.2;
    time = Math.max(2, baseTime - decrease);
  }
  
  // Add extra time for multi-digit answers
  if (question) {
    const answerLength = question.answer.toString().length;
    if (answerLength === 2) {
      time += 1.5; // Add 1.5 seconds for 2-digit answers
    } else if (answerLength >= 3) {
      time += 2.5; // Add 2.5 seconds for 3+ digit answers
    }
  }
  
  return time;
}

// Adaptive question generation based on user's weak areas
export interface WeakQuestionData {
  num1: number;
  num2: number;
  operation: 'multiplication' | 'division';
  accuracy_rate: number;
  times_incorrect: number;
}

export function generateAdaptiveQuestions(
  config: GameConfig,
  weakQuestions: WeakQuestionData[]
): Question[] {
  const { questionCount, operations } = config;
  const questions: Question[] = [];
  const usedQuestions = new Set<string>();
  
  // If we have weak questions, create a weighted pool
  if (weakQuestions.length > 0) {
    const weightedQuestions: Question[] = [];
    
    // Add weak questions with high weight based on how poorly they were answered
    weakQuestions.forEach(wq => {
      // Calculate weight: lower accuracy = higher weight
      // Questions with <50% accuracy get 10x weight, 50-75% get 5x, 75-90% get 3x
      let weight = 1;
      if (wq.accuracy_rate < 0.5) {
        weight = 10;
      } else if (wq.accuracy_rate < 0.75) {
        weight = 5;
      } else if (wq.accuracy_rate < 0.9) {
        weight = 3;
      }
      
      const question: Question = {
        num1: wq.num1,
        num2: wq.num2,
        operation: wq.operation,
        answer: wq.operation === 'division' ? wq.num1 / wq.num2 : wq.num1 * wq.num2,
      };
      
      // Add this question multiple times based on weight
      for (let i = 0; i < weight; i++) {
        weightedQuestions.push(question);
      }
    });
    
    // Also add some normal questions (30% of total) for variety
    const normalQuestionCount = Math.floor(questionCount * 0.3);
    const normalQuestions = generateQuestions({
      ...config,
      questionCount: normalQuestionCount * 2, // Generate more to ensure variety
    });
    
    // Shuffle and pick from weighted weak questions (70% of total)
    const weakQuestionCount = questionCount - normalQuestionCount;
    const shuffledWeak = shuffleArray(weightedQuestions);
    
    // Add weak questions (avoiding duplicates)
    for (const q of shuffledWeak) {
      if (questions.length >= weakQuestionCount) break;
      const key = `${q.num1}${q.operation === 'division' ? '÷' : 'x'}${q.num2}`;
      if (!usedQuestions.has(key)) {
        questions.push(q);
        usedQuestions.add(key);
      }
    }
    
    // Fill remaining with normal questions
    for (const q of normalQuestions) {
      if (questions.length >= questionCount) break;
      const key = `${q.num1}${q.operation === 'division' ? '÷' : 'x'}${q.num2}`;
      if (!usedQuestions.has(key)) {
        questions.push(q);
        usedQuestions.add(key);
      }
    }
    
    // If still need more, generate additional questions
    while (questions.length < questionCount) {
      const newQ = generateQuestion(config.allowedTables, operations);
      const key = `${newQ.num1}${newQ.operation === 'division' ? '÷' : 'x'}${newQ.num2}`;
      if (!usedQuestions.has(key)) {
        questions.push(newQ);
        usedQuestions.add(key);
      }
    }
    
    // Final shuffle to randomize order
    return shuffleArray(questions);
  }
  
  // If no weak questions data, fall back to normal generation
  return generateQuestions(config);
}
