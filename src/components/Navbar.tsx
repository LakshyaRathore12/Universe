import React, { useState } from 'react';
import { 
  GraduationCap, 
  Calendar, 
  Users, 
  Ticket, 
  PlusCircle, 
  Mail, 
  Bell, 
  ChevronDown, 
  LogIn, 
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Menu,
  X,
  Download,
  LayoutDashboard,
  Zap,
  Building
} from 'lucide-react';
import { User, InAppNotification } from '../types.js';

interface NavbarProps {
  currentUser: User | null;
  currentTab: 'events' | 'calendar' | 'clubs' | 'passes' | 'organizer';
  setCurrentTab: (tab: 'events' | 'calendar' | 'clubs' | 'passes' | 'organizer') => void;
  onOpenAuth: () => void;
  onOpenMailbox: () => void;
  onOpenScheduleEvent: () => void;
  onSwitchUser: (user: User) => void;
  availableUsers: User[];
  unreadEmailCount: number;
  notifications: InAppNotification[];
  myPassesCount: number;
  onMarkNotificationsRead: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentTab,
  setCurrentTab,
  onOpenAuth,
  onOpenMailbox,
  onOpenScheduleEvent,
  onSwitchUser,
  availableUsers,
  unreadEmailCount,
  notifications,
  myPassesCount,
  onMarkNotificationsRead
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & University Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('events')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white ring-2 ring-indigo-400/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-xl tracking-tight text-white">UniVerse</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Campus
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Central Events & Club Management</p>
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              id="nav-events-tab"
              onClick={() => setCurrentTab('events')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'events'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Events & Workshops
            </button>

            <button
              id="nav-calendar-tab"
              onClick={() => setCurrentTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'calendar'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Schedule & Calendar
            </button>

            <button
              id="nav-clubs-tab"
              onClick={() => setCurrentTab('clubs')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'clubs'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              Clubs Directory
            </button>

            {currentUser && currentUser.role === 'student' && (
              <button
                id="nav-passes-tab"
                onClick={() => setCurrentTab('passes')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'passes'
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>My Passes</span>
                {myPassesCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[11px] font-bold rounded-full bg-emerald-500 text-white">
                    {myPassesCount}
                  </span>
                )}
              </button>
            )}

            <button
              id="nav-organizer-tab"
              onClick={() => setCurrentTab('organizer')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'organizer'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Organizer Hub</span>
            </button>
          </nav>

          {/* Action Tools & User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Download Code Dropdown */}
            <div className="relative hidden lg:block">
              <button
                id="btn-download-code-menu"
                onClick={() => {
                  setShowDownloadMenu(!showDownloadMenu);
                  setShowUserMenu(false);
                  setShowNotifMenu(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white transition-all border border-slate-700/80 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download Code</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showDownloadMenu && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-2 z-50 animate-fadeIn text-xs"
                  onClick={() => setShowDownloadMenu(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Separate Code Packages
                  </div>

                  <a
                    href="/api/download/frontend"
                    download="universe-frontend.zip"
                    className="flex items-start gap-2.5 px-3 py-2 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 mt-0.5">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Frontend Client (.zip)</div>
                      <div className="text-[11px] text-slate-400">React 19, Tailwind, Vite, Components</div>
                    </div>
                  </a>

                  <a
                    href="/api/download/backend"
                    download="universe-backend.zip"
                    className="flex items-start gap-2.5 px-3 py-2 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Backend REST API (.zip)</div>
                      <div className="text-[11px] text-slate-400">Express, Controllers, Routes, SSE Alerts</div>
                    </div>
                  </a>

                  <a
                    href="/api/download/database"
                    download="universe-database.zip"
                    className="flex items-start gap-2.5 px-3 py-2 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Database Files (.zip)</div>
                      <div className="text-[11px] text-slate-400">Mongoose Schemas, Models & Seeder</div>
                    </div>
                  </a>

                  <div className="my-1 border-t border-slate-800" />

                  <a
                    href="/api/download/all"
                    download="universe-event-management-complete.zip"
                    className="flex items-start gap-2.5 px-3 py-2 hover:bg-slate-800 text-emerald-300 hover:text-emerald-200 transition-colors font-semibold"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 mt-0.5">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <div>Download Complete Package (.zip)</div>
                      <div className="text-[10px] text-slate-400 font-normal">All frontend, backend & database files</div>
                    </div>
                  </a>
                </div>
              )}
            </div>

            {/* Host Event Button (Quick action) */}
            <button
              id="btn-host-event-header"
              onClick={onOpenScheduleEvent}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-sm shadow-indigo-600/40"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Host Event</span>
            </button>

            {/* University Mailbox Button with Real-time Unread Badge */}
            <button
              id="btn-open-mailbox"
              onClick={onOpenMailbox}
              title="Open University Mailbox (Simulated Email Deliveries)"
              className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Mail className="w-5 h-5" />
              {unreadEmailCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-slate-900 animate-pulse">
                  {unreadEmailCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                id="btn-notifications"
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  if (!showNotifMenu && unreadNotifs > 0) {
                    onMarkNotificationsRead();
                  }
                }}
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-2 text-slate-200">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Campus Alerts</span>
                    <button 
                      onClick={() => { onMarkNotificationsRead(); setShowNotifMenu(false); }}
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No notifications yet. Register for events to receive live updates.
                      </div>
                    ) : (
                      notifications.slice(0, 5).map(n => (
                        <div key={n.id} className={`p-3 text-xs flex gap-2.5 ${n.read ? 'opacity-70' : 'bg-slate-800/40'}`}>
                          {n.type === 'alert' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                          {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                          {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                          {n.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />}
                          <div>
                            <div className="font-semibold text-slate-200">{n.title}</div>
                            <div className="text-slate-400 mt-0.5 leading-relaxed">{n.message}</div>
                            <div className="text-[10px] text-slate-500 mt-1">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-slate-800 text-center">
                    <button 
                      onClick={() => { onOpenMailbox(); setShowNotifMenu(false); }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      View All in Campus Mailbox &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Account / Role Switcher */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="btn-user-profile"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 border border-slate-700/60 transition-colors"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-indigo-500/50"
                  />
                  <div className="hidden lg:block text-left text-xs leading-tight pr-1">
                    <div className="font-semibold text-slate-200 max-w-[120px] truncate">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      {currentUser.role.replace('_', ' ')}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-2 text-slate-200">
                    <div className="p-3 border-b border-slate-800">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-indigo-400 truncate">{currentUser.email}</p>
                      {currentUser.clubName && (
                        <p className="text-[11px] text-amber-300 mt-1 font-medium truncate">
                          Org: {currentUser.clubName}
                        </p>
                      )}
                    </div>

                    <div className="py-2">
                      <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Switch Demo Role
                      </p>
                      {availableUsers.map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            onSwitchUser(u);
                            setShowUserMenu(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                            u.id === currentUser.id
                              ? 'bg-indigo-600/30 text-indigo-300 font-semibold'
                              : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="truncate">{u.name.split('(')[0]}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {u.role === 'student' ? 'Student' : u.role === 'club_organizer' ? 'Club' : 'Dean'}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          onOpenAuth();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-indigo-400 hover:bg-slate-800 flex items-center gap-1.5"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign In with another Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="btn-nav-login"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          <button
            onClick={() => { setCurrentTab('events'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
          >
            Events & Workshops
          </button>
          <button
            onClick={() => { setCurrentTab('calendar'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
          >
            Schedule & Calendar
          </button>
          <button
            onClick={() => { setCurrentTab('clubs'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
          >
            Clubs Directory
          </button>
          <button
            onClick={() => { setCurrentTab('passes'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
          >
            My Passes ({myPassesCount})
          </button>
          <button
            onClick={() => { setCurrentTab('organizer'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
          >
            Organizer Hub
          </button>
          <button
            onClick={() => { onOpenScheduleEvent(); setMobileMenuOpen(false); }}
            className="w-full mt-2 text-center py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white"
          >
            Host New Event
          </button>
          <div className="pt-2 border-t border-slate-800 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">
              Download Code Packages
            </div>
            <a
              href="/api/download/frontend"
              download="universe-frontend.zip"
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              <span>💻 Frontend Client</span>
              <span className="text-[10px] text-slate-500">.zip</span>
            </a>
            <a
              href="/api/download/backend"
              download="universe-backend.zip"
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              <span>🚀 Backend REST API</span>
              <span className="text-[10px] text-slate-500">.zip</span>
            </a>
            <a
              href="/api/download/database"
              download="universe-database.zip"
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              <span>🗄️ Database Schemas</span>
              <span className="text-[10px] text-slate-500">.zip</span>
            </a>
            <a
              href="/api/download/all"
              download="universe-event-management-complete.zip"
              className="w-full mt-1.5 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Complete Monorepo (.zip)</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
