import React, { useState } from 'react';
import { X, Users, Building, ShieldCheck, Sparkles, Plus, Trash2, UserPlus, Phone, Mail, Hash, Calendar, GraduationCap } from 'lucide-react';
import { Club, ClubAdminInfo } from '../types.js';

interface ClubRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterClub: (clubData: Partial<Club>) => Promise<void>;
}

interface NewAdminForm {
  name: string;
  email: string;
  enrollmentNo: string;
  phone: string;
  year: string;
  department: string;
  roleTitle: string;
}

const DEFAULT_ADMIN: NewAdminForm = {
  name: '',
  email: '',
  enrollmentNo: '',
  phone: '',
  year: '3rd Year',
  department: 'Computer Science & Engineering',
  roleTitle: 'President & Lead Admin'
};

export const ClubRegisterModal: React.FC<ClubRegisterModalProps> = ({
  isOpen,
  onClose,
  onRegisterClub
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Club['category']>('Technical');
  const [description, setDescription] = useState('');
  const [facultyAdvisor, setFacultyAdvisor] = useState('');
  const [logo, setLogo] = useState('');

  // Designated Admins State
  const [admins, setAdmins] = useState<NewAdminForm[]>([{ ...DEFAULT_ADMIN }]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAdminChange = (index: number, field: keyof NewAdminForm, value: string) => {
    setAdmins(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddAdmin = () => {
    setAdmins(prev => [
      ...prev,
      {
        name: '',
        email: '',
        enrollmentNo: '',
        phone: '',
        year: '2nd Year',
        department: 'Computer Science & Engineering',
        roleTitle: 'Co-Admin & Coordinator'
      }
    ]);
  };

  const handleRemoveAdmin = (index: number) => {
    if (admins.length <= 1) {
      setErrorMessage('A club must have at least one designated administrator.');
      return;
    }
    setAdmins(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    if (!name.trim()) {
      setErrorMessage('Club name is required.');
      return;
    }

    for (let i = 0; i < admins.length; i++) {
      const a = admins[i];
      if (!a.name.trim() || !a.email.trim() || !a.enrollmentNo.trim() || !a.phone.trim() || !a.year.trim()) {
        setErrorMessage(`Please fill all required details (Name, Email, Enrollment No., Phone No., and Year) for Admin #${i + 1}.`);
        return;
      }
    }

    setLoading(true);
    try {
      const primaryAdmin = admins[0];
      const formattedAdmins: ClubAdminInfo[] = admins.map((a, idx) => ({
        id: `adm-${Date.now()}-${idx}`,
        name: a.name.trim(),
        email: a.email.trim().toLowerCase(),
        enrollmentNo: a.enrollmentNo.trim(),
        phone: a.phone.trim(),
        year: a.year,
        department: a.department.trim(),
        roleTitle: a.roleTitle.trim() || (idx === 0 ? 'Lead Organizer' : 'Co-Admin'),
        addedAt: new Date().toISOString()
      }));

      await onRegisterClub({
        name: name.trim(),
        category,
        description: description.trim() || 'Active university student society dedicated to campus excellence.',
        leadName: primaryAdmin.name.trim(),
        leadEmail: primaryAdmin.email.trim().toLowerCase(),
        leadPhone: primaryAdmin.phone.trim(),
        leadEnrollmentNo: primaryAdmin.enrollmentNo.trim(),
        leadYear: primaryAdmin.year,
        admins: formattedAdmins,
        facultyAdvisor: facultyAdvisor.trim() || 'Pending Faculty Endorsement',
        logo: logo || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
        bannerImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&auto=format&fit=crop&q=80',
        memberCount: 25,
        eventsHosted: 0,
        foundedYear: new Date().getFullYear(),
        isVerified: true
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to register club. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 p-5 sm:p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Campus Affiliation</span>
              <h2 className="font-heading font-bold text-lg text-white">Register a College Club & Assign Admins</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <span className="font-semibold">Error:</span> {errorMessage}
            </div>
          )}

          {/* Section 1: Club Basic Details */}
          <div className="space-y-3">
            <h3 className="font-heading font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>Club General Information</span>
            </h3>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Club / Society Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Google Developer Student Club or Debate & Literary Society"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
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
                  placeholder="e.g. Dr. Meera Nambiar (CSE Dept)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Description & Purpose</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the club vision, workshops, competitions, and campus activities..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                required
              />
            </div>
          </div>

          {/* Section 2: Designated Club Administrators */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Designated Club Administrators ({admins.length})</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Admins manage events, check in candidates, and can edit or appoint other admins.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddAdmin}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold text-[11px] flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Admin</span>
              </button>
            </div>

            <div className="space-y-3">
              {admins.map((adm, index) => (
                <div 
                  key={index}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 relative transition-all hover:border-slate-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                        {index + 1}
                      </span>
                      <span>{index === 0 ? 'Primary Club Administrator' : `Co-Administrator #${index + 1}`}</span>
                    </span>

                    {admins.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAdmin(index)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                        title="Remove admin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={adm.name}
                        onChange={e => handleAdminChange(index, 'name', e.target.value)}
                        placeholder="e.g. Devansh Verma"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>University Email *</span>
                      </label>
                      <input
                        type="email"
                        value={adm.email}
                        onChange={e => handleAdminChange(index, 'email', e.target.value)}
                        placeholder="admin@campus.edu"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Hash className="w-3 h-3 text-slate-400" />
                        <span>Enrollment No. *</span>
                      </label>
                      <input
                        type="text"
                        value={adm.enrollmentNo}
                        onChange={e => handleAdminChange(index, 'enrollmentNo', e.target.value)}
                        placeholder="e.g. UNI-2023-CS042"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono uppercase"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>Phone Number *</span>
                      </label>
                      <input
                        type="tel"
                        value={adm.phone}
                        onChange={e => handleAdminChange(index, 'phone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-slate-400" />
                        <span>Academic Year *</span>
                      </label>
                      <select
                        value={adm.year}
                        onChange={e => handleAdminChange(index, 'year', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                        required
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="Postgraduate">Postgraduate</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={adm.department}
                        onChange={e => handleAdminChange(index, 'department', e.target.value)}
                        placeholder="e.g. Computer Science & Engineering"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Role / Designation
                      </label>
                      <input
                        type="text"
                        value={adm.roleTitle}
                        onChange={e => handleAdminChange(index, 'roleTitle', e.target.value)}
                        placeholder={index === 0 ? "President / Convener" : "Co-Lead / Tech Head"}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
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
              <span>{loading ? 'Registering Club...' : 'Register Club with Admins'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
