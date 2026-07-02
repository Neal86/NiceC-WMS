import React, { useState, useEffect } from 'react';
import { X, User, Shield, Terminal, Send, CheckCircle2, MessageSquare, Clock, Calendar, Paperclip, Loader2 } from 'lucide-react';
import { Feedback, FeedbackComment } from '../../types';
import { FeedbackStatusBadge } from './FeedbackStatusBadge';
import { FeedbackPriorityBadge } from './FeedbackPriorityBadge';

interface FeedbackDetailDrawerProps {
  feedbackId: string;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

const STATUSES = ['New', 'In Review', 'Planned', 'In Progress', 'Resolved', 'Rejected'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const ASSIGNEES = [
  { id: 'usr_admin', username: 'admin@nicec.net' },
  { id: 'usr_1', username: 'neal@nicec.net' },
  { id: 'usr_2', username: 'operator@nicec.net' }
];

export const FeedbackDetailDrawer: React.FC<FeedbackDetailDrawerProps> = ({
  feedbackId,
  onClose,
  onUpdateSuccess
}) => {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Edit states
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [assignedToUserId, setAssignedToUserId] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');
  
  // Comment states
  const [comments, setComments] = useState<FeedbackComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [commenting, setCommenting] = useState(false);

  const fetchFeedbackDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/feedback/${feedbackId}`);
      if (res.ok) {
        const data = await res.json();
        setFeedback(data);
        setStatus(data.status);
        setPriority(data.priority);
        setAssignedToUserId(data.assignedToUserId || '');
        setInternalNotes(data.internalNotes || '');
        setComments(data.comments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (feedbackId) {
      fetchFeedbackDetails();
    }
  }, [feedbackId]);

  const handleSaveAttributes = async () => {
    setSaving(true);
    try {
      const assigneeObj = ASSIGNEES.find(a => a.id === assignedToUserId);
      const res = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          priority,
          assignedToUserId: assignedToUserId || null,
          assignedToUsername: assigneeObj ? assigneeObj.username : null,
          internalNotes
        })
      });

      if (res.ok) {
        onUpdateSuccess();
        fetchFeedbackDetails();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || commenting) return;
    setCommenting(true);
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: newComment.trim(),
          isInternal: isInternalComment,
          userId: 'usr_admin', // Admin posting
          username: 'admin@nicec.net'
        })
      });

      if (res.ok) {
        setNewComment('');
        fetchFeedbackDetails(); // reload
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCommenting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 border-l border-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!feedback) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40 transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 border-l border-gray-100 flex flex-col overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-gray-400">ID: {feedback.id}</span>
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">
                {feedback.type}
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-800 mt-1">{feedback.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-md text-gray-500 hover:text-gray-700 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-gray-700 font-medium">
          {/* Main Info */}
          <div className="space-y-4">
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</h4>
              <p className="p-3 bg-gray-50 rounded-lg text-gray-700 font-semibold leading-relaxed whitespace-pre-wrap">
                {feedback.description}
              </p>
            </div>

            {feedback.screenshotUrl && (
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Attachment</h4>
                <div className="relative rounded-lg overflow-hidden border border-gray-200 max-w-[240px]">
                  <img src={feedback.screenshotUrl} alt="Feedback Attachment" className="w-full h-auto object-cover max-h-40" />
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1.5 flex items-center justify-between text-white text-[9px]">
                    <span className="flex items-center gap-1">
                      <Paperclip className="w-3 h-3" /> screenshot.png
                    </span>
                    <a href={feedback.screenshotUrl} target="_blank" rel="noreferrer" className="underline hover:text-blue-300">View</a>
                  </div>
                </div>
              </div>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* Context Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h5 className="font-bold text-gray-800 mb-1">Context Information</h5>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Warehouse:</span>
                <span className="font-semibold text-gray-700">{feedback.warehouseId || 'All Warehouses'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Operation Scope:</span>
                <span className="font-semibold text-gray-700">{feedback.operationScope || 'All Operations'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Related Page:</span>
                <span className="font-semibold text-gray-700 font-mono">{feedback.relatedPage}</span>
              </div>
            </div>

            <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h5 className="font-bold text-gray-800 mb-1">User & Device Info</h5>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Contact Email:</span>
                <span className="font-semibold text-gray-700">{feedback.contactEmail}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Browser:</span>
                <span className="font-semibold text-gray-700">{feedback.browserInfo || 'Chrome 126.0'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Device/OS:</span>
                <span className="font-semibold text-gray-700">{feedback.deviceInfo || 'MacBook Pro'}</span>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Admin Editing Controls */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
            <h5 className="font-bold text-blue-900 text-xs">Admin Management Actions</h5>
            
            <div className="grid grid-cols-3 gap-3">
              {/* Status Select */}
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-semibold text-gray-800"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Priority Select */}
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-semibold text-gray-800"
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Assignee Select */}
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Assignee</label>
                <select
                  value={assignedToUserId}
                  onChange={(e) => setAssignedToUserId(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-semibold text-gray-800"
                >
                  <option value="">Unassigned</option>
                  {ASSIGNEES.map(a => (
                    <option key={a.id} value={a.id}>{a.username}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Internal Notes */}
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Internal Notes (Visible to Managers only)</label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Add workarounds, tracking tickets, or team comments here..."
                className="w-full min-h-[60px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-semibold text-gray-800"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSaveAttributes}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 duration-150"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Activity Comments Section */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <span>Activity & Discussion ({comments.length})</span>
            </h4>

            {/* Existing Comments */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
              {comments.length === 0 ? (
                <p className="text-[11px] text-gray-400 italic text-center py-2">No comments posted yet.</p>
              ) : (
                comments.map((comm) => (
                  <div
                    key={comm.id}
                    className={`p-3 rounded-lg border ${
                      comm.isInternal
                        ? 'bg-yellow-50/50 border-yellow-100'
                        : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-600">{comm.username}</span>
                        {comm.isInternal && (
                          <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5" /> Internal
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(comm.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 whitespace-pre-wrap">{comm.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-2 pt-2 border-t border-gray-100">
              <textarea
                required
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Type a response or internal note..."
                className="w-full min-h-[50px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs text-gray-800"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInternalComment}
                    onChange={(e) => setIsInternalComment(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>Post as Internal Staff Note</span>
                </label>
                <button
                  type="submit"
                  disabled={!newComment.trim() || commenting}
                  className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-[11px] font-bold rounded-lg shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                >
                  {commenting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>Post Comment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
