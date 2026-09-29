import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Megaphone, 
  Ticket, 
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Send,
  ChevronLeft
} from 'lucide-react';
import { EmailNotification, User } from '../types.js';

interface MailboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  emails: EmailNotification[];
  currentUser: User | null;
  onRefresh: () => void;
  onViewTicketPass?: (ticketCode?: string) => void;
}

export const MailboxModal: React.FC<MailboxModalProps> = ({
  isOpen,
  onClose,
  emails,
  currentUser,
  onRefresh,
  onViewTicketPass
}) => {
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(emails[0] || null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewScope, setViewScope] = useState<'my_inbox' | 'all_campus'>('my_inbox');
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  if (!isOpen) return null;

  // Filter emails
  let filtered = emails.filter(m => {
    if (viewScope === 'my_inbox' && currentUser) {
      return m.recipientEmail.toLowerCase() === currentUser.email.toLowerCase();
    }
    return true;
  });

  if (filterType !== 'all') {
    filtered = filtered.filter(m => m.type === filterType);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(m => 
      m.subject.toLowerCase().includes(q) ||
      m.senderName.toLowerCase().includes(q) ||
      m.recipientEmail.toLowerCase().includes(q) ||
      m.plainText.toLowerCase().includes(q)
    );
  }

  const activeEmail = selectedEmail && filtered.some(e => e.id === selectedEmail.id)
    ? selectedEmail
    : filtered[0] || null;

  const getTypeBadge = (type: EmailNotification['type']) => {
    switch (type) {
      case 'registration_confirmation':
        return <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Ticket Confirmed</span>;
      case 'schedule_change':
        return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">Schedule Update</span>;
      case 'organizer_announcement':
        return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">Club Broadcast</span>;
      case 'event_reminder':
        return <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">⏰ 1-Hour Reminder</span>;
      case 'cancellation':
        return <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold">Notice</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[88vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Modal Top Bar */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-base sm:text-lg text-white">Campus Mailbox</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Real-Time Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentUser ? `Active Inbox: ${currentUser.email}` : 'University Event Email Notification Center'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              title="Refresh inbox"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & View Switcher Bar */}
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewScope('my_inbox')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewScope === 'my_inbox' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              My Student Inbox ({currentUser?.email})
            </button>
            <button
              onClick={() => setViewScope('all_campus')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewScope === 'all_campus' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Campus Dispatches ({emails.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search subject or sender..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 sm:w-56"
              />
            </div>

            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none"
            >
              <option value="all">All Notifications</option>
              <option value="registration_confirmation">Pass Confirmations</option>
              <option value="event_reminder">⏰ 1-Hour Reminders</option>
              <option value="schedule_change">Schedule Updates</option>
              <option value="organizer_announcement">Club Broadcasts</option>
              <option value="cancellation">Cancellations</option>
            </select>
          </div>

        </div>

        {/* Main Content Area: Split View (List + Preview) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Email List Column */}
          <div className={`w-full sm:w-2/5 border-r border-slate-200 overflow-y-auto bg-white divide-y divide-slate-100 ${
            mobileShowDetail ? 'hidden sm:block' : 'block'
          }`}>
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Mail className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">No emails found in this view</p>
                <p className="text-slate-400 mt-1">Register for an event to receive an instant ticket confirmation email.</p>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedEmail(item);
                    setMobileShowDetail(true);
                  }}
                  className={`p-3.5 cursor-pointer transition-colors text-xs ${
                    activeEmail?.id === item.id
                      ? 'bg-indigo-50/70 border-l-4 border-indigo-600'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 truncate max-w-[170px]">
                      {item.senderName}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="font-medium text-slate-800 line-clamp-1 mb-1">
                    {item.subject}
                  </div>

                  <div className="text-slate-500 line-clamp-1 text-[11px] mb-2">
                    {item.plainText}
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    {getTypeBadge(item.type)}
                    <span className="text-slate-400">To: {item.recipientEmail.split('@')[0]}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Email Preview Column */}
          <div className={`${
            mobileShowDetail ? 'flex' : 'hidden sm:flex'
          } flex-1 flex-col bg-slate-50 overflow-hidden`}>
            {activeEmail ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                
                {/* Mobile Back Button */}
                <div className="sm:hidden px-4 pt-3 pb-1 bg-white border-b border-slate-100">
                  <button
                    onClick={() => setMobileShowDetail(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Messages</span>
                  </button>
                </div>

                {/* Email Meta Header */}
                <div className="p-4 bg-white border-b border-slate-200 text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      {activeEmail.subject}
                    </h3>
                    {getTypeBadge(activeEmail.type)}
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                    <div>
                      <span className="text-slate-400">From: </span>
                      <strong className="text-slate-800">{activeEmail.senderName}</strong> &lt;{activeEmail.senderEmail}&gt;
                    </div>
                    <div>
                      <span className="text-slate-400">To: </span>
                      <strong className="text-slate-800">{activeEmail.recipientName}</strong> &lt;{activeEmail.recipientEmail}&gt;
                    </div>
                    <div>
                      <span className="text-slate-400">Delivered: </span>
                      <span>{new Date(activeEmail.sentAt).toLocaleString()}</span>
                    </div>
                    {activeEmail.ticketCode && (
                      <div>
                        <span className="text-slate-400">Ticket Pass: </span>
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {activeEmail.ticketCode}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rendered HTML Body */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <div 
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 sm:p-6 overflow-hidden max-w-2xl mx-auto"
                    dangerouslySetInnerHTML={{ __html: activeEmail.htmlContent }}
                  />
                </div>

              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-slate-400">
                Select an email from the left pane to view details
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-white p-3 border-t border-slate-200 px-6 flex items-center justify-between text-xs text-slate-500">
          <span>Real-time SMTP Delivery Simulation • Central Campus Mailer</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
          >
            Close Mailbox
          </button>
        </div>

      </div>
    </div>
  );
};
