// components/GPARing.tsx
'use client';

import { useGradeStorage } from '@/hooks/useGradeStorage';
import { motion } from 'framer-motion';

const GPARing = () => {
  const { calculateGPA, getCurrentSemesterGrades } = useGradeStorage();
  const gpa = calculateGPA();
  const currentGrades = getCurrentSemesterGrades();

  // If no GPA available, show placeholder
  if (!gpa || currentGrades.length === 0) {
    return (
      <div className="flex items-center justify-center">
        <div className="relative">
          {/* Outer ring */}
          <div className="w-32 h-32 rounded-full border-4 border-gray-600 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">N/A</div>
              <div className="text-xs text-gray-500 mt-1">GPA</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const gpaValue = parseFloat(gpa);
  const percentage = (gpaValue / 4.0) * 100; // Convert GPA to percentage of 4.0 scale
  const circumference = 2 * Math.PI * 45; // radius = 45 (90px diameter)

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        {/* Background ring */}
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-700"
          />
          
          {/* Animated progress ring */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke="url(#gpaGradient)"
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (percentage / 100) * circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (percentage / 100) * circumference }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gpaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" /> {/* blue-500 */}
              <stop offset="100%" stopColor="#d946ef" /> {/* emerald-500 */}
            </linearGradient>
          </defs>
        </svg>

        {/* GPA text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-center"
          >
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-fuchsia-400 bg-clip-text text-transparent">
              {gpa}
            </div>
            <div className="text-xs text-gray-300 mt-1">GPA</div>
            <div className="text-xs text-gray-400 mt-1">
              {currentGrades.length} course{currentGrades.length !== 1 ? 's' : ''}
            </div>
          </motion.div>
        </div>

        {/* Decorative dots */}
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-cyan-300 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default GPARing;