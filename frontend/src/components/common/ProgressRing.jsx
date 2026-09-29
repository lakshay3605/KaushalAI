import React from 'react';

export default function ProgressRing({
  percentage = 68,
  size = 110,
  strokeWidth = 10,
  color = '#047857',
  trackColor = '#E2E8F0',
  label = '',
  centerText = null
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {centerText ? (
          centerText
        ) : (
          <>
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {percentage}%
            </span>
            {label && (
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {label}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
