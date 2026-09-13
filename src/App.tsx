import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Sparkles, 
  GraduationCap, 
  Users, 
  Ticket, 
  PlusCircle, 
  Mail, 
  Award,
  BookOpen,
  Zap,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { 
  Club, 
  EmailNotification, 
  EventCategory, 
  InAppNotification, 
  Registration, 
  UniversityEvent, 
  UniversityVenue, 
  User 
} from './types.js';
import { INITIAL_USERS } from './data/mockInitialData.js';
import { Navbar } from './components/Navbar.js';
import { AuthModal } from './components/AuthModal.js';
import { EventCard } from './components/EventCard.js';
import { EventDetailModal } from './components/EventDetailModal.js';
import { EventScheduleModal } from './components/EventScheduleModal.js';
import { TicketPassModal } from './components/TicketPassModal.js';
import { BroadcastModal } from './components/BroadcastModal.js';
import { CalendarView } from './components/CalendarView.js';
import { ClubsView } from './components/ClubsView.js';
import { ClubRegisterModal } from './components/ClubRegisterModal.js';
import { MyPassesView } from './components/MyPassesView.js';
import { OrganizerDashboard } from './components/OrganizerDashboard.js';
import { MailboxModal } from './components/MailboxModal.js';
import { NotificationToast } from './components/NotificationToast.js';

