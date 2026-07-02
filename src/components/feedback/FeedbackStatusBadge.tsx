import React from 'react';

interface FeedbackStatusBadgeProps {
  status: 'New' | 'In Review' | 'Planned' | 'In Progress' | 'Resolved' | 'Rejected' | string;
}

export const FeedbackStatusBadge: React.FC<FeedbackStatusBadgeProps> = ({ status }) => {
  let colors = 'bg-gray-100 text-gray-700 border-gray-200';

  switch (status) {
    case 'New':
      colors = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'In Review':
      colors = 'bg-yellow-50 text-yellow-700 border-yellow-200';
      break;
    case 'Planned':
      colors = 'bg-purple-50 text-purple-700 border-purple-200';
      break;
    case 'In Progress':
      colors = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
    case 'Resolved':
      colors = 'bg-green-50 text-green-700 border-green-200';
      break;
    case 'Rejected':
      colors = 'bg-red-50 text-red-700 border-red-200';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors}`}>
      {status}
    </span>
  );
};
