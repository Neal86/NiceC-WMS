import React from 'react';
import { MessageSquarePlus } from 'lucide-react';

interface WMSFeedbackButtonProps {
  onClick: () => void;
  className?: string;
}

export const WMSFeedbackButton: React.FC<WMSFeedbackButtonProps> = ({ onClick, className }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md border border-blue-100 transition-all cursor-pointer active:scale-95 duration-150 ${className || ''}`}
    >
      <MessageSquarePlus className="w-3.5 h-3.5" />
      <span>Feedback</span>
    </button>
  );
};
