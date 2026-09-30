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
  ChevronDown,
  LayoutGrid,
  Code2
} from 'lucide-react';
import { 
  Club, 
  ClubAdminInfo,
  EmailNotification, 
  EventCategory, 
  InAppNotification, 
  Registration, 
  UniversityEvent, 
  UniversityVenue, 
  User,
  UserRole
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
import { ClubAdminsModal } from './components/ClubAdminsModal.js';
import { ClubParticipantsModal } from './components/ClubParticipantsModal.js';
import { MyPassesView } from './components/MyPassesView.js';
import { OrganizerDashboard } from './components/OrganizerDashboard.js';
import { AdminRegistrationsView } from './components/AdminRegistrationsView.js';
import { MailboxModal } from './components/MailboxModal.js';
import { NotificationToast } from './components/NotificationToast.js';
import { DevelopersView } from './components/DevelopersView.js';
import { ReminderToast, ReminderAlertData } from './components/ReminderToast.js';
import { GoogleDriveModal } from './components/GoogleDriveModal.js';
import { DatabaseManagerModal } from './components/DatabaseManagerModal.js';
import { auth, getAccessToken } from './lib/firebase.js';

export default function App() {
  // Current Authenticated User (Defaults to student Aarav Sharma)
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]);
  const [availableUsers, setAvailableUsers] = useState<User[]>(INITIAL_USERS);

  // Database Manager Modal State
  const [databaseModalOpen, setDatabaseModalOpen] = useState(false);

  // Active View Tab (Schedule and Calendar are accessed directly on the dashboard)
  const [currentTab, setCurrentTab] = useState<'events' | 'clubs' | 'passes' | 'organizer' | 'admin' | 'developers'>('events');
  const [dashboardViewMode, setDashboardViewMode] = useState<'cards' | 'calendar'>('cards');

  // Dark Mode / Light Mode Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('mits_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mits_theme', theme);
  }, [theme]);

  // Google Drive & Firebase OAuth State
  const [googleDriveToken, setGoogleDriveToken] = useState<string | null>(getAccessToken());
  const [googleDriveModalOpen, setGoogleDriveModalOpen] = useState(false);
  const [googleDriveUserEmail, setGoogleDriveUserEmail] = useState<string | undefined>(undefined);

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
  const [selectedClubForAdmins, setSelectedClubForAdmins] = useState<Club | null>(null);
  const [clubAdminsModalOpen, setClubAdminsModalOpen] = useState(false);
  const [selectedClubForParticipants, setSelectedClubForParticipants] = useState<Club | null>(null);
  const [clubParticipantsModalOpen, setClubParticipantsModalOpen] = useState(false);
  const [mailboxModalOpen, setMailboxModalOpen] = useState(false);
  const [toastEmail, setToastEmail] = useState<EmailNotification | null>(null);
  const [reminderAlert, setReminderAlert] = useState<ReminderAlertData | null>(null);

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

      if (eventsData.success && Array.isArray(eventsData.events)) {
        const uniqueEvents: UniversityEvent[] = [];
        const seenEvtIds = new Set<string>();
        for (const ev of eventsData.events) {
          if (!seenEvtIds.has(ev.id)) {
            seenEvtIds.add(ev.id);
            uniqueEvents.push(ev);
          }
        }
        setEvents(uniqueEvents);
      }
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

      if (regsData.success && Array.isArray(regsData.registrations)) {
        const uniqueRegs: Registration[] = [];
        const seenRegIds = new Set<string>();
        for (const reg of regsData.registrations) {
          if (!seenRegIds.has(reg.id)) {
            seenRegIds.add(reg.id);
            uniqueRegs.push(reg);
          }
        }
        setMyRegistrations(uniqueRegs);
      }
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

  // Firebase Auth listener for Google Drive Token & Identity
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setGoogleDriveUserEmail(user.email || undefined);
        const token = getAccessToken();
        if (token) setGoogleDriveToken(token);
      } else {
        setGoogleDriveToken(null);
        setGoogleDriveUserEmail(undefined);
      }
    });
    return () => unsubscribe();
  }, []);

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
        if (payload?.event) {
          setEvents(prev => {
            if (prev.some(ev => ev.id === payload.event.id)) {
              return prev.map(ev => ev.id === payload.event.id ? payload.event : ev);
            }
            return [payload.event, ...prev];
          });
        }
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

    eventSource.addEventListener('reminder_triggered', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        loadUserData();

        if (currentUser && (payload.userEmail.toLowerCase() === currentUser.email.toLowerCase() || payload.userId === currentUser.id)) {
          setReminderAlert({
            eventTitle: payload.eventTitle,
            startTime: payload.startTime,
            venue: payload.venue,
            ticketCode: payload.ticketCode,
            minutesLeft: payload.minutesLeft || 60,
            eventId: payload.eventId
          });

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`⏰ 1-Hour Reminder: ${payload.eventTitle}`, {
                body: `Starts at ${payload.startTime} in ${payload.venue}. Ticket Pass: ${payload.ticketCode}`,
                icon: '/favicon.ico'
              });
            } catch (notifErr) {
              console.warn('Native notification failed:', notifErr);
            }
          }
        }
      } catch (err) {
        console.error('Error handling SSE reminder_triggered', err);
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
        setEvents(prev => {
          if (prev.some(e => e.id === data.event.id)) {
            return prev.map(e => e.id === data.event.id ? data.event : e);
          }
          return [data.event, ...prev];
        });
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
    if (data.success && data.club) {
      setClubs(prev => [data.club, ...prev]);
      try {
        const userRes = await fetch('/api/auth/users');
        const userData = await userRes.json();
        if (userData.success) setAvailableUsers(userData.users);
      } catch {}
    }
  };

  // Update Club Admins (Editable by other admins present)
  const handleUpdateClubAdmins = async (clubId: string, updatedAdmins: ClubAdminInfo[]) => {
    try {
      const res = await fetch(`/api/clubs/${clubId}/admins`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admins: updatedAdmins,
          updatedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Club Administrator'
        })
      });
      const data = await res.json();
      if (data.success && data.club) {
        setClubs(prev => prev.map(c => c.id === clubId ? data.club : c));
        if (selectedClubForAdmins?.id === clubId) {
          setSelectedClubForAdmins(data.club);
        }
        // Refresh users in case new admins were created
        try {
          const userRes = await fetch('/api/auth/users');
          const userData = await userRes.json();
          if (userData.success) setAvailableUsers(userData.users);
        } catch {}
      } else {
        throw new Error(data.message || 'Failed to update club administrators');
      }
    } catch (err: any) {
      // Fallback local update
      setClubs(prev => prev.map(c => {
        if (c.id === clubId) {
          const primary = updatedAdmins[0];
          const updatedClub = {
            ...c,
            admins: updatedAdmins,
            leadName: primary ? primary.name : c.leadName,
            leadEmail: primary ? primary.email : c.leadEmail,
            leadPhone: primary ? primary.phone : c.leadPhone,
            leadEnrollmentNo: primary ? primary.enrollmentNo : c.leadEnrollmentNo,
            leadYear: primary ? primary.year : c.leadYear,
          };
          if (selectedClubForAdmins?.id === clubId) {
            setSelectedClubForAdmins(updatedClub);
          }
          return updatedClub;
        }
        return c;
      }));
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

  // Handle User Logout
  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
    setCurrentUser(null);
    setMyRegistrations([]);
    setNotifications([]);
    setGoogleDriveToken(null);
    setGoogleDriveUserEmail(undefined);
    if (currentTab === 'passes') {
      setCurrentTab('events');
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col selection:bg-indigo-100 selection:text-indigo-900 transition-colors duration-200`}>
      
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
        onLogout={handleLogout}
        unreadEmailCount={unreadEmailCount}
        notifications={notifications}
        myPassesCount={myRegistrations.length}
        onOpenGoogleDrive={() => setGoogleDriveModalOpen(true)}
        isGoogleDriveConnected={!!googleDriveToken}
        onOpenDatabaseManager={() => setDatabaseModalOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8">
        
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
                    onClick={() => {
                      setEditingEvent(null);
                      setScheduleModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm shadow-indigo-600/30 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Host Club Event</span>
                  </button>

                  <button
                    onClick={() => setMailboxModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-2 border border-slate-700/60 cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-indigo-400" />
                    <span>Campus Mailbox</span>
                    {unreadEmailCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                        {unreadEmailCount}
                      </span>
                    )}
                  </button>

                  {/* Developers Option on Dashboard */}
                  <button
                    id="btn-hero-developers"
                    onClick={() => setCurrentTab('developers')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-2 border border-slate-700/60 cursor-pointer"
                    title="Meet the Developers (Lakshya Rathore)"
                  >
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    <span>Developers</span>
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

            {/* Events Grid & Schedule/Calendar Dashboard View */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-1">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {dashboardViewMode === 'calendar' 
                      ? 'Campus Master Schedule & Calendar' 
                      : `Showing ${filteredEvents.length} Campus Events`}
                  </span>
                  {dashboardViewMode === 'calendar' && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Interactive monthly schedule of university workshops, academic seminars, and club venues
                    </p>
                  )}
                </div>

                {/* Dashboard View Mode Toggle */}
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 shadow-2xs self-start sm:self-auto">
                  <button
                    id="btn-dashboard-view-cards"
                    onClick={() => setDashboardViewMode('cards')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      dashboardViewMode === 'cards'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Events Grid</span>
                  </button>
                  <button
                    id="btn-dashboard-view-calendar"
                    onClick={() => setDashboardViewMode('calendar')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      dashboardViewMode === 'calendar'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>Schedule & Calendar</span>
                  </button>
                </div>
              </div>

              {dashboardViewMode === 'calendar' ? (
                <CalendarView
                  events={filteredEvents.length > 0 ? filteredEvents : events}
                  onSelectEvent={(evt) => setDetailModalEvent(evt)}
                />
              ) : (
                filteredEvents.length === 0 ? (
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
                )
              )}
            </div>

            {/* Developer Option Spotlight Card on Dashboard */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {/* Team Avatars Overlap */}
                <div className="flex -space-x-3 overflow-hidden p-0.5 shrink-0">
                  <div className="w-11 h-11 rounded-full ring-2 ring-white dark:ring-slate-900 overflow-hidden shrink-0 shadow-sm" title="Lakshya Rathore">
                    <img
                      src={localStorage.getItem('avatar_lakshya-rathore') || '/lakshya-profile.jpg'}
                      alt="Lakshya Rathore"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/lakshya.jpg';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-11 h-11 rounded-full ring-2 ring-white dark:ring-slate-900 overflow-hidden shrink-0 shadow-sm" title="Lakshya Sharma">
                    <img
                      src={localStorage.getItem('avatar_lakshya-sharma') || '/lakshya-sharma.jpg'}
                      alt="Lakshya Sharma"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Lakshya+Sharma&size=96&background=6366f1&color=fff';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-11 h-11 rounded-full ring-2 ring-white dark:ring-slate-900 overflow-hidden shrink-0 shadow-sm" title="Jatin Gehlod">
                    <img
                      src={localStorage.getItem('avatar_jatin-gehlod') || '/jatin-gehlod.jpg'}
                      alt="Jatin Gehlod"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Jatin+Gehlod&size=96&background=8b5cf6&color=fff';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Lakshya Rathore, Lakshya Sharma & Jatin Gehlod
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                      Platform Developers
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Mathematics & Computing (Aug 2025 – June 2029) • MITS Gwalior (BTMC25O1065 / BTMC25O1066)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                {/* Full Profile button */}
                <button
                  id="btn-dashboard-view-developer-profile"
                  onClick={() => setCurrentTab('developers')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Developers Hub</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: CLUBS DIRECTORY */}
        {currentTab === 'clubs' && (
          <ClubsView
            clubs={clubs}
            events={events}
            currentUser={currentUser}
            onSelectClubFilter={(clubId) => {
              setSelectedClubId(clubId);
              setCurrentTab('events');
            }}
            onOpenRegisterClub={() => setClubRegisterModalOpen(true)}
            onScheduleEventForClub={(clubId) => {
              setEditingEvent(null);
              setScheduleModalOpen(true);
            }}
            onManageAdmins={(club) => {
              setSelectedClubForAdmins(club);
              setClubAdminsModalOpen(true);
            }}
            onViewParticipants={(club) => {
              setSelectedClubForParticipants(club);
              setClubParticipantsModalOpen(true);
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
            onRefreshData={loadUserData}
            currentUser={currentUser}
            accessToken={googleDriveToken}
            onOpenGoogleDrive={() => setGoogleDriveModalOpen(true)}
          />
        )}

        {/* TAB 5: ORGANIZER DASHBOARD */}
        {currentTab === 'organizer' && (
          <OrganizerDashboard
            events={events}
            currentUser={currentUser}
            clubs={clubs}
            accessToken={googleDriveToken}
            onOpenGoogleDrive={() => setGoogleDriveModalOpen(true)}
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
            onNavigateToAdmin={() => setCurrentTab('admin')}
            onManageClubAdmins={(club) => {
              setSelectedClubForAdmins(club);
              setClubAdminsModalOpen(true);
            }}
            onRefreshData={loadData}
          />
        )}

        {/* TAB 6: CLUB ADMIN CANDIDATES DIRECTORY */}
        {currentTab === 'admin' && (
          <AdminRegistrationsView
            currentUser={currentUser}
            events={events}
            clubs={clubs}
            accessToken={googleDriveToken}
            onOpenGoogleDrive={() => setGoogleDriveModalOpen(true)}
            onOpenScheduleEvent={() => {
              setEditingEvent(null);
              setScheduleModalOpen(true);
            }}
            onOpenMailbox={() => setMailboxModalOpen(true)}
            onSwitchUser={(user) => {
              setCurrentUser(user);
              loadUserData();
            }}
            availableUsers={availableUsers}
            onOpenDatabaseManager={() => setDatabaseModalOpen(true)}
            onManageClubAdmins={(club) => {
              setSelectedClubForAdmins(club);
              setClubAdminsModalOpen(true);
            }}
          />
        )}

        {/* TAB 7: DEVELOPERS PROFILE & CREDITS */}
        {currentTab === 'developers' && (
          <DevelopersView onNavigateToEvents={() => setCurrentTab('events')} />
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-12 py-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center p-0.5 shadow-xs shrink-0 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700">
                <img 
                  src="/mits-logo.png" 
                  alt="MITS Gwalior" 
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/mits-logo.jpg';
                  }}
                  className="w-full h-full object-contain" 
                />
              </div>
              <span className="font-heading font-extrabold text-slate-900 dark:text-white text-sm">Universe</span>
            </div>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">Madhav institute of technology and science Gwalior (Estd. 1957)</span>
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
        accessToken={googleDriveToken}
        onOpenGoogleDrive={() => setGoogleDriveModalOpen(true)}
        onClose={() => setTicketModalData(null)}
        onReminderTriggered={() => loadUserData()}
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

      <ClubAdminsModal
        isOpen={clubAdminsModalOpen}
        onClose={() => {
          setClubAdminsModalOpen(false);
          setSelectedClubForAdmins(null);
        }}
        club={selectedClubForAdmins}
        currentUser={currentUser}
        onUpdateAdmins={handleUpdateClubAdmins}
      />

      {selectedClubForParticipants && (
        <ClubParticipantsModal
          isOpen={clubParticipantsModalOpen}
          onClose={() => {
            setClubParticipantsModalOpen(false);
            setSelectedClubForParticipants(null);
          }}
          club={selectedClubForParticipants}
          currentUser={currentUser}
          onUpdateClub={(updatedClub) => {
            setClubs(prev => prev.map(c => c.id === updatedClub.id ? updatedClub : c));
            setSelectedClubForParticipants(updatedClub);
          }}
          onRefreshClubs={loadData}
        />
      )}

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

      <ReminderToast
        alert={reminderAlert}
        onClose={() => setReminderAlert(null)}
        onOpenTicket={() => {
          if (!reminderAlert) return;
          const reg = myRegistrations.find(r => r.eventId === reminderAlert.eventId);
          const evt = events.find(e => e.id === reminderAlert.eventId);
          if (reg && evt) {
            setTicketModalData({ reg, evt });
          } else {
            setCurrentTab('passes');
          }
          setReminderAlert(null);
        }}
        onOpenMailbox={() => {
          setReminderAlert(null);
          setMailboxModalOpen(true);
        }}
      />

      <GoogleDriveModal
        isOpen={googleDriveModalOpen}
        onClose={() => setGoogleDriveModalOpen(false)}
        accessToken={googleDriveToken}
        currentUserEmail={googleDriveUserEmail}
        onTokenUpdated={(token, email) => {
          setGoogleDriveToken(token);
          if (email) setGoogleDriveUserEmail(email);
        }}
      />

      <DatabaseManagerModal
        isOpen={databaseModalOpen}
        onClose={() => setDatabaseModalOpen(false)}
        events={events}
        clubs={clubs}
        registrations={myRegistrations}
      />

    </div>
  );
}
