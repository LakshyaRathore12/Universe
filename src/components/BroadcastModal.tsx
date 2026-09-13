import React, { useState } from 'react';
import { X, Send, Megaphone, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { UniversityEvent } from '../types.js';

interface BroadcastModalProps {
  event: UniversityEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onBroadcastSuccess: () => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  event,
  isOpen,
  onClose,
  onBroadcastSuccess
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; success: boolean } | null>(null);

  if (!isOpen || !event) return null;

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/events/${event.id}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcementTitle: title,
          announcementBody: body
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          text: `Success! Broadcast sent to ${data.recipientCount} attendee(s) in real time.`,
          success: true
        });
        setTimeout(() => {
          onBroadcastSuccess();
          onClose();
        }, 1500);
      } else {
        setStatusMessage({ text: data.message || 'Failed to dispatch broadcast', success: false });
      }
    } catch {
      setStatusMessage({ text: 'Network error sending broadcast email.', success: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-indigo-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-800 text-indigo-200">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-white">Attendee Broadcast Notice</h2>
              <p className="text-xs text-indigo-200 truncate max-w-[280px]">{event.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-indigo-300 hover:text-white hover:bg-indigo-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSendBroadcast} className="p-6 space-y-4 text-xs">
          
          <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-900">
            <Users className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              This message will be emailed instantly to all <strong>{event.registeredCount} confirmed attendees</strong> of this event.
            </span>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              statusMessage.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {statusMessage.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Subject / Announcement Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Important: Software Installation Guide & Room Instructions"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Email Body Content *</label>
            <textarea
              rows={5}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Type your message to all registered attendees... (e.g. Please bring your student ID and laptop with Docker installed. Refreshments will be provided at 1:00 PM.)"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || event.registeredCount === 0}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Dispatching Emails...' : 'Send Broadcast Email'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
