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
import { playCorrectSound, playIncorrectSound, playComboSound, setSoundEnabled, isSoundEnabled } from '@/lib/game/sounds';
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
  onExit?: () => void;
}

export default function GameArena({ config, onGameEnd, onExit }: GameArenaProps) {
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
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(false);

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];

  // Toggle sound
  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabledState(newState);
    setSoundEnabled(newState);
  };

  // Clear input when question changes
  useEffect(() => {
    setUserInput('');
  }, [gameState.currentQuestionIndex]);

  // Timer logic
  useEffect(() => {
    if (isGameOver || isProcessingAnswer) return;

    const timer = setInterval(() => {
      setGameState((prev) => {
        const newTimeLeft = prev.timeLeft - 0.1;
        
        if (newTimeLeft <= 0) {
          // Time's up for this question
          playIncorrectSound();
          setShowFeedback('incorrect');
          setIsProcessingAnswer(true);
          
          // Show correct answer for 1.5 seconds before moving to next question
          setTimeout(() => {
            setUserInput('');
            setShowFeedback(null);
            setIsProcessingAnswer(false);
            
            setGameState((prev) => {
              const isLastQuestion = prev.currentQuestionIndex >= prev.questions.length - 1;
              
              if (isLastQuestion) {
                setIsGameOver(true);
                return {
                  ...prev,
                  incorrectAnswers: prev.incorrectAnswers + 1,
                  combo: 0,
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
                incorrectAnswers: prev.incorrectAnswers + 1,
                combo: 0,
                timeLeft: nextTime,
              };
            });
          }, 1500);
          
          return {
            ...prev,
            timeLeft: 0,
          };
        }

        return { ...prev, timeLeft: newTimeLeft };
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isGameOver, config, isProcessingAnswer]);

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
      // Prevent double-processing
      if (isProcessingAnswer) return;
      setIsProcessingAnswer(true);

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
          setShowFeedback(null); // Remove feedback
          setIsProcessingAnswer(false); // Allow next answer
          setUserInput(''); // Clear input RIGHT BEFORE moving to next question
          
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

        // Show correct answer before moving to next question
        setTimeout(() => {
          setUserInput('');
          setShowFeedback(null);
          setIsProcessingAnswer(false);
          
          setGameState((prev) => {
            const isLastQuestion = prev.currentQuestionIndex >= prev.questions.length - 1;
            
            if (isLastQuestion) {
              setIsGameOver(true);
              return {
                ...prev,
                incorrectAnswers: prev.incorrectAnswers + 1,
                combo: 0,
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
              incorrectAnswers: prev.incorrectAnswers + 1,
              combo: 0,
              timeLeft: nextTime,
            };
          });
        }, 1500);
      }
    },
    [currentQuestion, gameState.combo, config, isProcessingAnswer]
  );

  // Auto-submit on correct answer OR show error on wrong answer
  useEffect(() => {
    // Don't check if already showing feedback or processing (prevents double-triggering)
    if (showFeedback || isProcessingAnswer) return;
    
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
  }, [userInput, currentQuestion, showFeedback, isProcessingAnswer, handleAnswer]);

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver || showFeedback || isProcessingAnswer) return; // Don't accept input during feedback or processing

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
  }, [isGameOver, showFeedback, isProcessingAnswer]);

  const handleNumberClick = (num: string) => {
    if (showFeedback || isProcessingAnswer) return; // Don't accept numpad input during feedback or processing
    setUserInput((prev) => prev + num);
  };

  const handleBackspace = () => {
    if (showFeedback || isProcessingAnswer) return;
    setUserInput((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (showFeedback || isProcessingAnswer) return;
    setUserInput('');
  };

  const handleSkip = () => {
    if (showFeedback || isProcessingAnswer) return;
    
    // Treat skip as an incorrect answer - show the correct answer
    playIncorrectSound();
    setShowFeedback('incorrect');
    setIsProcessingAnswer(true);
    
    // Show correct answer for 1.5 seconds before moving to next question
    setTimeout(() => {
      setUserInput('');
      setShowFeedback(null);
      setIsProcessingAnswer(false);
      
      setGameState((prev) => {
        const isLastQuestion = prev.currentQuestionIndex >= prev.questions.length - 1;
        
        if (isLastQuestion) {
          setIsGameOver(true);
          return {
            ...prev,
            incorrectAnswers: prev.incorrectAnswers + 1,
            combo: 0,
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
          incorrectAnswers: prev.incorrectAnswers + 1,
          combo: 0,
          timeLeft: nextTime,
        };
      });
    }, 1500);
  };

  const progress = ((gameState.currentQuestionIndex + 1) / gameState.questions.length) * 100;

  if (!currentQuestion || isGameOver) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <div className="h-full w-full flex flex-col p-4 pt-safe pb-safe">
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-3 h-full justify-between">
          {/* Header Stats */}
          <div className="flex justify-between items-center text-white flex-shrink-0">
            <div className="flex gap-4">
              <div>
                <div className="text-xs text-gray-400">Score</div>
                <div className="text-xl font-bold text-green-400">{calculateScore(gameState.correctAnswers, gameState.combo, 0)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Combo</div>
                <div className="text-xl font-bold text-orange-400 flex items-center gap-1">
                  {gameState.combo}
                  {gameState.combo >= 5 && <span className="animate-fire">🔥</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs text-gray-400">Tijd</div>
                <div className={`text-xl font-bold ${gameState.timeLeft < 3 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                  {gameState.timeLeft.toFixed(1)}s
                </div>
              </div>
              <Button
                onClick={toggleSound}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-purple-500/20"
                title={soundEnabled ? 'Geluid uitschakelen' : 'Geluid inschakelen'}
              >
                {soundEnabled ? '🔊' : '🔇'}
              </Button>
              {onExit && (
                <Button
                  onClick={onExit}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-red-500/20"
                  title="Spel verlaten"
                >
                  ✕
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden flex-shrink-0">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Question Card */}
          <Card className={`border-2 bg-black/80 backdrop-blur-lg flex-shrink-0 transition-colors duration-200 ${
          showFeedback === 'incorrect' ? 'border-red-500 bg-red-500/10' : 
          showFeedback === 'correct' ? 'border-green-500 bg-green-500/10' : 
          'border-purple-500/30'
        }`}>
          <CardContent className="p-4 sm:p-8">
            <div className="text-center">
              <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">
                Vraag {gameState.currentQuestionIndex + 1} van {gameState.questions.length}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={gameState.currentQuestionIndex}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-4xl sm:text-6xl font-bold text-white mb-2 sm:mb-6"
                >
                  {currentQuestion.num1} × {currentQuestion.num2}
                </motion.div>
              </AnimatePresence>
              
              <div className="text-2xl sm:text-4xl text-white mb-1 sm:mb-2">=</div>
              
              <motion.div
                className={`text-3xl sm:text-5xl font-bold min-h-[50px] sm:min-h-[60px] flex items-center justify-center ${
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
              
              {/* Show correct answer when user is wrong */}
              {showFeedback === 'incorrect' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2 sm:mt-4 text-xl sm:text-3xl text-green-400 font-bold"
                >
                  Correct antwoord: {currentQuestion.answer}
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

          {/* Numpad */}
          <div className="flex-shrink-0 w-full">
            <Numpad
              onNumberClick={handleNumberClick}
              onBackspace={handleBackspace}
              onClear={handleClear}
              onSkip={handleSkip}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
