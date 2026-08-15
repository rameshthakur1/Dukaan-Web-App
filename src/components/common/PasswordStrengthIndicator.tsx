import React from 'react';
import { Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showCriteria?: boolean;
  className?: string;
  isDark?: boolean;
}

export interface PasswordAnalysis {
  score: number; // 0 to 4
  level: 'EMPTY' | 'WEAK' | 'FAIR' | 'GOOD' | 'STRONG';
  label: string;
  colorClass: string;
  bgClass: string;
  barColorClass: string;
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function evaluatePasswordStrength(password: string): PasswordAnalysis {
  if (!password) {
    return {
      score: 0,
      level: 'EMPTY',
      label: 'Enter password',
      colorClass: 'text-slate-400',
      bgClass: 'bg-slate-500/10',
      barColorClass: 'bg-slate-700',
      hasMinLength: false,
      hasUpper: false,
      hasLower: false,
      hasNumber: false,
      hasSpecial: false,
    };
  }

  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let passedCriteria = 0;
  if (password.length >= 6) passedCriteria++;
  if (hasMinLength) passedCriteria++;
  if (hasUpper && hasLower) passedCriteria++;
  if (hasNumber) passedCriteria++;
  if (hasSpecial) passedCriteria++;

  let score = 1;
  let level: PasswordAnalysis['level'] = 'WEAK';
  let label = 'Weak';
  let colorClass = 'text-rose-500';
  let bgClass = 'bg-rose-500/10 border-rose-500/20 text-rose-400';
  let barColorClass = 'bg-rose-500';

  if (!hasMinLength) {
    // If under standard 8 chars
    score = 1;
    level = 'WEAK';
    label = 'Weak (< 8 chars)';
    colorClass = 'text-rose-500';
    bgClass = 'bg-rose-500/10 border-rose-500/20 text-rose-400';
    barColorClass = 'bg-rose-500';
  } else if (passedCriteria <= 2) {
    score = 2;
    level = 'FAIR';
    label = 'Fair (8 chars)';
    colorClass = 'text-amber-500';
    bgClass = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    barColorClass = 'bg-amber-500';
  } else if (passedCriteria <= 4) {
    score = 3;
    level = 'GOOD';
    label = 'Good strength';
    colorClass = 'text-blue-500';
    bgClass = 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    barColorClass = 'bg-blue-500';
  } else {
    score = 4;
    level = 'STRONG';
    label = 'Strong password';
    colorClass = 'text-emerald-500';
    bgClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    barColorClass = 'bg-emerald-500';
  }

  return {
    score,
    level,
    label,
    colorClass,
    bgClass,
    barColorClass,
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
  };
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showCriteria = true,
  className = '',
  isDark = true,
}) => {
  if (!password && !showCriteria) return null;

  const analysis = evaluatePasswordStrength(password);

  const criteriaList = [
    { label: '8+ Characters (Normal length)', met: analysis.hasMinLength },
    { label: 'Letters (a-z & A-Z)', met: analysis.hasLower && analysis.hasUpper },
    { label: 'Number (0-9)', met: analysis.hasNumber },
    { label: 'Symbol (@#$%...)', met: analysis.hasSpecial },
  ];

  return (
    <div className={`space-y-2 mt-1.5 ${className}`}>
      {/* Visual Strength Meter Bars & Badge */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-400 flex items-center gap-1">
            {analysis.score >= 3 ? (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            )}
            <span>Password Strength:</span>
          </span>

          <span
            className={`font-bold px-2 py-0.5 rounded-full text-[10px] border transition-all ${
              password ? analysis.bgClass : 'text-slate-500 bg-slate-800/40 border-slate-700/50'
            }`}
          >
            {password ? analysis.label : 'Normal length is 8 chars'}
          </span>
        </div>

        {/* 4 Multi-segment Progress Bars */}
        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
          {[1, 2, 3, 4].map((step) => {
            const isFilled = password && analysis.score >= step;
            return (
              <div
                key={step}
                className={`h-full rounded-full transition-all duration-300 ${
                  isFilled ? analysis.barColorClass : isDark ? 'bg-slate-800' : 'bg-slate-200'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Criteria Breakdown Checklist Pills */}
      {showCriteria && password.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {criteriaList.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-lg border transition-all ${
                item.met
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 dark:text-emerald-300 font-bold'
                  : isDark
                  ? 'bg-slate-950/60 border-slate-800 text-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              {item.met ? (
                <Check className="h-3 w-3 text-emerald-400 shrink-0" />
              ) : (
                <X className="h-3 w-3 text-slate-500 shrink-0 opacity-70" />
              )}
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
