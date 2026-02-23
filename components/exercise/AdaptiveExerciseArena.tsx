'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Numpad from '../game/Numpad';
import { playCorrectSound, playIncorrectSound, playComboSound, setSoundEnabled, isSoundEnabled } from '@/lib/game/sounds';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type Question, type DueFactData, generateQuestionsFromDueFacts, type GameConfig } from '@/lib/game/engine';

interface AdaptiveExerciseArenaProps {
  config: GameConfig;
  dueQuestions: DueFactData[];
  onExit: () => void;
}

export default function AdaptiveExerciseArena({ config, dueQuestions, onExit }: AdaptiveExerciseArenaProps) {
  const [questions] = useState<Question[]>(() => generateQuestionsFromDueFacts(config, dueQuestions));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(() => isSoundEnabled());
  const [combo, setCombo] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [stats, setStats] = useState({
    correctAnswers: 0,
    incorrectAnswers: 0,
  });

  // Track detailed stats for adaptive learning (without affecting streak/score)
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [isCorrectAnswers, setIsCorrectAnswers] = useState<boolean[]>(new Array(questions.length).fill(false));
  const [timeTaken, setTimeTaken] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const currentQuestion = questions[currentQuestionIndex];

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabledState(newState);
    setSoundEnabled(newState);
  };

  const generateNewQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= questions.length) {
      setSessionComplete(true);
      saveQuestionStats();
      return;
    }
    setCurrentQuestionIndex(nextIndex);
    setUserInput('');
    setQuestionStartTime(Date.now());
  };

  const saveQuestionStats = useCallback(async () => {
    // Save question stats for adaptive learning without affecting streak/score
    try {
      await fetch('/api/practice/save-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: questions.slice(0, currentQuestionIndex + 1),
          userAnswers: userAnswers.slice(0, currentQuestionIndex + 1),
          isCorrectAnswers: isCorrectAnswers.slice(0, currentQuestionIndex + 1),
          timeTaken: timeTaken.slice(0, currentQuestionIndex + 1),
        }),
      });
    } catch (error) {
      console.error('Error saving practice stats:', error);
    }
  }, [questions, userAnswers, isCorrectAnswers, timeTaken, currentQuestionIndex]);

  const handleAnswer = useCallback(
    (answer: number) => {
      if (isProcessingAnswer) return;
      setIsProcessingAnswer(true);

      const isCorrect = answer === currentQuestion.answer;
      const timeSpent = (Date.now() - questionStartTime) / 1000;

      // Update local stats
      setStats((prev) => ({
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        incorrectAnswers: prev.incorrectAnswers + (isCorrect ? 0 : 1),
      }));

      // Update detailed tracking arrays
      const newUserAnswers = [...userAnswers];
      newUserAnswers[currentQuestionIndex] = answer;
      setUserAnswers(newUserAnswers);

      const newIsCorrectAnswers = [...isCorrectAnswers];
      newIsCorrectAnswers[currentQuestionIndex] = isCorrect;
      setIsCorrectAnswers(newIsCorrectAnswers);

      const newTimeTaken = [...timeTaken];
      newTimeTaken[currentQuestionIndex] = timeSpent;
      setTimeTaken(newTimeTaken);

      if (isCorrect) {
        playCorrectSound();
        setShowFeedback('correct');

        const newCombo = combo + 1;
        setCombo(newCombo);
        if (newCombo % 5 === 0) {
          playComboSound(newCombo);
        }

        setTimeout(() => {
          setShowFeedback(null);
          setIsProcessingAnswer(false);
          generateNewQuestion();
        }, 600);
      } else {
        playIncorrectSound();
        setShowFeedback('incorrect');
        setCombo(0);

        setTimeout(() => {
          setShowFeedback(null);
          setIsProcessingAnswer(false);
          generateNewQuestion();
        }, 1500);
      }
    },
    [currentQuestion, combo, isProcessingAnswer, currentQuestionIndex, userAnswers, isCorrectAnswers, timeTaken, questionStartTime]
  );

  // Auto-save stats periodically (every 5 questions)
  useEffect(() => {
    if (currentQuestionIndex > 0 && currentQuestionIndex % 5 === 0) {
      saveQuestionStats();
    }
  }, [currentQuestionIndex, saveQuestionStats]);

  useEffect(() => {
    if (showFeedback || isProcessingAnswer) return;

    if (userInput && currentQuestion) {
      const inputNum = parseInt(userInput, 10);
      const correctAnswer = currentQuestion.answer;
      const correctAnswerLength = correctAnswer.toString().length;

      if (inputNum === correctAnswer) {
        handleAnswer(inputNum);
      } else if (userInput.length >= correctAnswerLength && inputNum !== correctAnswer) {
        handleAnswer(inputNum);
      }
    }
  }, [userInput, currentQuestion, showFeedback, isProcessingAnswer, handleAnswer]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showFeedback || isProcessingAnswer) return;

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
  }, [showFeedback, isProcessingAnswer]);

  const handleNumberClick = (num: string) => {
    if (showFeedback || isProcessingAnswer) return;
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

    playIncorrectSound();
    setShowFeedback('incorrect');
    setIsProcessingAnswer(true);
    setCombo(0);

    const timeSpent = (Date.now() - questionStartTime) / 1000;

    // Update stats for skip
    setStats((prev) => ({
      ...prev,
      incorrectAnswers: prev.incorrectAnswers + 1,
    }));

    // Update detailed tracking arrays
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentQuestionIndex] = null;
    setUserAnswers(newUserAnswers);

    const newIsCorrectAnswers = [...isCorrectAnswers];
    newIsCorrectAnswers[currentQuestionIndex] = false;
    setIsCorrectAnswers(newIsCorrectAnswers);

    const newTimeTaken = [...timeTaken];
    newTimeTaken[currentQuestionIndex] = timeSpent;
    setTimeTaken(newTimeTaken);

    setTimeout(() => {
      setShowFeedback(null);
      setIsProcessingAnswer(false);
      generateNewQuestion();
    }, 1500);
  };

  const handleExit = () => {
    // Save stats before exiting
    saveQuestionStats();
    onExit();
  };

  const accuracy = stats.correctAnswers + stats.incorrectAnswers > 0
    ? Math.round((stats.correctAnswers / (stats.correctAnswers + stats.incorrectAnswers)) * 100)
    : 0;

  if (sessionComplete) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4">
        <Card className="border-2 border-green-500/30 bg-black/80 backdrop-blur-lg max-w-md w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl font-bold text-white">Sessie afgerond!</h2>
            <p className="text-gray-300">
              Je hebt alle {questions.length} sommen voor vandaag geoefend. Tot de volgende keer!
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">{stats.correctAnswers}</div>
                <div className="text-xs text-gray-400">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">{stats.incorrectAnswers}</div>
                <div className="text-xs text-gray-400">Fout</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{accuracy}%</div>
                <div className="text-xs text-gray-400">Nauwkeurigheid</div>
              </div>
            </div>
            <Button
              onClick={onExit}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg h-12"
            >
              Terug naar oefenoverzicht
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <div className="h-full w-full flex flex-col p-4 pt-safe pb-safe">
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-3 h-full justify-between">
          {/* Header Stats */}
          <div className="flex justify-between items-center text-white flex-shrink-0">
            <div className="flex gap-4">
              <div>
                <div className="text-xs text-gray-400">Mode</div>
                <div className="text-xl font-bold text-purple-400">🎯 Slim</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Correct</div>
                <div className="text-xl font-bold text-green-400">{stats.correctAnswers}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Fout</div>
                <div className="text-xl font-bold text-red-400">{stats.incorrectAnswers}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Nauwkeurigheid</div>
                <div className="text-xl font-bold text-blue-400">{accuracy}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Combo</div>
                <div className="text-xl font-bold text-orange-400 flex items-center gap-1">
                  {combo}
                  {combo >= 5 && <span className="animate-fire">🔥</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={toggleSound}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-purple-500/20"
                title={soundEnabled ? 'Geluid uitschakelen' : 'Geluid inschakelen'}
              >
                {soundEnabled ? '🔊' : '🔇'}
              </Button>
              <Button
                onClick={handleExit}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-red-500/20"
                title="Oefening stoppen"
              >
                ✕
              </Button>
            </div>
          </div>

          {/* Question Card */}
          <Card
            className={`border-2 bg-black/80 backdrop-blur-lg flex-shrink-0 transition-colors duration-200 ${
              showFeedback === 'incorrect'
                ? 'border-red-500 bg-red-500/10'
                : showFeedback === 'correct'
                ? 'border-green-500 bg-green-500/10'
                : 'border-purple-500/30'
            }`}
          >
            <CardContent className="p-4 sm:p-8">
              <div className="text-center">
                <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">
                  Slimme Oefening - Vraag {currentQuestionIndex + 1} van {questions.length}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${currentQuestion.num1}${currentQuestion.operation}${currentQuestion.num2}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-4xl sm:text-6xl font-bold text-white mb-2 sm:mb-6"
                  >
                    {currentQuestion.num1} {currentQuestion.operation === 'division' ? '÷' : '×'} {currentQuestion.num2}
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
                  {userInput || <span className="text-gray-600">?</span>}
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

          {/* Info Banner */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 text-center text-xs text-gray-400 flex-shrink-0">
            ⏱️ Geen tijdslimiet - 🎯 Focus op je zwakke punten - 📊 Telt niet mee voor streak
          </div>

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
