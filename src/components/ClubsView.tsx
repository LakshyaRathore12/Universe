import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  PlusCircle, 
  CheckCircle2, 
  Mail, 
  ExternalLink,
  Search,
  Sparkles,
  ShieldCheck,
  Hash,
  Phone,
  GraduationCap,
  Clock,
  Crown,
  BookOpen,
  Lock,
  Settings
} from 'lucide-react';
import { Club, UniversityEvent, User } from '../types.js';
import { 
  isMasterUser, 
  isUserAssignedLeaderForClub, 
  canUserOrganizeEventsForClub,
  canUserModifyClub
} from '../lib/permissions.js';

interface ClubsViewProps {
  clubs: Club[];
  events: UniversityEvent[];
  currentUser?: User | null;
  onSelectClubFilter: (clubId: string) => void;
  onOpenRegisterClub: () => void;
  onScheduleEventForClub: (clubId: string) => void;
  onManageAdmins: (club: Club) => void;
  onViewParticipants?: (club: Club) => void;
}

export const ClubsView: React.FC<ClubsViewProps> = ({
  clubs,
  events,
  currentUser,
  onSelectClubFilter,
  onOpenRegisterClub,
  onScheduleEventForClub,
  onManageAdmins,
  onViewParticipants
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const isMaster = isMasterUser(currentUser);
  const isFaculty = isMaster || currentUser?.role === 'faculty' || currentUser?.role === 'admin' || currentUser?.role === 'master_admin';
  const isClubOrganizer = currentUser?.role === 'club_organizer';

  const filteredClubs = clubs.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-sm border border-slate-800">
        <div className="relative z-10 max-w-3xl">
          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>MITS Gwalior Student Societies & Chapters</span>
          </span>
          <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">
            MITS Student Clubs, Societies & Chapters
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-3 leading-relaxed max-w-2xl">
            Explore recognized student societies at Madhav Institute of Technology and Science. Under institutional regulations, Faculty Coordinators appoint Club Leaders (President and Vice President positions). A club leader holds permissions exclusively for their assigned society and cannot modify any other clubs.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {isFaculty && (
              <button
                onClick={onOpenRegisterClub}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Register New Society</span>
              </button>
            )}

            {isFaculty && (
              <div className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Faculty Rights: Review join requests, assign President/VP positions, and edit club participants.</span>
              </div>
            )}

            {isClubOrganizer && !isFaculty && (
              <div className="px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Club Leader Access: Scoped strictly to your faculty-assigned society (President / Vice President clearance). Other clubs are protected.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search MITS clubs, keywords, chapters..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'Technical', 'Cultural', 'Academic'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'all' ? 'All Societies' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Club Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredClubs.map(club => {
          const clubEvents = events.filter(e => e.clubId === club.id);
          const members = club.members || [];
          const activeMembers = members.filter(m => m.status === 'active');
          const pendingRequests = members.filter(m => m.status === 'pending');

          // Check if current user is assigned leader (President or Vice President) for THIS specific club
          const isLeaderOfThisClub = isUserAssignedLeaderForClub(currentUser, club);
          const canHostForThisClub = canUserOrganizeEventsForClub(currentUser, club);
          const canModifyThisClub = canUserModifyClub(currentUser, club);

          const admins = club.admins && club.admins.length > 0 ? club.admins : [
            {
              id: 'primary',
              name: club.leadName || 'Lead Admin',
              email: club.leadEmail || 'club@mitsgwl.ac.in',
              enrollmentNo: club.leadEnrollmentNo || '0901CS221001',
              phone: club.leadPhone || '+91 98000 00000',
              year: club.leadYear || '3rd Year',
              roleTitle: 'Club President'
            }
          ];

          return (
            <div 
              key={club.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                isLeaderOfThisClub
                  ? 'border-indigo-500/60 ring-1 ring-indigo-500/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                {/* Banner */}
                <div className="h-36 w-full relative bg-slate-900 overflow-hidden">
                  <img 
                    src={club.bannerImage} 
                    alt={club.name}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                  
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={club.logo} 
                        alt={club.name}
                        className="w-14 h-14 rounded-2xl border-2 border-white dark:border-slate-700 object-cover shadow-md bg-white p-0.5"
                      />
                      <div className="text-white">
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                          {club.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isLeaderOfThisClub && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/80 text-white border border-indigo-400 flex items-center gap-1 backdrop-blur-md shadow-xs">
                          <Crown className="w-3.5 h-3.5 text-amber-300" />
                          <span>Your Assigned Society</span>
                        </span>
                      )}

                      {club.isVerified && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 backdrop-blur-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>MITS Verified</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Club Details */}
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
                      {club.name}
                    </h3>

                    {(isFaculty || isLeaderOfThisClub) && onManageAdmins && (
                      <button
                        onClick={() => onManageAdmins(club)}
                        className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center gap-1 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                        title={isFaculty ? "Faculty manage club leadership roster" : "Manage leadership roster of your assigned club"}
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Leadership</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {club.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Faculty Advisor</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{club.facultyAdvisor}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Active Participants</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{activeMembers.length > 0 ? activeMembers.length : (club.memberCount || 20)}+ students</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Events Hosted</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{clubEvents.length} scheduled</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Established</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{club.foundedYear || 2015}</span>
                    </div>
                  </div>

                  {/* Club Leadership Preview */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        <span>Faculty-Assigned Leaders ({admins.length})</span>
                      </div>
                      
                      {onViewParticipants && (
                        <button
                          onClick={() => onViewParticipants(club)}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Participants ({activeMembers.length})</span>
                          {pendingRequests.length > 0 && isFaculty && (
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                              {pendingRequests.length} pending
                            </span>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {admins.slice(0, 1).map((adm, idx) => (
                        <div key={adm.id || idx} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-2.5 text-xs flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white truncate">{adm.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold">
                                {adm.roleTitle || 'Club President'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 font-mono">
                              <span className="text-slate-800 dark:text-slate-300 font-semibold">{adm.enrollmentNo}</span>
                              <span>•</span>
                              <span className="text-indigo-600 dark:text-indigo-400">{adm.email}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Footer */}
              <div className="p-5 pt-0 flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => onSelectClubFilter(club.id)}
                  className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-center transition-colors cursor-pointer"
                >
                  View Events ({clubEvents.length})
                </button>

                {onViewParticipants && (
                  <button
                    onClick={() => onViewParticipants(club)}
                    className="py-2 px-3 text-xs font-bold rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-1.5 cursor-pointer relative"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Participants</span>
                    {pendingRequests.length > 0 && isFaculty && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </button>
                )}

                {/* Host Event: Available ONLY to Faculty OR the specific Club Leader assigned to THIS club */}
                {canHostForThisClub ? (
                  <button
                    onClick={() => onScheduleEventForClub(club.id)}
                    className="py-2 px-3 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                    title={isFaculty ? "Faculty organize event for this club" : "Host event as designated President/Vice President"}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Host Event</span>
                  </button>
                ) : isClubOrganizer && !isFaculty ? (
                  <div 
                    className="py-2 px-2.5 text-[11px] font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center gap-1 cursor-not-allowed"
                    title="Strictly Restricted: You are only permitted to organize events for the club where faculty assigned your email as President or Vice President."
                  >
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Other Club Protected</span>
                  </div>
                ) : null}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

