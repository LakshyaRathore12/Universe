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
  AlertTriangle
} from 'lucide-react';
import { Club, UniversityEvent, UniversityVenue, User } from '../types.js';

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
  const [capacity, setCapacity] = useState(80);
  const [certificatesProvided, setCertificatesProvided] = useState(true);
  const [coverImage, setCoverImage] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Agenda items
  const [agenda, setAgenda] = useState<{ id: string; time: string; title: string; speaker?: string }[]>([
    { id: '1', time: '10:00 - 11:30 AM', title: 'Introductory Keynote & Overview' },
    { id: '2', time: '11:45 - 01:30 PM', title: 'Hands-on Interactive Session & Code Lab' }
  ]);

  // Speakers
  const [speakers, setSpeakers] = useState<{ name: string; role: string; companyOrCollege: string; avatar: string }[]>([
    { name: '', role: '', companyOrCollege: '', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' }
  ]);

  useEffect(() => {
    if (editingEvent) {
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
      setCapacity(editingEvent.capacity);
      setCertificatesProvided(editingEvent.certificatesProvided);
      setCoverImage(editingEvent.coverImage);
      setAgenda(editingEvent.agenda || []);
      setSpeakers(editingEvent.speakers || []);
      setRescheduleReason('');
    } else {
      // Defaults for new event
      setTitle('');
      setTagline('');
      setDescription('');
      // Preselect current user's club if available
      const defaultClub = currentUser?.clubId 
        ? clubs.find(c => c.id === currentUser.clubId) || clubs[0]
        : clubs[0];
      setClubId(defaultClub?.id || '');
      setCategory('Workshop');
      
      const tomorrow = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
      setStartDate(tomorrow);
      setEndDate(tomorrow);
      setStartTime('10:00');
      setEndTime('16:00');
      
      if (venues[0]) {
        setVenue(venues[0].name);
        setVenueId(venues[0].id);
        setCapacity(venues[0].capacity);
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
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  required
                >
                  {clubs.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-800 mb-1">Book Campus Venue *</label>
                <select
                  value={venueId}
                  onChange={e => handleVenueChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  {venues.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.building}) - Cap: {v.capacity}
                    </option>
                  ))}
                  <option value="custom">Custom / Outdoor / Virtual Link</option>
                </select>
                {venueId === 'custom' && (
                  <input
                    type="text"
                    value={venue}
                    onChange={e => setVenue(e.target.value)}
                    placeholder="Enter custom venue name or Zoom link"
                    className="w-full mt-2 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                  />
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Capacity / Seats *</label>
                <input
                  type="number"
                  min={10}
                  max={2000}
                  value={capacity}
                  onChange={e => setCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  required
                />
              </div>
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
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
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
