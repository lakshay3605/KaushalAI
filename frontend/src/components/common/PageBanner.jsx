import React from 'react';

export default function PageBanner({
  title,
  subtitle,
  rightCardTitle,
  rightCardText,
  rightCardIcon: Icon,
  quoteText,
  customRightContent
}) {
  const hasRightCard = Boolean(rightCardText || quoteText || customRightContent);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden relative flex flex-col lg:flex-row items-start lg:items-center justify-between p-5 sm:px-6 sm:py-4.5 mb-5 gap-4 min-h-[96px]">
      
      {/* Left text */}
      <div className="relative z-10 max-w-lg shrink-0">
        <h1 className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {/* Center / Right Building Graphic Photograph */}
      <div className="hidden md:block absolute right-0 top-0 bottom-0 w-[55%] lg:w-[48%] overflow-hidden pointer-events-none">
        <img
          src="/assets/exact_building_photo.jpg"
          alt="Cooperative Training Centre"
          className="w-full h-full object-cover object-left"
          onError={(e) => {
            e.target.src = '/assets/banner_building.jpg';
          }}
        />
        {/* Soft Left and Right Gradient Fades */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white/40"></div>
      </div>

      {/* Right Side Info Card (Fully visible, zero clipping, floating on top of right edge) */}
      {hasRightCard && (
        <div className="relative z-10 shrink-0 self-stretch sm:self-auto flex items-center justify-end">
          {customRightContent ? (
            customRightContent
          ) : quoteText ? (
            <div className="bg-emerald-800 text-white p-3.5 rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-700/60 flex items-center justify-center shrink-0">
                {Icon ? <Icon size={18} className="text-emerald-200" /> : <span className="text-base">🌿</span>}
              </div>
              <p className="text-xs font-medium italic text-emerald-50 leading-relaxed">
                {quoteText}
              </p>
            </div>
          ) : (
            <div className="bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-gray-100 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#056B46] flex items-center justify-center shrink-0 border border-emerald-100">
                {Icon ? <Icon size={20} /> : <span className="text-base">📋</span>}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 leading-tight">
                  {rightCardTitle}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {rightCardText}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
