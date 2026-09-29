import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  Trash2, 
  Award, 
  Image as ImageIcon,
  Sparkles,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { Club, UniversityEvent, UniversityVenue, User } from '../types.js';
import { 
  isMasterUser, 
  getAllowedClubsForUser, 
  canUserOrganizeEventsForClub, 
  isUserAssignedLeaderForClub 
} from '../lib/permissions.js';

interface EventScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEvent: (eventData: Partial<UniversityEvent>, isReschedule: boolean, rescheduleReason?: string) => Promise<void>;
  editingEvent: UniversityEvent | null;
  clubs: Club[];
  venues: UniversityVenue[];
  currentUser: User | null;
}

export const EventScheduleModal: React.FC<EventScheduleModalProps> = ({
  isOpen,
  onClose,
  onSaveEvent,
  editingEvent,
  clubs,
  venues,
  currentUser
}) => {
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [clubId, setClubId] = useState('');
  const [category, setCategory] = useState<UniversityEvent['category']>('Workshop');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('16:00');
  const [venue, setVenue] = useState('');
  const [venueId, setVenueId] = useState('');
  const [venueMode, setVenueMode] = useState<'preset' | 'custom'>('preset');
  const [capacity, setCapacity] = useState(80);
  const [certificatesProvided, setCertificatesProvided] = useState(true);
  const [facultyCoordinator, setFacultyCoordinator] = useState('');
  const [facultyCoordinatorEmail, setFacultyCoordinatorEmail] = useState('');
  const [facultyCoordinatorDept, setFacultyCoordinatorDept] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Agenda items
  const [agenda, setAgenda] = useState<{ id: string; time: string; title: string; speaker?: string }[]>([
    { id: '1', time: '10:00 - 11:30 AM', title: 'Introductory Keynote & Overview' },
    { id: '2', time: '11:45 - 01:30 PM', title: 'Hands-on Interactive Session & Code Lab' }
  ]);

  // Speakers
  const [speakers, setSpeakers] = useState<{ name: string; role: string; companyOrCollege: string; avatar: string }[]>([
    { name: '', role: '', companyOrCollege: '', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' }
  ]);

  const isMaster = isMasterUser(currentUser);
  const isFaculty = isMaster || currentUser?.role === 'faculty' || currentUser?.role === 'admin' || currentUser?.role === 'master_admin';
  const allowedClubs = getAllowedClubsForUser(currentUser, clubs);

  useEffect(() => {
    setPermissionError(null);
    if (editingEvent) {
      const targetClub = clubs.find(c => c.id === editingEvent.clubId);
      if (!isFaculty && !isUserAssignedLeaderForClub(currentUser, targetClub)) {
        setPermissionError(`Access Denied: You are not authorized to modify events for "${editingEvent.clubName}". Club leaders can only modify events of the club where faculty assigned their email as President or Vice President.`);
      }

      setTitle(editingEvent.title);
      setTagline(editingEvent.tagline);
      setDescription(editingEvent.description);
      setClubId(editingEvent.clubId);
      setCategory(editingEvent.category);
      setStartDate(editingEvent.startDate);
      setStartTime(editingEvent.startTime);
      setEndDate(editingEvent.endDate);
      setEndTime(editingEvent.endTime);
      setVenue(editingEvent.venue);
      setVenueId(editingEvent.venueId || '');
      const isCustom = editingEvent.venueId === 'custom' || !venues.some(v => v.id === editingEvent.venueId);
      setVenueMode(isCustom ? 'custom' : 'preset');
      setCapacity(editingEvent.capacity);
      setCertificatesProvided(editingEvent.certificatesProvided);
      setFacultyCoordinator(editingEvent.facultyCoordinator || '');
      setFacultyCoordinatorEmail(editingEvent.facultyCoordinatorEmail || '');
      setFacultyCoordinatorDept(editingEvent.facultyCoordinatorDept || '');
      setCoverImage(editingEvent.coverImage);
      setAgenda(editingEvent.agenda || []);
      setSpeakers(editingEvent.speakers || []);
      setRescheduleReason('');
    } else {
      // Defaults for new event
      setTitle('');
      setTagline('');
      setDescription('');
      
      // Default to user's assigned club
      const defaultClub = allowedClubs.length > 0 ? allowedClubs[0] : clubs[0];
      setClubId(defaultClub?.id || '');
      setCategory('Workshop');
      setFacultyCoordinator(defaultClub?.facultyAdvisor || 'Prof. Radhika Iyer');
      setFacultyCoordinatorEmail(defaultClub?.facultyAdvisorEmail || 'radhika.iyer@mitsgwalior.in');
      setFacultyCoordinatorDept('Department of Computer Science & Engineering');
      
      const tomorrow = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
      setStartDate(tomorrow);
      setEndDate(tomorrow);
      setStartTime('10:00');
      setEndTime('16:00');
      
      setVenueMode('preset');
      if (venues[0]) {
        setVenue(venues[0].name);
        setVenueId(venues[0].id);
        setCapacity(venues[0].capacity);
      } else {
        setVenue('Main Block Auditorium');
        setVenueId('custom');
        setCapacity(150);
      }
      setCoverImage('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80');
      setCertificatesProvided(true);
      setRescheduleReason('');
      setAgenda([
        { id: '1', time: '10:00 - 11:30 AM', title: 'Welcome & Introductory Keynote' },
        { id: '2', time: '11:45 - 01:30 PM', title: 'Hands-on Technical Practice Session' },
        { id: '3', time: '02:30 - 04:00 PM', title: 'Project Demonstrations & Q&A' }
      ]);
      setSpeakers([]);
    }
  }, [editingEvent, isOpen, clubs, venues, currentUser]);

  if (!isOpen) return null;

  const handleVenueChange = (selectedVenueId: string) => {
    setVenueId(selectedVenueId);
    const found = venues.find(v => v.id === selectedVenueId);
    if (found) {
      setVenue(found.name);
      setCapacity(found.capacity);
    }
  };

  const handleAddAgenda = () => {
    setAgenda([...agenda, { id: `ag-${Date.now()}`, time: '02:00 - 03:00 PM', title: 'New Agenda Session' }]);
  };

  const handleRemoveAgenda = (index: number) => {
    setAgenda(agenda.filter((_, i) => i !== index));
  };

  const handleAddSpeaker = () => {
    setSpeakers([...speakers, {
      name: '',
      role: 'Lead Mentor',
      companyOrCollege: 'University Dept',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
    }]);
  };

  const handleRemoveSpeaker = (index: number) => {
    setSpeakers(speakers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenClub = clubs.find(c => c.id === clubId);
    if (!isFaculty && !isUserAssignedLeaderForClub(currentUser, chosenClub)) {
      setPermissionError(`Access Denied: You do not have permissions to organize events for "${chosenClub?.name || 'this club'}". You can only organize events for the club where faculty assigned your email for President or Vice President position.`);
      return;
    }

    setLoading(true);
    try {
      const payload: Partial<UniversityEvent> = {
        title,
        tagline,
        description,
        clubId,
        category,
        startDate,
        startTime,
        endDate,
        endTime,
        venue,
        venueId,
        capacity: Number(capacity),
        coverImage,
        certificatesProvided,
        facultyCoordinator: facultyCoordinator.trim() || undefined,
        facultyCoordinatorEmail: facultyCoordinatorEmail.trim() || undefined,
        facultyCoordinatorDept: facultyCoordinatorDept.trim() || undefined,
        agenda: agenda.filter(a => a.title.trim() !== ''),
        speakers: speakers.filter(s => s.name.trim() !== '')
      };

      await onSaveEvent(payload, !!editingEvent, rescheduleReason);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {editingEvent ? 'Edit / Reschedule' : 'Club Event Hosting'}
              </span>
            </div>
            <h2 className="font-heading text-xl font-bold mt-1 text-white">
              {editingEvent ? `Reschedule "${editingEvent.title}"` : 'Schedule a New University Event'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6 text-xs text-slate-700">
          
          {editingEvent && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
              <div className="flex items-center gap-1.5 font-bold mb-1 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Real-Time Attendee Notification Trigger</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800 mb-2">
                Saving changes to date, time, or venue will automatically dispatch a real-time schedule update email to all {editingEvent.registeredCount} registered attendees.
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-amber-950 mb-1">
                  Reason for Rescheduling / Update Note for Attendees:
                </label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={e => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Venue moved to Auditorium A due to high student registration demand."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white"
                />
              </div>
            </div>
          )}

          {permissionError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2">
              <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-xs text-rose-950">Permission Restriction</strong>
                <p className="text-[11px] leading-relaxed text-rose-800">{permissionError}</p>
              </div>
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
              1. Event Identity & Organizing Club
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-800 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Autonomous Robotics & Drone Flight Workshop"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Workshop">Workshop</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Guest Lecture">Guest Lecture</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Tech Talk">Tech Talk</option>
                  <option value="Competition">Competition</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Hosting Club *</label>
                <select
                  value={clubId}
                  onChange={e => setClubId(e.target.value)}
                  disabled={!isFaculty && allowedClubs.length <= 1}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-600"
                  required
                >
                  {(isFaculty ? clubs : allowedClubs).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
                {!isFaculty && allowedClubs.length > 0 && (
                  <p className="text-[10px] text-indigo-700 font-semibold mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                    <span>Scoped to your faculty-assigned society (President / VP clearance).</span>
                  </p>
                )}
                {!isFaculty && allowedClubs.length === 0 && (
                  <p className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-rose-500 shrink-0" />
                    <span>Not assigned as President or Vice President of any society.</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Short Tagline / Catchphrase</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="e.g. Hands-on coding with modern LLM agents"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Detailed Description *</label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Explain the agenda, takeaways, who should attend, and what will be built..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                required
              />
            </div>

            {/* Faculty Coordinator / Academic Oversight */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <GraduationCap className="w-4 h-4 text-amber-600" />
                  <span>Faculty Coordinator / Academic Advisor *</span>
                </label>
                <span className="text-[10px] text-amber-900 font-semibold px-2 py-0.5 rounded-full bg-amber-100/90 border border-amber-200">
                  Required for Academic Oversight & Certificate Verification
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Coordinator Name *
                  </label>
                  <input
                    type="text"
                    value={facultyCoordinator}
                    onChange={e => setFacultyCoordinator(e.target.value)}
                    placeholder="e.g. Prof. Radhika Iyer / Dr. Rajesh Kulkarni"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Faculty Email
                  </label>
                  <input
                    type="email"
                    value={facultyCoordinatorEmail}
                    onChange={e => setFacultyCoordinatorEmail(e.target.value)}
                    placeholder="e.g. radhika.iyer@mitsgwalior.in"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-amber-700" />
                  <span>Quick Faculty Select:</span>
                </span>
                {[
                  { name: 'Prof. Radhika Iyer', email: 'radhika.iyer@mitsgwalior.in', dept: 'Computer Science & Engineering' },
                  { name: 'Dr. Rajesh Kulkarni', email: 'rajesh.kulkarni@mitsgwalior.in', dept: 'Engineering & Robotics' },
                  { name: 'Dr. Anandita Sen', email: 'dean.academics@mitsgwalior.in', dept: 'Dean Academic Affairs' },
                  { name: 'Prof. Vikram Saxena', email: 'vikram.saxena@mitsgwalior.in', dept: 'Arts & Media Studies' },
                  { name: 'Dr. Sunita Mehra', email: 'sunita.mehra@mitsgwalior.in', dept: 'Electronics & Communication' }
                ].map(fac => (
                  <button
                    key={fac.name}
                    type="button"
                    onClick={() => {
                      setFacultyCoordinator(fac.name);
                      setFacultyCoordinatorEmail(fac.email);
                      setFacultyCoordinatorDept(fac.dept);
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      facultyCoordinator === fac.name
                        ? 'bg-amber-600 text-white border-amber-600 font-bold'
                        : 'bg-white hover:bg-amber-100/70 border-amber-300 text-amber-950 font-medium'
                    }`}
                  >
                    + {fac.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Date, Time & Venue Scheduling */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
              2. Date, Time & Campus Venue Scheduling
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Start Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Start Time *</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>

            {/* Campus Venue Selection & Custom Venue Option */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>Campus Venue *</span>
                </label>
                
                {/* Mode Selector Tabs: Choose Preset vs Write Venue by Own */}
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs self-start sm:self-auto">
                  <button
                    type="button"
                    id="btn-venue-preset-tab"
                    onClick={() => {
                      setVenueMode('preset');
                      if (venues.length > 0 && (!venueId || venueId === 'custom')) {
                        setVenueId(venues[0].id);
                        setVenue(venues[0].name);
                        setCapacity(venues[0].capacity);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      venueMode === 'preset'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <span>🏛️ Choose Preset Venue</span>
                  </button>
                  <button
                    type="button"
                    id="btn-venue-custom-tab"
                    onClick={() => {
                      setVenueMode('custom');
                      setVenueId('custom');
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      venueMode === 'custom'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <span>✍️ Write Venue by Own</span>
                  </button>
                </div>
              </div>

              {venueMode === 'preset' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Select University Venue from Directory
                    </label>
                    <select
                      value={venueId}
                      onChange={e => {
                        if (e.target.value === 'custom') {
                          setVenueMode('custom');
                          setVenueId('custom');
                        } else {
                          handleVenueChange(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {venues.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.building}) — Capacity: {v.capacity}
                        </option>
                      ))}
                      <option value="custom">✍️ Other / Write Campus Venue by Own...</option>
                    </select>

                    <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
                      <span className="truncate">Venue: <strong className="text-slate-800 dark:text-slate-200">{venue}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          setVenueMode('custom');
                          setVenueId('custom');
                        }}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold shrink-0 ml-2"
                      >
                        Write custom venue instead &rarr;
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Capacity / Seats *
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={5000}
                      value={capacity}
                      onChange={e => setCapacity(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>
              ) : (
                /* Write Campus Venue by Own Option */
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Write Campus Venue Name & Location *
                      </label>
                      <input
                        type="text"
                        id="input-write-venue-own"
                        value={venue}
                        onChange={e => setVenue(e.target.value)}
                        placeholder="e.g., Mechanical Seminar Hall 2, SAC Amphitheatre, Lab 105, Room 204..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-indigo-500 dark:border-indigo-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Seats / Expected Audience *
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={5000}
                        value={capacity}
                        onChange={e => setCapacity(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Quick Campus Suggestions to click & autofill */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Quick Campus Locations:
                    </span>
                    {[
                      'Main Block Auditorium',
                      'SAC Open Air Amphitheatre',
                      'Mechanical Seminar Hall 1',
                      'Civil Dept Conference Hall',
                      'MCA Smart Lab 2',
                      'MITS Central Sports Ground',
                      'Electrical Engineering Seminar Hall',
                      'Virtual Meeting (Google Meet / Zoom)'
                    ].map(loc => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          setVenue(loc);
                          if (loc.includes('Amphitheatre') || loc.includes('Sports')) {
                            setCapacity(350);
                          } else if (loc.includes('Auditorium')) {
                            setCapacity(250);
                          } else if (loc.includes('Lab')) {
                            setCapacity(60);
                          } else if (loc.includes('Virtual')) {
                            setCapacity(300);
                          } else {
                            setCapacity(100);
                          }
                        }}
                        className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer ${
                          venue === loc
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        + {loc}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Agenda Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-1">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                3. Event Agenda / Session Timeline
              </h3>
              <button
                type="button"
                onClick={handleAddAgenda}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Session</span>
              </button>
            </div>

            <div className="space-y-2">
              {agenda.map((ag, idx) => (
                <div key={ag.id || idx} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <input
                    type="text"
                    value={ag.time}
                    onChange={e => {
                      const copy = [...agenda];
                      copy[idx].time = e.target.value;
                      setAgenda(copy);
                    }}
                    placeholder="e.g. 10:00 - 11:30 AM"
                    className="w-36 px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    value={ag.title}
                    onChange={e => {
                      const copy = [...agenda];
                      copy[idx].title = e.target.value;
                      setAgenda(copy);
                    }}
                    placeholder="Session Title (e.g. Hands-on Code Lab)"
                    className="flex-1 px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    value={ag.speaker || ''}
                    onChange={e => {
                      const copy = [...agenda];
                      copy[idx].speaker = e.target.value;
                      setAgenda(copy);
                    }}
                    placeholder="Speaker (Optional)"
                    className="w-32 px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white hidden sm:block"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAgenda(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Cover Image & Extra Details */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
              4. Visual Banner & Certificate Options
            </h3>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Cover Image URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={coverImage}
                  onChange={e => setCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] text-slate-400 self-center">Presets:</span>
                <button
                  type="button"
                  onClick={() => setCoverImage('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80')}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  Tech Seminar
                </button>
                <button
                  type="button"
                  onClick={() => setCoverImage('https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1000&auto=format&fit=crop&q=80')}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  Code Lab
                </button>
                <button
                  type="button"
                  onClick={() => setCoverImage('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000&auto=format&fit=crop&q=80')}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  Cultural Stage
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="cert-check"
                checked={certificatesProvided}
                onChange={e => setCertificatesProvided(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="cert-check" className="font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Provide Official University Event Participation Certificate to Attendees</span>
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors text-center cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Saving...' : editingEvent ? 'Save & Notify Attendees' : 'Publish & Schedule Event'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
