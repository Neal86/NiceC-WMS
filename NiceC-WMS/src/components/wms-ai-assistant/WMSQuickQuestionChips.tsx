import React from 'react';
import { HelpCircle } from 'lucide-react';

interface WMSQuickQuestionChipsProps {
  onSelect: (question: string) => void;
}

const QUICK_QUESTIONS = [
  "What inbound shipments are delayed today?",
  "Which outbound orders are waiting for picking?",
  "Which SKUs are low in stock?",
  "Show me packages with exception status.",
  "Which orders failed carrier label generation?",
  "What warehouse tasks should I prioritize today?",
  "Summarize today’s inbound and outbound workload.",
  "Which customers have unpaid storage or handling fees?",
  "Which FBA transfer orders are stuck?",
  "What inventory discrepancies need review?"
];

export const WMSQuickQuestionChips: React.FC<WMSQuickQuestionChipsProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col gap-2 mt-2 px-1">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1">
        <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
        <span>Suggested Questions</span>
      </div>
      <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
        {QUICK_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(q)}
            className="text-[11px] text-left px-2.5 py-1.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-700 rounded-full border border-gray-100 transition-all cursor-pointer font-medium active:scale-95 duration-150 shadow-xs"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
