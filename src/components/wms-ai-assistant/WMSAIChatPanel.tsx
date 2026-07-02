import React, { useState, useEffect } from 'react';
import { Bot, X, Minimize2, MessageSquarePlus, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';
import { WMSAIMessageList } from './WMSAIMessageList';
import { WMSAIChatInput } from './WMSAIChatInput';
import { WMSQuickQuestionChips } from './WMSQuickQuestionChips';
import { FeedbackForm } from '../feedback/FeedbackForm';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
}

interface WMSAIChatPanelProps {
  onClose: () => void;
  onMinimize: () => void;
}

const WAREHOUSES = [
  'All Warehouses',
  'LA Warehouse',
  'Ontario Warehouse',
  'New Jersey Warehouse',
  'Dallas Warehouse',
  'Amazon FBA Transit Area'
];

const OPERATION_SCOPES = [
  'All Operations',
  'Inbound',
  'Outbound',
  'Inventory',
  'Returns',
  'FBA Transfer',
  'Billing',
  'Exceptions'
];

export const WMSAIChatPanel: React.FC<WMSAIChatPanelProps> = ({ onClose, onMinimize }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selector States
  const [warehouse, setWarehouse] = useState('All Warehouses');
  const [scope, setScope] = useState('All Operations');

  // Mode state: 'chat' | 'feedback'
  const [mode, setMode] = useState<'chat' | 'feedback'>('chat');

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/wms-ai-assistant/history');
      if (res.ok) {
        const history = await res.json();
        setMessages(history);
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSendMessage = async (text: string) => {
    setIsLoading(true);
    setError(null);

    // Append user message immediately for responsiveness
    const userMsg: ChatMessage = {
      id: 'temp_user_' + Date.now(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await fetch('/api/wms-ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          warehouseId: warehouse,
          operationScope: scope,
          currentPage: window.location.pathname
        })
      });

      if (!response.ok) {
        throw new Error('Network response error from Assistant.');
      }

      const data = await response.json();
      setMessages(data.history);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to WMS AI Service.');
      // Remove the temp user message to prevent invalid status
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      const res = await fetch('/api/wms-ai-assistant/history', { method: 'DELETE' });
      if (res.ok) {
        fetchHistory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      className="fixed bottom-24 right-6 bg-white rounded-2xl shadow-2xl border border-gray-150 flex flex-col overflow-hidden z-50
                 w-full md:w-[420px] h-[80vh] md:h-[620px] md:max-h-[calc(100vh-120px)]
                 max-md:bottom-0 max-md:right-0 max-md:rounded-b-none"
    >
      {mode === 'feedback' ? (
        <FeedbackForm
          currentWarehouse={warehouse}
          currentScope={scope}
          onBack={() => setMode('chat')}
          onClose={onClose}
          onSubmitSuccess={() => {}}
        />
      ) : (
        <>
          {/* Chat Panel Header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-4 py-3.5 flex flex-col gap-2 shrink-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="p-1 bg-white/10 rounded-lg">
                  <Bot className="w-5 h-5 text-blue-200 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold leading-tight">WMS AI Assistant</h3>
                  <p className="text-[10px] text-blue-200">Ask about warehouse operations</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Feedback Button */}
                <button
                  onClick={() => setMode('feedback')}
                  className="p-1 hover:bg-white/10 rounded-md text-blue-100 hover:text-white transition-all text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Submit feedback regarding this screen/anomalies"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  <span className="max-sm:hidden">Feedback</span>
                </button>

                {/* Minimize Button */}
                <button
                  onClick={onMinimize}
                  className="p-1 hover:bg-white/10 rounded-md text-blue-100 hover:text-white transition-all cursor-pointer"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/10 rounded-md text-blue-100 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Selectors Row */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {/* Warehouse selector */}
              <div>
                <select
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  className="w-full bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 rounded px-2 py-1 text-white text-[10px] font-semibold focus:outline-none cursor-pointer"
                >
                  {WAREHOUSES.map(w => (
                    <option key={w} value={w} className="bg-indigo-900 text-white font-semibold">{w}</option>
                  ))}
                </select>
              </div>

              {/* Scope selector */}
              <div>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 rounded px-2 py-1 text-white text-[10px] font-semibold focus:outline-none cursor-pointer"
                >
                  {OPERATION_SCOPES.map(s => (
                    <option key={s} value={s} className="bg-indigo-900 text-white font-semibold">{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Main message area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {error && (
              <div className="p-2 bg-red-50 text-red-600 flex items-center gap-1 text-[10px] border-b border-red-100 shrink-0 font-bold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <WMSAIMessageList messages={messages} isLoading={isLoading} />
          </div>

          {/* Bottom helper area for Quickchips and Input */}
          <div className="bg-white shrink-0 border-t border-gray-100 p-2 space-y-2">
            <WMSQuickQuestionChips onSelect={handleSendMessage} />
            <div className="flex justify-between items-center px-1 text-[9px] text-gray-400">
              <span className="flex items-center gap-0.5">
                <Sparkles className="w-3 h-3 text-blue-500" /> WMS Operations Expert Mode
              </span>
              <button
                type="button"
                onClick={handleClearHistory}
                className="hover:text-red-500 hover:underline cursor-pointer font-bold"
              >
                Clear History
              </button>
            </div>
          </div>

          <WMSAIChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </>
      )}
    </div>
  );
};
