'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Numpad from './Numpad';
import {
  generateQuestions,
  calculateAccuracy,
  calculateScore,
  getTimeForQuestion,
  type GameConfig,
  type GameState,
  type Question,
} from '@/lib/game/engine';
import { playCorrectSound, playIncorrectSound, playComboSound } from '@/lib/game/sounds';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface GameArenaProps {
  config: GameConfig;
  onGameEnd: (stats: {
    score: number;
    accuracy: number;
    correctAnswers: number;
    incorrectAnswers: number;
  }) => void;
}

export default function GameArena({ config, onGameEnd }: GameArenaProps) {
  const [gameState, setGameState] = useState<GameState>(() => {
    const questions = generateQuestions(config);
    return {
      questions,
      currentQuestionIndex: 0,
      score: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      startTime: Date.now(),
      userAnswers: new Array(questions.length).fill(null),
      combo: 0,
      timeLeft: config.timePerQuestion,
    };
  });

  const [userInput, setUserInput] = useState('');
  const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];

  // Timer logic
  useEffect(() => {
    if (isGameOver) return;

    const timer = setInterval(() => {
      setGameState((prev) => {
        const newTimeLeft = prev.timeLeft - 0.1;
        
        if (newTimeLeft <= 0) {
          // Time's up for this question
          playIncorrectSound();
          setUserInput(''); // Clear input on timeout
          
          const isLastQuestion = prev.currentQuestionIndex >= prev.questions.length - 1;
          
          if (isLastQuestion) {
            setIsGameOver(true);
            return prev;
          }

          const nextTime = getTimeForQuestion(
            prev.currentQuestionIndex + 1,
            config.timePerQuestion,
            config.decreaseTime
          );

          return {
            ...prev,
            currentQuestionIndex: prev.currentQuestionIndex + 1,
            incorrectAnswers: prev.incorrectAnswers + 1,
            combo: 0,
            timeLeft: nextTime,
          };
        }

        return { ...prev, timeLeft: newTimeLeft };
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isGameOver, config]);

  // Handle game end
  useEffect(() => {
    if (isGameOver) {
      const accuracy = calculateAccuracy(
        gameState.correctAnswers,
        gameState.correctAnswers + gameState.incorrectAnswers
      );
      const finalScore = calculateScore(gameState.correctAnswers, gameState.combo, 0);

      onGameEnd({
        score: finalScore,
        accuracy,
        correctAnswers: gameState.correctAnswers,
        incorrectAnswers: gameState.incorrectAnswers,
      });
    }
  }, [isGameOver, gameState, onGameEnd]);

  const handleAnswer = useCallback(
    (answer: number) => {
      const isCorrect = answer === currentQuestion.answer;

      if (isCorrect) {
        playCorrectSound();
        setShowFeedback('correct');

        const newCombo = gameState.combo + 1;
        if (newCombo % 5 === 0) {
          playComboSound(newCombo);
        }

        // Show the correct answer for a moment before moving on
        setTimeout(() => {
          setUserInput(''); // Clear input
          setShowFeedback(null); // Remove feedback
          
          setGameState((prev) => {
            const isLastQuestion = prev.currentQuestionIndex >= prev.questions.length - 1;

            if (isLastQuestion) {
              setIsGameOver(true);
              return {
                ...prev,
                correctAnswers: prev.correctAnswers + 1,
                combo: newCombo,
              };
            }

            const nextTime = getTimeForQuestion(
              prev.currentQuestionIndex + 1,
              config.timePerQuestion,
              config.decreaseTime
            );

            return {
              ...prev,
              currentQuestionIndex: prev.currentQuestionIndex + 1,
              correctAnswers: prev.correctAnswers + 1,
              combo: newCombo,
              timeLeft: nextTime,
            };
          });
        }, 600); // Show correct feedback for 600ms
      } else {
        playIncorrectSound();
        setShowFeedback('incorrect');
        setGameState((prev) => ({
          ...prev,
          combo: 0,
        }));

        // Clear input and remove feedback after shake animation
        setTimeout(() => {
          setUserInput('');
          setShowFeedback(null);
        }, 500);
      }
    },
    [currentQuestion, gameState.combo, config]
  );

  // Auto-submit on correct answer OR show error on wrong answer
  useEffect(() => {
    if (userInput && currentQuestion) {
      const inputNum = parseInt(userInput, 10);
      const correctAnswer = currentQuestion.answer;
      const correctAnswerLength = correctAnswer.toString().length;
      
      // If input matches correct answer, submit immediately
      if (inputNum === correctAnswer) {
        handleAnswer(inputNum);
      }
      // If user typed enough digits and it's wrong, show error
      else if (userInput.length >= correctAnswerLength && inputNum !== correctAnswer) {
        handleAnswer(inputNum);
      }
    }
  }, [userInput, currentQuestion, handleAnswer]);

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;

      if (e.key >= '0' && e.key <= '9') {
        setUserInput((prev) => prev + e.key);
      } else if (e.key === 'Backspace') {
        setUserInput((prev) => prev.slice(0, -1));
      } else if (e.key === 'Escape') {
        setUserInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver]);

  const handleNumberClick = (num: string) => {
    setUserInput((prev) => prev + num);
  };

  const handleBackspace = () => {
    setUserInput((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setUserInput('');
  };

  const progress = ((gameState.currentQuestionIndex + 1) / gameState.questions.length) * 100;

  if (!currentQuestion || isGameOver) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Header Stats */}
        <div className="flex justify-between items-center mb-6 text-white">
          <div className="flex gap-6">
            <div>
              <div className="text-sm text-gray-400">Score</div>
              <div className="text-2xl font-bold text-green-400">{calculateScore(gameState.correctAnswers, gameState.combo, 0)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Combo</div>
              <div className="text-2xl font-bold text-orange-400 flex items-center gap-1">
                {gameState.combo}
                {gameState.combo >= 5 && <span className="animate-fire">🔥</span>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Tijd</div>
            <div className={`text-2xl font-bold ${gameState.timeLeft < 3 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
              {gameState.timeLeft.toFixed(1)}s
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-800 h-2 rounded-full mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Question Card */}
        <Card className={`border-2 bg-black/80 backdrop-blur-lg mb-6 transition-colors duration-200 ${
          showFeedback === 'incorrect' ? 'border-red-500 bg-red-500/10' : 
          showFeedback === 'correct' ? 'border-green-500 bg-green-500/10' : 
          'border-purple-500/30'
        }`}>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="text-sm text-gray-400 mb-2">
                Vraag {gameState.currentQuestionIndex + 1} van {gameState.questions.length}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={gameState.currentQuestionIndex}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-6xl font-bold text-white mb-6"
                >
                  {currentQuestion.num1} × {currentQuestion.num2}
                </motion.div>
              </AnimatePresence>
              
              <div className="text-4xl text-white mb-2">=</div>
              
              <motion.div
                className={`text-5xl font-bold min-h-[60px] flex items-center justify-center ${
                  showFeedback === 'incorrect' ? 'animate-shake' : ''
                }`}
                animate={
                  showFeedback === 'correct'
                    ? { scale: [1, 1.2, 1], color: ['#ffffff', '#4ade80', '#ffffff'] }
                    : showFeedback === 'incorrect'
                    ? { scale: [1, 1.1, 1], color: ['#ffffff', '#ef4444', '#ef4444', '#ffffff'] }
                    : {}
                }
                transition={{ duration: 0.5 }}
              >
                {userInput || (
                  <span className="text-gray-600">?</span>
                )}
                {showFeedback === 'incorrect' && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ml-4 text-red-500"
                  >
                    ✗
                  </motion.span>
                )}
                {showFeedback === 'correct' && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ml-4 text-green-500"
                  >
                    ✓
                  </motion.span>
                )}
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Numpad */}
        <Numpad
          onNumberClick={handleNumberClick}
          onBackspace={handleBackspace}
          onClear={handleClear}
        />
      </div>
    </div>
  );
}
