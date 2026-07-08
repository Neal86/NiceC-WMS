import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, Loader2, Paperclip, Send } from 'lucide-react';

interface FeedbackFormProps {
  currentWarehouse: string;
  currentScope: string;
  onBack?: () => void;
  onClose: () => void;
  onSubmitSuccess?: () => void;
}

const FEEDBACK_TYPES = [
  'Bug Report',
  'Feature Request',
  'Data Issue',
  'UI/UX Suggestion',
  'Integration Issue',
  'Warehouse Operation Issue',
  'Inventory Issue',
  'Order Issue',
  'Billing Issue',
  'Other'
];

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

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  currentWarehouse,
  currentScope,
  onBack,
  onClose,
  onSubmitSuccess
}) => {
  const [type, setType] = useState('Bug Report');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [warehouseId, setWarehouseId] = useState(currentWarehouse || 'All Warehouses');
  const [operationScope, setOperationScope] = useState(currentScope || 'All Operations');
  const [relatedPage, setRelatedPage] = useState(window.location.pathname || '/outbound/orders');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [contactEmail, setContactEmail] = useState('neal@nicec.net');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try to pre-fill from localStorage if logged in
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u.email) setContactEmail(u.email);
      } catch (e) {}
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please fill in all required fields (Title and Description).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title,
          description,
          relatedPage,
          warehouseId,
          operationScope,
          priority,
          contactEmail,
          screenshotUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback.');
      }

      setSuccess(true);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleMockAttachment = () => {
    setScreenshotUrl('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&fit=crop');
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 h-full bg-white rounded-2xl">
        <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
        <h3 className="text-base font-bold text-gray-800">Feedback Submitted Successfully!</h3>
        <p className="text-xs text-gray-500 max-w-[320px]">
          Thanks for your feedback. Our warehouse system team will review it shortly.
        </p>
        <button
          onClick={onBack || onClose}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer transition-all active:scale-95 duration-150"
        >
          Back to Assistant
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-700 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <h2 className="text-xs font-bold text-gray-800">Submit WMS Feedback</h2>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-medium text-gray-700">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-start gap-2 text-[11px]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Feedback Type */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Feedback Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {FEEDBACK_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Priority *</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Briefly state the issue or suggestion"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">Description *</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please describe details: steps to reproduce, actual vs expected results, etc."
            className="w-full min-h-[90px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Related Warehouse */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Related Warehouse</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {WAREHOUSES.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          {/* Related Scope */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Operation Scope</label>
            <select
              value={operationScope}
              onChange={(e) => setOperationScope(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {OPERATION_SCOPES.map((scope) => (
                <option key={scope} value={scope}>{scope}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Related Page */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Related Page</label>
            <input
              type="text"
              value={relatedPage}
              onChange={(e) => setRelatedPage(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-500"
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Contact Email *</label>
            <input
              type="email"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Attachment URL Mock */}
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">Screenshot / Attachment</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleMockAttachment}
              className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-all cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attach Mock Screenshot</span>
            </button>
            {screenshotUrl && (
              <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">
                Attached successfully!
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 duration-150 text-xs"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit Feedback</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
