import React, { useEffect, useRef } from 'react';
import { Bot, User, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
}

interface WMSAIMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export const WMSAIMessageList: React.FC<WMSAIMessageListProps> = ({ messages, isLoading }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const renderContent = (content: string) => {
    // Basic Markdown/bullet rendering helper for neat representation in lists
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.trim().startsWith('*') || line.trim().startsWith('-') || /^\d+\./.test(line.trim())) {
        return (
          <div key={index} className="pl-4 py-0.5 text-xs text-gray-800 leading-relaxed font-medium">
            {line}
          </div>
        );
      }
      return (
        <p key={index} className="text-xs text-gray-800 leading-relaxed font-medium mb-1.5 last:mb-0">
          {line}
        </p>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50"
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 animate-pulse">
            <Bot className="w-6 h-6" />
          </div>
          <div className="max-w-[280px]">
            <h3 className="text-sm font-semibold text-gray-800">WMS Warehouse Co-Pilot</h3>
            <p className="text-[11px] text-gray-500 mt-1">
              Ask about active inbound, pending picking orders, stock anomalies, carrier labels, or current workload.
            </p>
          </div>
        </div>
      ) : (
        messages.map((msg) => {
          const isModel = msg.role === 'model';
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isModel ? 'justify-start' : 'justify-end'}`}
            >
              {isModel && (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs transition-all ${
                  isModel
                    ? 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                    : 'bg-blue-600 text-white rounded-tr-none'
                }`}
              >
                {isModel ? (
                  <div>{renderContent(msg.content)}</div>
                ) : (
                  <p className="leading-relaxed font-semibold whitespace-pre-wrap">{msg.content}</p>
                )}
                <span
                  className={`block text-[9px] mt-1 text-right ${
                    isModel ? 'text-gray-400' : 'text-blue-200'
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {!isModel && (
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })
      )}

      {isLoading && (
        <div className="flex gap-2.5 justify-start">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div className="bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none px-3.5 py-3 shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );
};
