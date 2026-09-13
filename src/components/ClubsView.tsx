import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  PlusCircle, 
  CheckCircle2, 
  Mail, 
  ExternalLink,
  Search,
  Sparkles
} from 'lucide-react';
import { Club, UniversityEvent } from '../types.js';

interface ClubsViewProps {
  clubs: Club[];
  events: UniversityEvent[];
  onSelectClubFilter: (clubId: string) => void;
  onOpenRegisterClub: () => void;
  onScheduleEventForClub: (clubId: string) => void;
}

export const ClubsView: React.FC<ClubsViewProps> = ({
  clubs,
  events,
  onSelectClubFilter,
  onOpenRegisterClub,
  onScheduleEventForClub
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredClubs = clubs.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Student Life & Societies
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white mt-3">
            University Clubs & Organizations
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
            Discover student-led clubs, join specialized communities, and host official workshops, technical symposiums, and cultural festivals.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onOpenRegisterClub}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register New Club</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clubs or keywords..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'Technical', 'Cultural', 'Academic'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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

          return (
            <div 
              key={club.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Banner */}
                <div className="h-32 w-full relative bg-slate-900 overflow-hidden">
                  <img 
                    src={club.bannerImage} 
                    alt={club.name}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={club.logo} 
                        alt={club.name}
                        className="w-12 h-12 rounded-xl border-2 border-white object-cover shadow bg-white"
                      />
                      <div className="text-white">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                          {club.category}
                        </span>
                      </div>
                    </div>
                    {club.isVerified && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 backdrop-blur-md">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Recognized Club</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Club Details */}
                <div className="p-5">
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    {club.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {club.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Club Convener</span>
                      <span className="font-semibold text-slate-800 truncate block">{club.leadName}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Faculty Advisor</span>
                      <span className="font-semibold text-slate-800 truncate block">{club.facultyAdvisor}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Active Members</span>
                      <span className="font-semibold text-slate-800">{club.memberCount}+ students</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Events Hosted</span>
                      <span className="font-semibold text-indigo-600">{clubEvents.length} upcoming</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-5 pt-0 flex gap-2">
                <button
                  onClick={() => onSelectClubFilter(club.id)}
                  className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-center transition-colors"
                >
                  View Club's Events ({clubEvents.length})
                </button>
                <button
                  onClick={() => onScheduleEventForClub(club.id)}
                  className="py-2 px-3.5 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Host Event</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
