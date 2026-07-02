import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface WMSAIChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export const WMSAIChatInput: React.FC<WMSAIChatInputProps> = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSend(input.trim());
        setInput('');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-100 bg-white p-3 flex gap-2 items-end">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your WMS query here..."
        className="flex-1 min-h-[40px] max-h-[80px] text-xs py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none font-medium text-gray-800"
        rows={1}
      />
      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        className="flex items-center justify-center p-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-100 disabled:text-gray-400 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </form>
  );
};
