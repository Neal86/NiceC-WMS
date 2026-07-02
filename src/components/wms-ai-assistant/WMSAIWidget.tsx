import React, { useState } from 'react';
import { Bot, Sparkles, X, MessageSquare } from 'lucide-react';
import { WMSAIChatPanel } from './WMSAIChatPanel';

export const WMSAIWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showBadge, setShowBadge] = useState(true);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (showBadge) {
      setShowBadge(false); // clear badge on first open
    }
  };

  return (
    <>
      {/* Floating launcher button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Tooltip / Prompt bubble */}
        {showTooltip && !isOpen && (
          <div className="bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xl border border-slate-800 animate-bounce flex items-center gap-1 shrink-0 select-none">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>WMS AI Assistant - Ask about warehouse operations</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleToggle}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl cursor-pointer select-none transition-all duration-300 transform active:scale-95 relative
                     ${
                       isOpen
                         ? 'bg-slate-800 text-white border border-slate-700'
                         : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white'
                     }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform rotate-90 duration-300" />
          ) : (
            <Bot className="w-7 h-7 transition-transform hover:scale-110 duration-200" />
          )}

          {/* Unread Badge */}
          {showBadge && !isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] text-white font-extrabold items-center justify-center">
                1
              </span>
            </span>
          )}
        </button>
      </div>

      {/* Chat popup window */}
      {isOpen && (
        <WMSAIChatPanel
          onClose={() => setIsOpen(false)}
          onMinimize={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
export default WMSAIWidget;
