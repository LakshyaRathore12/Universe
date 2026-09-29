import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  Ticket, 
  PlusCircle, 
  Mail, 
  Bell, 
  ChevronDown, 
  Sparkles, 
  GraduationCap, 
  LogIn, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Menu,
  X,
  ShieldCheck,
  HardDrive,
  LogOut,
  BookOpen,
  BadgeCheck,
  Sun,
  Moon,
  Building,
  Crown
} from 'lucide-react';
import { User, InAppNotification, UserRole } from '../types.js';
import { isMasterUser } from '../lib/permissions.js';

interface NavbarProps {
  currentUser: User | null;
  currentTab: 'events' | 'clubs' | 'passes' | 'organizer' | 'admin';
  setCurrentTab: (tab: 'events' | 'clubs' | 'passes' | 'organizer' | 'admin') => void;
  onOpenAuth: (role?: UserRole, mode?: 'login' | 'register') => void;
  onOpenMailbox: () => void;
  onOpenScheduleEvent: () => void;
  onOpenGoogleDrive?: () => void;
  isGoogleDriveConnected?: boolean;
  onLogout?: () => void;
  unreadEmailCount: number;
  notifications: InAppNotification[];
  myPassesCount: number;
  onMarkNotificationsRead: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentTab,
  setCurrentTab,
  onOpenAuth,
  onOpenMailbox,
  onOpenScheduleEvent,
  onOpenGoogleDrive,
  isGoogleDriveConnected,
  onLogout,
  unreadEmailCount,
  notifications,
  myPassesCount,
  onMarkNotificationsRead,
  theme,
  onToggleTheme
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.read).length;

  const isMaster = isMasterUser(currentUser);
  const isStudent = currentUser?.role === 'student' || isMaster;
  const isClubOrganizer = currentUser?.role === 'club_organizer' || isMaster;
  const isFaculty = currentUser?.role === 'faculty' || currentUser?.role === 'admin' || currentUser?.role === 'master_admin' || isMaster;

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & MITS Gwalior Branding */}
          <div 
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0" 
            onClick={() => setCurrentTab('events')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white ring-2 ring-amber-400/40 shrink-0">
              <Building className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-heading font-extrabold text-base sm:text-xl tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                  Universe
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-extrabold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  MITS
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden lg:block">
                Madhav institute of technology and science Gwalior (Estd. 1957)
              </p>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block lg:hidden">
                MITS Gwalior (Estd. 1957)
              </p>
            </div>
          </div>

          {/* Desktop & Tablet Nav Tabs with RBAC */}
          <nav className="hidden md:flex items-center space-x-0.5 lg:space-x-1">
            <button
              id="nav-events-tab"
              onClick={() => setCurrentTab('events')}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all cursor-pointer ${
                currentTab === 'events'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden lg:inline">Events & Workshops</span>
              <span className="lg:hidden">Events</span>
            </button>

            <button
              id="nav-clubs-tab"
              onClick={() => setCurrentTab('clubs')}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all cursor-pointer ${
                currentTab === 'clubs'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden lg:inline">Clubs & Societies</span>
              <span className="lg:hidden">Clubs</span>
            </button>

            {/* Passes & Certificates: Available to Students & Organizers */}
            {(!currentUser || isStudent || isClubOrganizer) && (
              <button
                id="nav-passes-tab"
                onClick={() => {
                  if (!currentUser) {
                    onOpenAuth('student');
                  } else {
                    setCurrentTab('passes');
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all cursor-pointer ${
                  currentTab === 'passes'
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span className="hidden lg:inline">My Passes</span>
                <span className="lg:hidden">Passes</span>
                {myPassesCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 text-[10px] lg:text-[11px] font-extrabold rounded-full bg-emerald-500 text-white">
                    {myPassesCount}
                  </span>
                )}
              </button>
            )}

            {/* Organizer Hub: Visible strictly to Club Leaders and Faculty */}
            {(isClubOrganizer || isFaculty) && (
              <button
                id="nav-organizer-tab"
                onClick={() => setCurrentTab('organizer')}
                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all cursor-pointer ${
                  currentTab === 'organizer'
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="hidden lg:inline">Organizer Hub</span>
                <span className="lg:hidden">Organizer</span>
                {isClubOrganizer && (
                  <span className="hidden xl:inline text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Leader
                  </span>
                )}
              </button>
            )}

            {/* Faculty & Admin Senate Hub */}
            {isFaculty && (
              <button
                id="nav-admin-tab"
                onClick={() => setCurrentTab('admin')}
                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all cursor-pointer ${
                  currentTab === 'admin'
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="hidden lg:inline">Faculty & Senate Hub</span>
                <span className="lg:hidden">Senate</span>
                <span className="hidden xl:inline text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Faculty
                </span>
              </button>
            )}
          </nav>

          {/* Action Tools & User Profile */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-2.5 shrink-0">

            {/* Dark Mode / Light Mode Toggle Button */}
            <button
              id="btn-theme-toggle"
              type="button"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer"
              aria-label="Toggle Dark and Light Mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 animate-fadeIn" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300 animate-fadeIn" />
              )}
            </button>

            {/* Host Event Button: Available to Club Leaders & Faculty */}
            {(isClubOrganizer || isFaculty) && (
              <button
                id="btn-host-event-header"
                onClick={onOpenScheduleEvent}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 lg:py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-sm shadow-indigo-600/40 cursor-pointer"
                title="Host New Club Event or Workshop"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden xl:inline">Host Event</span>
                <span className="xl:hidden">Host</span>
              </button>
            )}

            {/* Google Drive Hub Button */}
            {onOpenGoogleDrive && (
              <button
                id="btn-open-google-drive"
                onClick={onOpenGoogleDrive}
                title={isGoogleDriveConnected ? "Google Drive Connected • Browse Files" : "Connect Google Drive"}
                className={`relative p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                  isGoogleDriveConnected
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750'
                }`}
              >
                <HardDrive className="w-4 h-4 text-indigo-400" />
                <span className="hidden xl:inline">Drive</span>
                {isGoogleDriveConnected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            )}

            {/* MITS Mailbox Button */}
            <button
              id="btn-open-mailbox"
              onClick={onOpenMailbox}
              title="Open MITS Campus Mailbox"
              className="relative p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
            >
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadEmailCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 sm:h-5 min-w-4 sm:min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] sm:text-[11px] font-bold text-white shadow-sm ring-2 ring-slate-900 animate-pulse">
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
                className="relative p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-2 text-slate-200">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">MITS Campus Alerts</span>
                    <button 
                      onClick={() => { onMarkNotificationsRead(); setShowNotifMenu(false); }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
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
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                    >
                      View All in Campus Mailbox &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Authenticated User Profile Menu (NO PROFILE SWITCHING ON-THE-FLY) */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="btn-user-profile"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className={`w-7 h-7 rounded-full object-cover ring-1 ${
                      currentUser.role === 'faculty' ? 'ring-amber-500' :
                      currentUser.role === 'student' ? 'ring-indigo-500' :
                      currentUser.role === 'club_organizer' ? 'ring-emerald-500' : 'ring-purple-500'
                    }`}
                  />
                  <div className="hidden lg:block text-left text-xs leading-tight pr-1">
                    <div className="font-semibold text-slate-200 max-w-[120px] truncate">{currentUser.name}</div>
                    <div className="text-[10px] capitalize flex items-center gap-1">
                      {currentUser.role === 'faculty' ? (
                        <span className="text-amber-400 font-bold">Faculty Member</span>
                      ) : currentUser.role === 'student' ? (
                        <span className="text-indigo-400 font-bold">MITS Student</span>
                      ) : currentUser.role === 'club_organizer' ? (
                        <span className="text-emerald-400 font-bold">Club Leader</span>
                      ) : (
                        <span className="text-purple-400 font-bold">Dean / Admin</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-80 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-2 text-slate-200 divide-y divide-slate-800/80 animate-fadeIn">
                    {/* User Profile Details */}
                    <div className="p-4 space-y-2.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/40 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Signed In As</p>
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                            {currentUser.role === 'faculty' && <BadgeCheck className="w-4 h-4 text-amber-400 shrink-0" />}
                            {currentUser.role === 'club_organizer' && <Crown className="w-4 h-4 text-emerald-400 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-indigo-400 font-mono truncate">{currentUser.email}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full capitalize border ${
                          currentUser.role === 'faculty'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : currentUser.role === 'student'
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            : currentUser.role === 'club_organizer'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        }`}>
                          {currentUser.role === 'faculty' ? 'Faculty Coordinator' : currentUser.role === 'club_organizer' ? 'Club Leader' : currentUser.role.replace('_', ' ')}
                        </span>
                        
                        {currentUser.studentId && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                            Roll: {currentUser.studentId}
                          </span>
                        )}

                        {currentUser.facultyId && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/50">
                            {currentUser.facultyId}
                          </span>
                        )}

                        {currentUser.year && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {currentUser.year}
                          </span>
                        )}
                      </div>

                      {currentUser.department && (
                        <p className="text-[11px] text-slate-400 truncate">
                          Dept: <span className="text-slate-200 font-medium">{currentUser.department}</span>
                        </p>
                      )}

                      {currentUser.clubName && (
                        <p className="text-[11px] text-emerald-300 font-medium truncate flex items-center gap-1">
                          <Crown className="w-3 h-3 text-emerald-400" />
                          <span>Club: {currentUser.clubName}</span>
                        </p>
                      )}

                      <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
                        Role Rights: {currentUser.role === 'faculty' || currentUser.role === 'admin' 
                          ? 'Full academic authority to approve events, venue bookings, accept club members, and certify attendance.' 
                          : currentUser.role === 'club_organizer' 
                            ? 'Authorized to schedule club events, take attendance for your club, and broadcast updates.' 
                            : 'Authorized to browse events, book tickets, and download verified certificates.'}
                      </div>
                    </div>

                    {/* Sign Out / Log Out Button - Strictly No Profile Switching on the Fly */}
                    <div className="p-2 space-y-1">
                      <button
                        id="btn-profile-logout"
                        onClick={() => {
                          setShowUserMenu(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center justify-between transition-colors font-bold cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <LogOut className="w-4 h-4 text-rose-400" />
                          <span>Log Out of MITS Portal</span>
                        </div>
                        <span className="text-[10px] text-rose-500">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Unauthenticated: Sign In or Register Buttons */
              <div className="flex items-center gap-2">
                <button
                  id="btn-nav-login"
                  onClick={() => onOpenAuth('student', 'login')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  id="btn-nav-register"
                  onClick={() => onOpenAuth('student', 'register')}
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                >
                  <span>Register</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-5 space-y-3 animate-fadeIn">
          
          {/* Mobile Quick Action Tiles */}
          <div className="grid grid-cols-2 gap-2 pb-2">
            {(isClubOrganizer || isFaculty) && (
              <button
                onClick={() => {
                  onOpenScheduleEvent();
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Host Event</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenMailbox();
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Mailbox</span>
              </div>
              {unreadEmailCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-500 text-white text-[10px] font-bold">
                  {unreadEmailCount}
                </span>
              )}
            </button>

            {onOpenGoogleDrive && (
              <button
                onClick={() => {
                  onOpenGoogleDrive();
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                  isGoogleDriveConnected
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Google Drive</span>
                </div>
                {isGoogleDriveConnected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            )}

            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1 pt-1 border-t border-slate-800">
            <button
              onClick={() => { setCurrentTab('events'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-colors ${
                currentTab === 'events' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Events & Workshops</span>
            </button>

            <button
              onClick={() => { setCurrentTab('clubs'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-colors ${
                currentTab === 'clubs' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Clubs & Societies</span>
            </button>

            {(!currentUser || isStudent || isClubOrganizer) && (
              <button
                onClick={() => { 
                  if (!currentUser) onOpenAuth('student');
                  else setCurrentTab('passes'); 
                  setMobileMenuOpen(false); 
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between transition-colors ${
                  currentTab === 'passes' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Ticket className="w-4 h-4" />
                  <span>My Passes & Tickets</span>
                </div>
                {myPassesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold">
                    {myPassesCount}
                  </span>
                )}
              </button>
            )}

            {(isClubOrganizer || isFaculty) && (
              <button
                onClick={() => { setCurrentTab('organizer'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between transition-colors ${
                  currentTab === 'organizer' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Organizer Hub</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">Organizer</span>
              </button>
            )}

            {isFaculty && (
              <button
                onClick={() => { setCurrentTab('admin'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between transition-colors ${
                  currentTab === 'admin' ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40' : 'text-amber-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Faculty & Senate Hub</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">Faculty</span>
              </button>
            )}
          </div>

          {/* User Account Controls */}
          {currentUser ? (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/50 border border-slate-800">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-700"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-indigo-400 font-mono truncate">{currentUser.email}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="capitalize font-semibold text-slate-300">{currentUser.role.replace('_', ' ')}</span>
                    {currentUser.studentId && <span>• Roll: {currentUser.studentId}</span>}
                    {currentUser.facultyId && <span>• ID: {currentUser.facultyId}</span>}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onLogout) onLogout();
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of MITS Portal</span>
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onOpenAuth('student', 'login');
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white text-center cursor-pointer shadow-sm shadow-indigo-600/30"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  onOpenAuth('student', 'register');
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-center cursor-pointer"
              >
                Register
              </button>
            </div>
          )}
        </div>
      )}
    </header>

    {/* Mobile Bottom Navigation Bar: Thumb-accessible on smartphones */}
    <nav 
      id="mobile-bottom-navbar" 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 dark:bg-slate-950/95 border-t border-slate-800 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around shadow-2xl"
      aria-label="Mobile Bottom Navigation"
    >
      <button
        onClick={() => { setCurrentTab('events'); setMobileMenuOpen(false); }}
        className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl flex-1 min-w-0 transition-colors cursor-pointer ${
          currentTab === 'events' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
        <span className="text-[9px] sm:text-[10px] truncate max-w-full">Events</span>
      </button>

      <button
        onClick={() => { setCurrentTab('clubs'); setMobileMenuOpen(false); }}
        className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl flex-1 min-w-0 transition-colors cursor-pointer ${
          currentTab === 'clubs' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Users className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
        <span className="text-[9px] sm:text-[10px] truncate max-w-full">Clubs</span>
      </button>

      {(!currentUser || isStudent || isClubOrganizer) ? (
        <button
          onClick={() => {
            if (!currentUser) onOpenAuth('student');
            else setCurrentTab('passes');
            setMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl flex-1 min-w-0 relative transition-colors cursor-pointer ${
            currentTab === 'passes' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Ticket className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
          <span className="text-[9px] sm:text-[10px] truncate max-w-full">Passes</span>
          {myPassesCount > 0 && (
            <span className="absolute top-0 right-1 sm:right-2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500 text-white text-[8px] sm:text-[9px] font-bold flex items-center justify-center">
              {myPassesCount}
            </span>
          )}
        </button>
      ) : (
        <button
          onClick={() => { onOpenScheduleEvent(); setMobileMenuOpen(false); }}
          className="flex flex-col items-center justify-center py-1 px-1 rounded-xl flex-1 min-w-0 text-indigo-400 font-bold cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
          <span className="text-[9px] sm:text-[10px] truncate max-w-full">Host</span>
        </button>
      )}

      {/* Organizer Hub button */}
      {isClubOrganizer && (
        <button
          onClick={() => {
            setCurrentTab('organizer');
            setMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl flex-1 min-w-0 transition-colors cursor-pointer ${
            currentTab === 'organizer' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-amber-400" />
          <span className="text-[9px] sm:text-[10px] truncate max-w-full">Organizer</span>
        </button>
      )}

      {/* Faculty Senate Hub button */}
      {isFaculty && (
        <button
          onClick={() => {
            setCurrentTab('admin');
            setMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl flex-1 min-w-0 transition-colors cursor-pointer ${
            currentTab === 'admin' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-amber-400" />
          <span className="text-[9px] sm:text-[10px] truncate max-w-full">Senate</span>
        </button>
      )}

      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl flex-1 min-w-0 relative transition-colors cursor-pointer ${
          mobileMenuOpen ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />}
        <span className="text-[9px] sm:text-[10px] truncate max-w-full">Menu</span>
        {unreadEmailCount > 0 && (
          <span className="absolute top-0 right-1 sm:right-2 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        )}
      </button>
    </nav>
  </>
  );
};