export default function App() {
  // Current Authenticated User (Defaults to student Aarav Sharma)
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]);
  const [availableUsers, setAvailableUsers] = useState<User[]>(INITIAL_USERS);

  // Active View Tab
  const [currentTab, setCurrentTab] = useState<'events' | 'calendar' | 'clubs' | 'passes' | 'organizer'>('events');

  // Core Data Stores
  const [events, setEvents] = useState<UniversityEvent[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [venues, setVenues] = useState<UniversityVenue[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<(Registration & { event?: UniversityEvent })[]>([]);
  const [emails, setEmails] = useState<EmailNotification[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedClubId, setSelectedClubId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [detailModalEvent, setDetailModalEvent] = useState<UniversityEvent | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<UniversityEvent | null>(null);
  const [broadcastModalEvent, setBroadcastModalEvent] = useState<UniversityEvent | null>(null);
  const [ticketModalData, setTicketModalData] = useState<{ reg: Registration; evt: UniversityEvent } | null>(null);
  const [clubRegisterModalOpen, setClubRegisterModalOpen] = useState(false);
  const [mailboxModalOpen, setMailboxModalOpen] = useState(false);
  const [toastEmail, setToastEmail] = useState<EmailNotification | null>(null);

  // Load Initial API Data
  const loadData = useCallback(async () => {
    try {
      const [eventsRes, clubsRes, venuesRes, usersRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/clubs'),
        fetch('/api/venues'),
        fetch('/api/auth/users')
      ]);

      const [eventsData, clubsData, venuesData, usersData] = await Promise.all([
        eventsRes.json(),
        clubsRes.json(),
        venuesRes.json(),
        usersRes.json()
      ]);

      if (eventsData.success) setEvents(eventsData.events);
      if (clubsData.success) setClubs(clubsData.clubs);
      if (venuesData.success) setVenues(venuesData.venues);
      if (usersData.success) setAvailableUsers(usersData.users);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load User-Specific Data (Registrations, Emails, In-app Notifications)
  const loadUserData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [regsRes, emailsRes, notifsRes] = await Promise.all([
        fetch(`/api/registrations/user/${currentUser.id}?email=${encodeURIComponent(currentUser.email)}`),
        fetch(`/api/emails`),
        fetch(`/api/notifications?userId=${currentUser.id}`)
      ]);

      const [regsData, emailsData, notifsData] = await Promise.all([
        regsRes.json(),
        emailsRes.json(),
        notifsRes.json()
      ]);

      if (regsData.success) setMyRegistrations(regsData.registrations);
      if (emailsData.success) setEmails(emailsData.emails);
      if (notifsData.success) setNotifications(notifsData.notifications);
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadUserData();
  }, [currentUser, loadUserData]);

  // Real-Time Server-Sent Events (SSE) Listener
  useEffect(() => {
    const eventSource = new EventSource('/api/notifications/stream');

    eventSource.addEventListener('email_sent', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        const newEmail: EmailNotification = payload.email;
        setEmails(prev => [newEmail, ...prev]);

        // If sent to current user or if current user is organizer/admin
        if (currentUser && (newEmail.recipientEmail.toLowerCase() === currentUser.email.toLowerCase())) {
          setToastEmail(newEmail);
          setNotifications(prev => [{
            id: `notif-${Date.now()}`,
            userId: currentUser.id,
            title: newEmail.subject,
            message: newEmail.plainText.substring(0, 100),
            type: 'info',
            createdAt: new Date().toISOString(),
            read: false,
            eventId: newEmail.eventId
          }, ...prev]);
        }
      } catch (err) {
        console.error('Error parsing SSE email_sent event', err);
      }
    });

    eventSource.addEventListener('event_created', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        setEvents(prev => [payload.event, ...prev]);
      } catch (err) {
        console.error(err);
      }
    });

    eventSource.addEventListener('event_updated', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        setEvents(prev => prev.map(ev => ev.id === payload.event.id ? payload.event : ev));
        loadUserData();
      } catch (err) {
        console.error(err);
      }
    });

    eventSource.addEventListener('registration_created', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        setEvents(prev => prev.map(ev => ev.id === payload.eventId ? { ...ev, registeredCount: payload.registeredCount } : ev));
      } catch (err) {
        console.error(err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [currentUser, loadUserData]);

  // Handle Register / RSVP for an Event
  const handleRegisterEvent = async (event: UniversityEvent) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          studentId: currentUser.studentId,
          department: currentUser.department
        })
      });

      const data = await res.json();
      if (data.success) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Update local registrations
        setMyRegistrations(prev => [{ ...data.registration, event }, ...prev]);
        setEvents(prev => prev.map(e => e.id === event.id ? { ...e, registeredCount: e.registeredCount + 1 } : e));

        // Show Ticket Pass Modal directly!
        setTicketModalData({ reg: data.registration, evt: event });
        if (detailModalEvent) setDetailModalEvent(null);

        // Also trigger toast for the delivered email confirmation
        if (data.email) {
          setToastEmail(data.email);
        }
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch {
      alert('Error registering for event. Please try again.');
    }
  };

  // Handle Cancel Registration
  const handleCancelRegistration = async (eventId: string) => {
    if (!currentUser) return;
    if (!confirm('Are you sure you want to cancel your pass for this event?')) return;

    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: currentUser.email })
      });
      const data = await res.json();
      if (data.success) {
        setMyRegistrations(prev => prev.filter(r => r.eventId !== eventId));
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, registeredCount: Math.max(0, e.registeredCount - 1) } : e));
      }
    } catch {
      alert('Error cancelling registration');
    }
  };

  // Save Event (Create or Reschedule)
  const handleSaveEvent = async (eventData: Partial<UniversityEvent>, isReschedule: boolean, rescheduleReason?: string) => {
    if (isReschedule && editingEvent) {
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...eventData, rescheduleReason })
      });
      const data = await res.json();
      if (data.success) {
        setEvents(prev => prev.map(e => e.id === editingEvent.id ? data.event : e));
        setEditingEvent(null);
      }
    } else {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      const data = await res.json();
      if (data.success) {
        setEvents(prev => [data.event, ...prev]);
      }
    }
  };

  // Cancel Event
  const handleCancelEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to cancel this event? Real-time cancellation notices will be emailed to all attendees.')) return;
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'cancelled' } : e));
      }
    } catch {
      console.error('Failed to cancel event');
    }
  };

  // Register New College Club
  const handleRegisterClub = async (clubData: Partial<Club>) => {
    const res = await fetch('/api/clubs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clubData)
    });
    const data = await res.json();
    if (data.success) {
      setClubs(prev => [data.club, ...prev]);
    }
  };

  // Filtered Events
  const filteredEvents = events.filter(evt => {
    const matchesSearch = 
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || evt.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesClub = selectedClubId === 'all' || evt.clubId === selectedClubId;
    const matchesStatus = selectedStatus === 'all' || evt.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesClub && matchesStatus;
  });

  const unreadEmailCount = emails.filter(m => currentUser && m.recipientEmail.toLowerCase() === currentUser.email.toLowerCase() && !m.read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenMailbox={() => setMailboxModalOpen(true)}
        onOpenScheduleEvent={() => {
          setEditingEvent(null);
          setScheduleModalOpen(true);
        }}
        onSwitchUser={(user) => setCurrentUser(user)}
        availableUsers={availableUsers}
        unreadEmailCount={unreadEmailCount}
        notifications={notifications}
        myPassesCount={myRegistrations.length}
        onMarkNotificationsRead={() => {
          fetch('/api/notifications/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser?.id })
          });
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }}
      />

      {/* Main App Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* TAB 1: EXPLORE EVENTS & WORKSHOPS */}
        {currentTab === 'events' && (
          <div className="space-y-6">
            
            {/* Hero Welcome Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-sm border border-slate-800">
              <div className="relative z-10 max-w-3xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>University Event Management System</span>
                  </span>
                </div>

                <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Discover Campus Workshops, Seminars & Club Events
                </h1>
                
                <p className="text-slate-300 text-xs sm:text-sm mt-3 leading-relaxed max-w-2xl">
                  One central university hub for students to browse academic seminars, technical labs, hackathons, and cultural showcases. Clubs can easily register, schedule campus venues, and dispatch real-time email tickets to attendees.
                </p>

                {/* Quick Action Buttons */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setCurrentTab('calendar')}
                    className="px-4 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <CalendarIcon className="w-4 h-4 text-indigo-600" />
                    <span>View Campus Schedule</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingEvent(null);
                      setScheduleModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm shadow-indigo-600/30"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Host Club Event</span>
                  </button>

                  <button
                    onClick={() => setMailboxModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-2 border border-slate-700/60"
                  >
                    <Mail className="w-4 h-4 text-indigo-400" />
                    <span>Campus Mailbox</span>
                    {unreadEmailCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                        {unreadEmailCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
                
                {/* Search input */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search events, topics, or venues..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Dropdown Filters */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedClubId}
                    onChange={e => setSelectedClubId(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none flex-1 sm:flex-none"
                  >
                    <option value="all">All Hosting Clubs</option>
                    {clubs.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Past</option>
                  </select>
                </div>

              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar text-xs">
                {['All', 'Workshop', 'Seminar', 'Hackathon', 'Guest Lecture', 'Cultural', 'Tech Talk'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                      selectedCategory.toLowerCase() === cat.toLowerCase()
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Events Grid */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Showing {filteredEvents.length} Campus Events
                </span>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-slate-800">No matching events found</h3>
                  <p className="text-xs text-slate-500 mt-1">Try clearing filters or search terms</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedClubId('all'); }}
                    className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map(evt => {
                    const isRegistered = myRegistrations.some(r => r.eventId === evt.id && r.status === 'confirmed');
                    return (
                      <EventCard
                        key={evt.id}
                        event={evt}
                        isRegistered={isRegistered}
                        onViewDetails={(e) => setDetailModalEvent(e)}
                        onRegister={(e) => handleRegisterEvent(e)}
                      />
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: SCHEDULE & CALENDAR */}
        {currentTab === 'calendar' && (
          <CalendarView
            events={events}
            onSelectEvent={(evt) => setDetailModalEvent(evt)}
          />
        )}

        {/* TAB 3: CLUBS DIRECTORY */}
        {currentTab === 'clubs' && (
          <ClubsView
            clubs={clubs}
            events={events}
            onSelectClubFilter={(clubId) => {
              setSelectedClubId(clubId);
              setCurrentTab('events');
            }}
            onOpenRegisterClub={() => setClubRegisterModalOpen(true)}
            onScheduleEventForClub={(clubId) => {
              setEditingEvent(null);
              setScheduleModalOpen(true);
            }}
          />
        )}

        {/* TAB 4: MY PASSES & TICKETS */}
        {currentTab === 'passes' && (
          <MyPassesView
            registrations={myRegistrations}
            onViewTicket={(reg, evt) => setTicketModalData({ reg, evt })}
            onOpenMailbox={() => setMailboxModalOpen(true)}
            onCancelRegistration={handleCancelRegistration}
            onExploreEvents={() => setCurrentTab('events')}
          />
        )}

        {/* TAB 5: ORGANIZER DASHBOARD */}
        {currentTab === 'organizer' && (
          <OrganizerDashboard
            events={events}
            currentUser={currentUser}
            onOpenScheduleEvent={() => {
              setEditingEvent(null);
              setScheduleModalOpen(true);
            }}
            onEditEvent={(evt) => {
              setEditingEvent(evt);
              setScheduleModalOpen(true);
            }}
            onOpenBroadcast={(evt) => setBroadcastModalEvent(evt)}
            onCancelEvent={handleCancelEvent}
            onOpenMailbox={() => setMailboxModalOpen(true)}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              U
            </div>
            <span className="font-heading font-bold text-slate-800 text-sm">UniVerse</span>
            <span>• Central University Event & Workshop Management System</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Dean of Student Affairs</span>
            <span>•</span>
            <span>Academic Council</span>
            <span>•</span>
            <button 
              onClick={() => setMailboxModalOpen(true)}
              className="text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Simulated Mailbox ({emails.length} dispatches)
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          loadUserData();
        }}
        availableUsers={availableUsers}
      />

      <EventDetailModal
        event={detailModalEvent}
        onClose={() => setDetailModalEvent(null)}
        isRegistered={detailModalEvent ? myRegistrations.some(r => r.eventId === detailModalEvent.id && r.status === 'confirmed') : false}
        currentUser={currentUser}
        onRegister={handleRegisterEvent}
        onViewTicket={() => {
          if (!detailModalEvent) return;
          const reg = myRegistrations.find(r => r.eventId === detailModalEvent.id);
          if (reg) {
            setTicketModalData({ reg, evt: detailModalEvent });
            setDetailModalEvent(null);
          }
        }}
        onOpenMailbox={() => {
          setDetailModalEvent(null);
          setMailboxModalOpen(true);
        }}
      />

      <EventScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setEditingEvent(null);
        }}
        onSaveEvent={handleSaveEvent}
        editingEvent={editingEvent}
        clubs={clubs}
        venues={venues}
        currentUser={currentUser}
      />

      <BroadcastModal
        event={broadcastModalEvent}
        isOpen={!!broadcastModalEvent}
        onClose={() => setBroadcastModalEvent(null)}
        onBroadcastSuccess={() => {
          loadUserData();
        }}
      />

      <TicketPassModal
        registration={ticketModalData?.reg || null}
        event={ticketModalData?.evt || null}
        onClose={() => setTicketModalData(null)}
        onOpenMailbox={() => {
          setTicketModalData(null);
          setMailboxModalOpen(true);
        }}
      />

      <ClubRegisterModal
        isOpen={clubRegisterModalOpen}
        onClose={() => setClubRegisterModalOpen(false)}
        onRegisterClub={handleRegisterClub}
      />

      <MailboxModal
        isOpen={mailboxModalOpen}
        onClose={() => setMailboxModalOpen(false)}
        emails={emails}
        currentUser={currentUser}
        onRefresh={() => loadUserData()}
      />

      <NotificationToast
        email={toastEmail}
        onClose={() => setToastEmail(null)}
        onOpenMailbox={() => {
          setToastEmail(null);
          setMailboxModalOpen(true);
        }}
      />

    </div>
  );
}
