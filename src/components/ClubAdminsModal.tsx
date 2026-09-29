import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Save, 
  Phone, 
  Mail, 
  Hash, 
  GraduationCap, 
  Check, 
  Copy, 
  AlertCircle,
  Sparkles,
  Plus,
  Lock
} from 'lucide-react';
import { Club, ClubAdminInfo, User } from '../types.js';
import { canUserModifyClub, isMasterUser } from '../lib/permissions.js';

interface ClubAdminsModalProps {
  club: Club | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUpdateClubAdmins?: (clubId: string, updatedAdmins: ClubAdminInfo[]) => Promise<void>;
  onUpdateAdmins?: (clubId: string, updatedAdmins: ClubAdminInfo[]) => Promise<void>;
}

export const ClubAdminsModal: React.FC<ClubAdminsModalProps> = ({
  club,
  isOpen,
  onClose,
  currentUser,
  onUpdateClubAdmins,
  onUpdateAdmins
}) => {
  if (!isOpen || !club) return null;

  const updateFn = onUpdateClubAdmins || onUpdateAdmins;

  const canModifyThisClub = canUserModifyClub(currentUser, club);

  // Local state initialized with club's admins
  const [adminsList, setAdminsList] = useState<ClubAdminInfo[]>(
    club.admins && club.admins.length > 0
      ? [...club.admins]
      : [
          {
            id: `adm-${Date.now()}-0`,
            name: club.leadName || 'Lead Admin',
            email: club.leadEmail || 'club@mitsgwl.ac.in',
            enrollmentNo: club.leadEnrollmentNo || '0901CS221001',
            phone: club.leadPhone || '+91 98000 00000',
            year: club.leadYear || '3rd Year',
            department: 'Computer Science & Engineering',
            roleTitle: 'President & Convener',
            addedAt: new Date().toISOString()
          }
        ]
  );

  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ClubAdminInfo>>({});
  const [isAddingNew, setIsAddingNew] = useState(false);

  const [newAdminForm, setNewAdminForm] = useState({
    name: '',
    email: '',
    enrollmentNo: '',
    phone: '',
    year: '3rd Year',
    department: 'Computer Science & Engineering',
    roleTitle: 'President & Convener'
  });

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const startEdit = (admin: ClubAdminInfo) => {
    if (!canModifyThisClub) {
      setErrorMsg('Access Denied: You cannot modify administrators for this club.');
      return;
    }
    setEditingAdminId(admin.id);
    setEditFormData({ ...admin });
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const cancelEdit = () => {
    setEditingAdminId(null);
    setEditFormData({});
  };

  const saveEdit = async () => {
    if (!editingAdminId) return;
    if (!canModifyThisClub) {
      setErrorMsg('Access Denied: You cannot modify administrators for this club.');
      return;
    }

    if (!editFormData.name?.trim() || !editFormData.email?.trim() || !editFormData.enrollmentNo?.trim() || !editFormData.phone?.trim() || !editFormData.year?.trim()) {
      setErrorMsg('Please fill all required fields (Name, Email, Enrollment No, Phone, and Year).');
      return;
    }

    const updated = adminsList.map(adm => {
      if (adm.id === editingAdminId) {
        return {
          ...adm,
          ...editFormData,
          name: editFormData.name!.trim(),
          email: editFormData.email!.trim().toLowerCase(),
          enrollmentNo: editFormData.enrollmentNo!.trim(),
          phone: editFormData.phone!.trim(),
          year: editFormData.year!,
          department: (editFormData.department || 'Academic Department').trim(),
          roleTitle: (editFormData.roleTitle || 'Club Admin').trim(),
          addedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : adm.addedBy
        } as ClubAdminInfo;
      }
      return adm;
    });

    setSaving(true);
    setErrorMsg(null);
    try {
      if (updateFn) {
        await updateFn(club.id, updated);
      }
      setAdminsList(updated);
      setEditingAdminId(null);
      setSuccessMsg('Admin details updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update admin details.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModifyThisClub) {
      setErrorMsg('Access Denied: You cannot appoint administrators for this club.');
      return;
    }

    if (!newAdminForm.name.trim() || !newAdminForm.email.trim() || !newAdminForm.enrollmentNo.trim() || !newAdminForm.phone.trim() || !newAdminForm.year.trim()) {
      setErrorMsg('All admin fields (Name, Email, Enrollment No, Phone, and Academic Year) are required.');
      return;
    }

    const newAdminObj: ClubAdminInfo = {
      id: `adm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newAdminForm.name.trim(),
      email: newAdminForm.email.trim().toLowerCase(),
      enrollmentNo: newAdminForm.enrollmentNo.trim(),
      phone: newAdminForm.phone.trim(),
      year: newAdminForm.year,
      department: newAdminForm.department.trim(),
      roleTitle: newAdminForm.roleTitle.trim() || 'Co-Admin',
      addedAt: new Date().toISOString(),
      addedBy: currentUser?.name || 'Current Admin'
    };

    const updated = [...adminsList, newAdminObj];

    setSaving(true);
    setErrorMsg(null);
    try {
      if (updateFn) {
        await updateFn(club.id, updated);
      }
      setAdminsList(updated);
      setIsAddingNew(false);
      setNewAdminForm({
        name: '',
        email: '',
        enrollmentNo: '',
        phone: '',
        year: '3rd Year',
        department: 'Computer Science & Engineering',
        roleTitle: 'President & Convener'
      });
      setSuccessMsg(`${newAdminObj.name} appointed as Club Administrator!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add new club admin.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string, adminName: string) => {
    if (!canModifyThisClub) {
      setErrorMsg('Access Denied: You cannot remove administrators from this club.');
      return;
    }

    if (adminsList.length <= 1) {
      setErrorMsg('Cannot remove the only administrator. Appoint another admin first.');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${adminName} from club leadership?`)) {
      return;
    }

    const updated = adminsList.filter(a => a.id !== adminId);
    setSaving(true);
    setErrorMsg(null);
    try {
      if (updateFn) {
        await updateFn(club.id, updated);
      }
      setAdminsList(updated);
      setSuccessMsg(`${adminName} removed from club admins.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove admin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 p-5 sm:p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src={club.logo} 
              alt={club.name}
              className="w-11 h-11 rounded-xl object-cover border-2 border-white/20 bg-slate-800 shrink-0" 
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Leadership Roster
                </span>
                <span className="text-[11px] text-slate-400 font-mono truncate">{club.category}</span>
              </div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-white truncate mt-0.5">
                {club.name} — Administrators
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-banner Notice */}
        <div className="bg-slate-50 px-5 sm:px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Faculty-assigned Presidents and Vice Presidents hold leadership rights exclusively for this society.
            </span>
          </div>

          {canModifyThisClub && !isAddingNew && (
            <button
              onClick={() => setIsAddingNew(true)}
              className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Appoint New Admin</span>
            </button>
          )}

          {!canModifyThisClub && (
            <div className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-600" />
              <span>Read-Only: Modification restricted to this club's assigned leaders.</span>
            </div>
          )}
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Add New Admin Drawer / Form */}
          {isAddingNew && canModifyThisClub && (
            <form onSubmit={handleAddNewAdmin} className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <span className="font-heading font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  <span>Appoint Additional Club Administrator</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={newAdminForm.name}
                    onChange={e => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                    placeholder="e.g. Tanya Mehra"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">University Email (@mitsgwl.ac.in) *</label>
                  <input
                    type="email"
                    value={newAdminForm.email}
                    onChange={e => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                    placeholder="student@mitsgwl.ac.in"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Enrollment No. *</label>
                  <input
                    type="text"
                    value={newAdminForm.enrollmentNo}
                    onChange={e => setNewAdminForm({ ...newAdminForm, enrollmentNo: e.target.value })}
                    placeholder="0901CS221045"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={newAdminForm.phone}
                    onChange={e => setNewAdminForm({ ...newAdminForm, phone: e.target.value })}
                    placeholder="+91 98112 33445"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Academic Year *</label>
                  <select
                    value={newAdminForm.year}
                    onChange={e => setNewAdminForm({ ...newAdminForm, year: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newAdminForm.department}
                    onChange={e => setNewAdminForm({ ...newAdminForm, department: e.target.value })}
                    placeholder="Computer Science & Engineering"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Position / Role Title *</label>
                  <select
                    value={newAdminForm.roleTitle}
                    onChange={e => setNewAdminForm({ ...newAdminForm, roleTitle: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                    required
                  >
                    <option value="President & Convener">President & Convener (Club Leader)</option>
                    <option value="Vice President & Tech Lead">Vice President & Tech Lead (Club Leader)</option>
                    <option value="General Secretary & Coordinator">General Secretary & Coordinator</option>
                    <option value="Technical Head">Technical Head</option>
                    <option value="Treasurer & Finance Lead">Treasurer & Finance Lead</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{saving ? 'Adding Admin...' : 'Save & Appoint Admin'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Admins List */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Current Club Administrators ({adminsList.length})
            </div>

            {adminsList.map((adm, index) => {
              const isEditing = editingAdminId === adm.id;

              if (isEditing) {
                return (
                  <div key={adm.id} className="p-4 rounded-xl border-2 border-indigo-400 bg-white shadow-md space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-xs text-indigo-900">
                        Editing Details for {adm.name}
                      </span>
                      <button onClick={cancelEdit} className="text-xs text-slate-400 hover:text-slate-600">
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={editFormData.name || ''}
                          onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">University Email *</label>
                        <input
                          type="email"
                          value={editFormData.email || ''}
                          onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Enrollment No. *</label>
                        <input
                          type="text"
                          value={editFormData.enrollmentNo || ''}
                          onChange={e => setEditFormData({ ...editFormData, enrollmentNo: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono uppercase"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          value={editFormData.phone || ''}
                          onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Academic Year *</label>
                        <select
                          value={editFormData.year || '3rd Year'}
                          onChange={e => setEditFormData({ ...editFormData, year: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Department</label>
                        <input
                          type="text"
                          value={editFormData.department || ''}
                          onChange={e => setEditFormData({ ...editFormData, department: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Role / Position *</label>
                        <select
                          value={editFormData.roleTitle || 'President & Convener'}
                          onChange={e => setEditFormData({ ...editFormData, roleTitle: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                          required
                        >
                          <option value="President & Convener">President & Convener (Club Leader)</option>
                          <option value="Vice President & Tech Lead">Vice President & Tech Lead (Club Leader)</option>
                          <option value="General Secretary & Coordinator">General Secretary & Coordinator</option>
                          <option value="Technical Head">Technical Head</option>
                          <option value="Treasurer & Finance Lead">Treasurer & Finance Lead</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={saving}
                        className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{saving ? 'Saving...' : 'Save Updates'}</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={adm.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading font-bold text-sm text-slate-900">{adm.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {adm.roleTitle || (index === 0 ? 'Lead Organizer' : 'Co-Admin')}
                      </span>
                      {index === 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                          Primary
                        </span>
                      )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                      {/* Enrollment No */}
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-slate-900 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                          {adm.enrollmentNo}
                        </span>
                        <button
                          onClick={() => handleCopy(adm.enrollmentNo, `roll-${adm.id}`)}
                          className="text-slate-400 hover:text-slate-700 p-0.5"
                          title="Copy Enrollment No"
                        >
                          {copiedField === `roll-${adm.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Phone Number */}
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <a 
                          href={`tel:${adm.phone}`}
                          className="font-mono text-emerald-700 hover:underline font-medium text-[11px]"
                        >
                          {adm.phone}
                        </a>
                        <button
                          onClick={() => handleCopy(adm.phone, `tel-${adm.id}`)}
                          className="text-slate-400 hover:text-slate-700 p-0.5"
                          title="Copy Phone"
                        >
                          {copiedField === `tel-${adm.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Email */}
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <a 
                          href={`mailto:${adm.email}`}
                          className="text-indigo-600 hover:underline text-[11px]"
                        >
                          {adm.email}
                        </a>
                      </div>

                      {/* Academic Year & Dept */}
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700">{adm.year}</span>
                        {adm.department && <span>• {adm.department}</span>}
                      </div>
                    </div>

                    {adm.addedBy && (
                      <div className="text-[10px] text-slate-400 pt-0.5">
                        Appointed by {adm.addedBy}
                      </div>
                    )}
                  </div>

                  {/* Actions for this admin (Only if user has modify permissions on this club) */}
                  {canModifyThisClub && (
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => startEdit(adm)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs flex items-center gap-1 transition-colors"
                        title="Edit admin details"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Edit Info</span>
                      </button>

                      {adminsList.length > 1 && (
                        <button
                          onClick={() => handleRemoveAdmin(adm.id, adm.name)}
                          className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                          title="Remove admin rights"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Current Session: <span className="font-semibold text-slate-700">{currentUser?.name || 'Administrator'}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white font-semibold text-xs hover:bg-slate-900 transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
