import React, { useState } from 'react';
import { X, Users, Building, ShieldCheck, Sparkles } from 'lucide-react';
import { Club } from '../types.js';

interface ClubRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterClub: (clubData: Partial<Club>) => Promise<void>;
}

export const ClubRegisterModal: React.FC<ClubRegisterModalProps> = ({
  isOpen,
  onClose,
  onRegisterClub
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Club['category']>('Technical');
  const [description, setDescription] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [facultyAdvisor, setFacultyAdvisor] = useState('');
  const [logo, setLogo] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onRegisterClub({
        name,
        category,
        description,
        leadName,
        leadEmail,
        facultyAdvisor: facultyAdvisor || 'Pending Faculty Endorsement',
        logo: logo || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
        bannerImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&auto=format&fit=crop&q=80',
        memberCount: 25,
        eventsHosted: 0,
        foundedYear: new Date().getFullYear(),
        isVerified: true
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Campus Affiliation</span>
              <h2 className="font-heading font-bold text-lg text-white">Register a College Club</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-800 mb-1">Club / Society Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Google Developer Student Club or Debate Society"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Technical">Technical</option>
                <option value="Cultural">Cultural</option>
                <option value="Academic">Academic</option>
                <option value="Literary">Literary</option>
                <option value="Sports">Sports</option>
                <option value="Social">Social</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Faculty Advisor / Mentor</label>
              <input
                type="text"
                value={facultyAdvisor}
                onChange={e => setFacultyAdvisor(e.target.value)}
                placeholder="Dr. / Prof. Name (Dept)"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Club President / Lead Name *</label>
              <input
                type="text"
                value={leadName}
                onChange={e => setLeadName(e.target.value)}
                placeholder="Student Convener"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Official Club Email *</label>
              <input
                type="email"
                value={leadEmail}
                onChange={e => setLeadEmail(e.target.value)}
                placeholder="club@campus.edu"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Description & Purpose</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the club vision, regular workshops, and activities..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loading ? 'Registering Club...' : 'Register College Club'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
