import React from 'react';

interface FeedbackPriorityBadgeProps {
  priority: 'Low' | 'Medium' | 'High' | 'Critical' | string;
}

export const FeedbackPriorityBadge: React.FC<FeedbackPriorityBadgeProps> = ({ priority }) => {
  let colors = 'bg-gray-100 text-gray-700 border-gray-200';

  switch (priority) {
    case 'Low':
      colors = 'bg-gray-50 text-gray-600 border-gray-100';
      break;
    case 'Medium':
      colors = 'bg-blue-50 text-blue-700 border-blue-100';
      break;
    case 'High':
      colors = 'bg-orange-50 text-orange-700 border-orange-200';
      break;
    case 'Critical':
      colors = 'bg-red-50 text-red-700 border-red-200 animate-pulse';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors}`}>
      {priority}
    </span>
  );
};
