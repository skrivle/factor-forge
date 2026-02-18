'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface LeaderboardEntryWrapperProps {
  children: ReactNode;
  index: number;
  isCurrentUser: boolean;
}

export default function LeaderboardEntryWrapper({ 
  children, 
  index, 
  isCurrentUser 
}: LeaderboardEntryWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`p-3 sm:p-4 rounded-lg border-2 ${
        isCurrentUser
          ? 'bg-purple-500/20 border-purple-500'
          : 'bg-gray-800/50 border-gray-700'
      }`}
    >
      {children}
    </motion.div>
  );
}
