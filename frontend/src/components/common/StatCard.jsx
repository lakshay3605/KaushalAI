import React from 'react';

export default function StatCard({
  icon: Icon,
  number,
  label,
  trend,
  colorScheme = 'emerald', // emerald, blue, purple, amber, indigo
  sublabel
}) {
  const colorStyles = {
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-100'
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-100'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-100'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100'
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-100'
    }
  };

  const scheme = colorStyles[colorScheme] || colorStyles.emerald;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 flex items-center gap-4 transition hover:border-emerald-700/40 hover:shadow-xs">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${scheme.bg} ${scheme.text} ${scheme.border}`}>
        {Icon && <Icon size={24} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {number}
          </span>
          {trend && (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">
              {trend}
            </span>
          )}
        </div>
        <p className="text-xs font-medium text-slate-600 truncate mt-0.5">
          {label}
        </p>
        {sublabel && (
          <p className="text-[10px] text-slate-400 mt-0.5">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
