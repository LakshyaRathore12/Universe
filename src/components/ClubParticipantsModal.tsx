import React, { useState } from 'react';
import { 
  X, 
  Users, 
  UserPlus, 
  Check, 
  Trash2, 
  Crown, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  GraduationCap, 
  Building,
  Sparkles,
  ArrowRight,
  BookOpen,
  Edit3,
  Eye,
  Phone,
  Award,
  Mail
} from 'lucide-react';
import { Club, ClubMember, User } from '../types.js';
import { isMasterUser, isUserAssignedLeaderForClub } from '../lib/permissions.js';

interface ClubParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: Club;
  currentUser: User | null;
  onUpdateClub: (updatedClub: Club) => void;
  onRefreshClubs?: () => void;
}

export const ClubParticipantsModal: React.FC<ClubParticipantsModalProps> = ({
  isOpen,
  onClose,
  club,
  currentUser,
  onUpdateClub,
  onRefreshClubs
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'pending' | 'add'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMsg, setActionMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  // Form for adding/requesting member
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberStudentId, setNewMemberStudentId] = useState('');
  const [newMemberDept, setNewMemberDept] = useState('Computer Science & Engineering');
  const [newMemberYear, setNewMemberYear] = useState('2nd Year');

  // Edit Member Modal State
  const [editingMember, setEditingMember] = useState<ClubMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editStudentId, setEditStudentId] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'leader' | 'co_leader' | 'member'>('member');
  const [editRoleTitle, setEditRoleTitle] = useState('');

  // Optima Profile Modal State (Individual Person Detailed Profile & Statistics)
  const [optimaMember, setOptimaMember] = useState<ClubMember | null>(null);

  if (!isOpen) return null;

  const isMaster = isMasterUser(currentUser);
  const isDean = currentUser?.role === 'admin' || isMaster;
  const isFaculty = isMaster || isDean || currentUser?.role === 'faculty' || currentUser?.role === 'master_admin';
  // Club leader has permissions ONLY for the club where faculty assigned their email as President or Vice President
  const isClubLeader = isMaster || isUserAssignedLeaderForClub(currentUser, club);

  const members: ClubMember[] = club.members || [];
  const activeMembers = members.filter(m => m.status === 'active');
  const pendingRequests = members.filter(m => m.status === 'pending');

  const filteredActive = activeMembers.filter(m => 
    m.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.studentId && m.studentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (m.department && m.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const showNotification = (text: string, success: boolean = true) => {
    setActionMsg({ text, success });
    setTimeout(() => setActionMsg(null), 4000);
  };

  // 1. Accept Pending Join Request (Faculty ONLY)
  const handleAcceptRequest = async (member: ClubMember) => {
    if (!isFaculty) {
      showNotification('Access Denied: Under MITS regulations, only Faculty Coordinators can accept club join requests.', false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${club.id}/members/${member.id}/accept`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || '',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify({
          facultyName: currentUser?.name || 'MITS Faculty Coordinator',
          facultyEmail: currentUser?.email || 'faculty@mitsgwalior.in'
        })
      });
      const data = await res.json();
      if (data.success && data.club) {
        onUpdateClub(data.club);
        showNotification(`✓ Accepted ${member.userName} into ${club.name}. Joined timestamp recorded.`);
      } else {
        // Fallback local update
        const now = new Date().toISOString();
        const updatedMembers: ClubMember[] = members.map(m => m.id === member.id ? {
          ...m,
          status: 'active',
          joinedAt: now,
          approvedBy: currentUser?.name || 'MITS Faculty Coordinator',
          approvedAt: now
        } : m);
        const updatedClub = { ...club, members: updatedMembers, memberCount: updatedMembers.filter(m => m.status === 'active').length };
        onUpdateClub(updatedClub);
        showNotification(`✓ Accepted ${member.userName} into ${club.name}. Joined timestamp recorded.`);
      }
      if (onRefreshClubs) onRefreshClubs();
    } catch {
      showNotification('Error accepting request.', false);
    } finally {
      setLoading(false);
    }
  };

  // 2. Reject / Remove Request
  const handleDeclineRequest = async (memberId: string) => {
    if (!isFaculty && !isClubLeader) {
      showNotification('Access Denied: Only Faculty or Club Leaders can decline requests.', false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${club.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || '',
          'x-user-email': currentUser?.email || ''
        }
      });
      const data = await res.json();
      if (data.success && data.club) {
        onUpdateClub(data.club);
      } else {
        const updatedMembers = members.filter(m => m.id !== memberId);
        onUpdateClub({ ...club, members: updatedMembers });
      }
      showNotification('Request declined and removed.');
      if (onRefreshClubs) onRefreshClubs();
    } catch {
      showNotification('Error removing request.', false);
    } finally {
      setLoading(false);
    }
  };

  // 3. Make Club Leader / Change Role (Faculty ONLY: appoint President or Vice President)
  const handleChangeMemberRole = async (member: ClubMember, newRole: 'leader' | 'co_leader' | 'member', customTitle?: string) => {
    if (!isFaculty) {
      showNotification('Access Denied: Only MITS Faculty can appoint or promote Club Leaders.', false);
      return;
    }

    setLoading(true);
    const resolvedTitle = customTitle || (newRole === 'leader' ? 'Club President' : newRole === 'co_leader' ? 'Vice President' : 'Core Member');
    try {
      const res = await fetch(`/api/clubs/${club.id}/members/${member.id}/role`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || '',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify({
          role: newRole,
          roleTitle: resolvedTitle,
          facultyName: currentUser?.name
        })
      });
      const data = await res.json();
      if (data.success && data.club) {
        onUpdateClub(data.club);
        showNotification(`✓ ${member.userName} is now designated as ${resolvedTitle} for ${club.name}!`);
      } else {
        const updatedMembers: ClubMember[] = members.map(m => m.id === member.id ? { ...m, role: newRole, roleTitle: resolvedTitle } : m);
        const updatedClub = { ...club, members: updatedMembers };
        onUpdateClub(updatedClub);
        showNotification(`✓ ${member.userName} is now designated as ${resolvedTitle}!`);
      }
      if (onRefreshClubs) onRefreshClubs();
    } catch {
      showNotification('Error updating member role.', false);
    } finally {
      setLoading(false);
    }
  };

  // 4. Remove Member (Faculty of their own club)
  const handleRemoveMember = async (member: ClubMember) => {
    if (!isFaculty) {
      showNotification('Access Denied: Under MITS regulations, only Faculty can remove club participants.', false);
      return;
    }

    if (!confirm(`Are you sure you want to remove ${member.userName} (${member.studentId || member.userEmail}) from ${club.name}?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${club.id}/members/${member.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || '',
          'x-user-email': currentUser?.email || ''
        }
      });
      const data = await res.json();
      if (data.success && data.club) {
        onUpdateClub(data.club);
      } else {
        const updatedMembers = members.filter(m => m.id !== member.id);
        const updatedClub = {
          ...club,
          members: updatedMembers,
          memberCount: Math.max(0, updatedMembers.filter(m => m.status === 'active').length)
        };
        onUpdateClub(updatedClub);
      }
      showNotification(`✓ Removed ${member.userName} from ${club.name}.`);
      if (onRefreshClubs) onRefreshClubs();
    } catch {
      showNotification('Error removing member.', false);
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Participant Modal (Faculty ONLY)
  const openEditModal = (member: ClubMember) => {
    setEditingMember(member);
    setEditName(member.userName);
    setEditStudentId(member.studentId || '');
    setEditDept(member.department || 'Computer Science & Engineering');
    setEditYear(member.year || '2nd Year');
    setEditPhone(member.phone || '+91 98000 00000');
    setEditRole(member.role);
    setEditRoleTitle(member.roleTitle || '');
  };

  // Save Participant Edits (Faculty ONLY)
  const handleSaveMemberEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!isFaculty) {
      showNotification('Access Denied: Only MITS Faculty can edit participant details.', false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${club.id}/members/${editingMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.id || '',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify({
          userName: editName.trim(),
          studentId: editStudentId.trim(),
          department: editDept.trim(),
          year: editYear.trim(),
          phone: editPhone.trim(),
          role: editRole,
          roleTitle: editRoleTitle.trim() || (editRole === 'leader' ? 'Club President & Lead' : editRole === 'co_leader' ? 'Co-Leader' : 'Core Member')
        })
      });
      const data = await res.json();
      if (data.success && data.club) {
        onUpdateClub(data.club);
      } else {
        const updatedMembers = members.map(m => m.id === editingMember.id ? {
          ...m,
          userName: editName.trim(),
          studentId: editStudentId.trim(),
          department: editDept.trim(),
          year: editYear.trim(),
          phone: editPhone.trim(),
          role: editRole,
          roleTitle: editRoleTitle.trim() || (editRole === 'leader' ? 'Club President & Lead' : editRole === 'co_leader' ? 'Co-Leader' : 'Core Member')
        } : m);
        onUpdateClub({ ...club, members: updatedMembers });
      }
      showNotification(`✓ Updated details for ${editName.trim()}.`);
      setEditingMember(null);
      if (onRefreshClubs) onRefreshClubs();
    } catch {
      showNotification('Error saving participant changes.', false);
    } finally {
      setLoading(false);
    }
  };

  // 5. Submit Join Request / Add Person
  const handleSubmitJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newMemberEmail.trim().toLowerCase();
    if (!cleanEmail.endsWith('@mitsgwl.ac.in') && !cleanEmail.endsWith('@mitsgwalior.in')) {
      showNotification('Invalid domain: Must use official MITS email ending with @mitsgwl.ac.in (students) or @mitsgwalior.in (faculty/advisors)', false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${club.id}/join-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: newMemberName.trim(),
          userEmail: cleanEmail,
          studentId: newMemberStudentId.trim() || '0901CS231000',
          department: newMemberDept,
          year: newMemberYear,
          requestedBy: currentUser?.name || newMemberName
        })
      });
      const data = await res.json();
      if (data.success && data.club) {
        onUpdateClub(data.club);
      } else {
        const newReq: ClubMember = {
          id: `mem-${Date.now()}`,
          clubId: club.id,
          userId: `usr-${Date.now()}`,
          userName: newMemberName.trim(),
          userEmail: cleanEmail,
          studentId: newMemberStudentId.trim() || '0901CS231000',
          department: newMemberDept,
          year: newMemberYear,
          role: 'member',
          roleTitle: 'Core Member',
          status: 'pending', // Awaits faculty approval
          requestedAt: new Date().toISOString()
        };
        const updatedClub = { ...club, members: [...members, newReq] };
        onUpdateClub(updatedClub);
      }

      showNotification('✓ Request submitted! As per MITS rules, only Faculty can accept join requests.');
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberStudentId('');
      setActiveTab('pending');
      if (onRefreshClubs) onRefreshClubs();
    } catch {
      showNotification('Failed to submit request.', false);
    } finally {
      setLoading(false);
    }
  };

  // Student 1-click self request
  const handleStudentSelfJoin = async () => {
    if (!currentUser) return;
    if (members.some(m => m.userEmail.toLowerCase() === currentUser.email.toLowerCase())) {
      showNotification('You have already requested or are an active member of this club.');
      return;
    }

    setLoading(true);
    try {
      const newReq: ClubMember = {
        id: `mem-${Date.now()}`,
        clubId: club.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        studentId: currentUser.studentId || '0901CS221089',
        department: currentUser.department || 'Computer Science & Engineering',
        year: currentUser.year || '3rd Year',
        role: 'member',
        roleTitle: 'Active Member',
        status: 'pending', // ONLY faculty can accept!
        requestedAt: new Date().toISOString()
      };
      const updatedMembers = [...members, newReq];
      const updatedClub = { ...club, members: updatedMembers };
      onUpdateClub(updatedClub);

      await fetch(`/api/clubs/${club.id}/join-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: currentUser.name,
          userEmail: currentUser.email,
          studentId: currentUser.studentId,
          department: currentUser.department,
          year: currentUser.year
        })
      });

      showNotification('✓ Join request submitted! Pending approval by MITS Faculty Coordinator.');
      setActiveTab('pending');
    } catch {
      showNotification('Join request logged.');
    } finally {
      setLoading(false);
    }
  };

  const formatJoinedTime = (isoString?: string) => {
    if (!isoString) return 'Pending approval';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative shrink-0 border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <img 
              src={club.logo} 
              alt={club.name}
              className="w-12 h-12 rounded-2xl object-cover bg-white p-0.5 border border-white/20 shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {club.category} Society
                </span>
                <span className="text-xs text-slate-300 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Faculty Advisor: <strong className="text-white">{club.facultyAdvisor}</strong></span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                {club.name} • Participants & Membership
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Faculty authority: edit or remove participants of your own club, promote members to Club Leaders to organize events and workshops. All new participants require Faculty acceptance.
          </p>

          {/* Tab Bar */}
          <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'members'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Active Members ({activeMembers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative ${
                activeTab === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Join Requests ({pendingRequests.length})</span>
              {pendingRequests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold ml-1">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('add')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'add'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add / Request Participant</span>
            </button>

            {currentUser?.role === 'student' && !members.some(m => m.userEmail.toLowerCase() === currentUser.email.toLowerCase()) && (
              <button
                onClick={handleStudentSelfJoin}
                disabled={loading}
                className="ml-auto px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Request to Join This Club</span>
              </button>
            )}
          </div>
        </div>

        {/* Action / Notification Banner */}
        {actionMsg && (
          <div className={`p-3 text-xs font-medium flex items-center gap-2 ${
            actionMsg.success 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-b border-emerald-200 dark:border-emerald-900/60'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-b border-rose-200 dark:border-rose-900/60'
          }`}>
            {actionMsg.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{actionMsg.text}</span>
          </div>
        )}

        {/* Tab 1: Active Members */}
        {activeTab === 'members' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter by name, enrollment no, dept..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {isFaculty && (
                <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/50 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Faculty Privileges: Promote to Leader or Remove Members</span>
                </div>
              )}
            </div>

            {filteredActive.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
                No active members found. Accept pending requests or add participants.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                {filteredActive.map((member) => (
                  <div key={member.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setOptimaMember(member)}
                          className="font-bold text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                          title="Click to inspect Individual Participant Optima & Academic Dossier"
                        >
                          <span>{member.userName}</span>
                          <Eye className="w-3.5 h-3.5 text-indigo-500 opacity-60 hover:opacity-100" />
                        </button>

                        {member.role === 'leader' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold flex items-center gap-1">
                            <Crown className="w-3 h-3 text-emerald-600" />
                            <span>Club Leader (Can Organise Events)</span>
                          </span>
                        ) : member.role === 'co_leader' ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-indigo-600" />
                            <span>Co-Leader</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium">
                            Member
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px]">
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{member.userEmail}</span>
                        <span>•</span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{member.studentId || '0901CS...'}</span>
                        <span>•</span>
                        <span>{member.department || 'Engineering'}</span>
                        <span>•</span>
                        <span>{member.year || 'Year'}</span>
                      </div>

                      {/* Explicit Joined Time Display */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Joined: <strong className="text-slate-700 dark:text-slate-200">{formatJoinedTime(member.joinedAt)}</strong></span>
                        {member.approvedBy && (
                          <span className="text-slate-400">• Verified by {member.approvedBy}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions: View Optima + Faculty Controls */}
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                      <button
                        onClick={() => setOptimaMember(member)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title="View Individual Participant Optima & Dossier"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Optima Profile</span>
                      </button>

                      {isFaculty && (
                        <>
                          <button
                            onClick={() => openEditModal(member)}
                            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Faculty edit participant info"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Edit</span>
                          </button>

                          {member.role !== 'leader' ? (
                            <button
                              onClick={() => handleChangeMemberRole(member, 'leader', 'Club President')}
                              disabled={loading}
                              className="px-2 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Assign student email as President to organize events"
                            >
                              <Crown className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Make President</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleChangeMemberRole(member, 'member', 'Core Member')}
                              disabled={loading}
                              className="px-2 py-1.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              <span>Demote to Member</span>
                            </button>
                          )}

                          {member.role !== 'co_leader' && member.role !== 'leader' && (
                            <button
                              onClick={() => handleChangeMemberRole(member, 'co_leader', 'Vice President')}
                              disabled={loading}
                              className="px-2 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Assign student email as Vice President to organize events"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Make VP</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleRemoveMember(member)}
                            disabled={loading}
                            className="p-1.5 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Faculty remove participant from club"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pending Join Requests (Only Faculty Can Accept) */}
        {activeTab === 'pending' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Faculty Acceptance Required:</strong>
                Under MITS institutional bylaws, whenever students apply or are nominated to join a club, only Faculty Coordinators hold authority to approve admission and record official joining time.
              </div>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
                No pending requests. All submitted participant requests have been processed.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {req.userName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 text-[10px] font-bold">
                          Pending Faculty Acceptance
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px]">
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{req.userEmail}</span>
                        <span>•</span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{req.studentId || '0901...'}</span>
                        <span>•</span>
                        <span>{req.department}</span>
                        <span>•</span>
                        <span>{req.year}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Requested at: <strong className="text-slate-600 dark:text-slate-300">{formatJoinedTime(req.requestedAt)}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      {isFaculty ? (
                        <>
                          <button
                            onClick={() => handleAcceptRequest(req)}
                            disabled={loading}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Accept Request</span>
                          </button>

                          <button
                            onClick={() => handleDeclineRequest(req.id)}
                            disabled={loading}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            <span>Decline</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold italic">
                          Awaiting Faculty Review
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Add / Nominate Member Form */}
        {activeTab === 'add' && (
          <form onSubmit={handleSubmitJoinRequest} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Nominate or request a new MITS participant to join <strong className="text-slate-900 dark:text-white">{club.name}</strong>. Under institute policy, submissions will be routed to the Faculty Coordinator for review and acceptance.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Student Full Name</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  placeholder="e.g. Karthik Iyer"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">MITS Email (@mitsgwl.ac.in / @mitsgwalior.in)</label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={e => setNewMemberEmail(e.target.value)}
                  placeholder="0901cs231055@mitsgwl.ac.in"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">MITS Enrollment Number</label>
                <input
                  type="text"
                  value={newMemberStudentId}
                  onChange={e => setNewMemberStudentId(e.target.value)}
                  placeholder="0901CS231055"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <select
                  value={newMemberDept}
                  onChange={e => setNewMemberDept(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option>Computer Science & Engineering</option>
                  <option>Information Technology</option>
                  <option>Electronics & Communication</option>
                  <option>Electrical Engineering</option>
                  <option>Mechanical Engineering</option>
                  <option>Civil Engineering</option>
                  <option>Artificial Intelligence & Data Science</option>
                  <option>Architecture & Planning</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Academic Year</label>
                <select
                  value={newMemberYear}
                  onChange={e => setNewMemberYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                  <option>Postgraduate</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Submit Request for Faculty Approval</span>
              </button>
            </div>
          </form>
        )}

      </div>

      {/* Edit Member Modal (Faculty ONLY) */}
      {editingMember && isFaculty && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Faculty Edit Participant: {editingMember.userName}
                </h3>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMemberEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Enrollment No.</label>
                  <input
                    type="text"
                    value={editStudentId}
                    onChange={e => setEditStudentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={editDept}
                    onChange={e => setEditDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Academic Year</label>
                  <select
                    value={editYear}
                    onChange={e => setEditYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Leadership Role</label>
                <select
                  value={editRole}
                  onChange={e => {
                    const r = e.target.value as 'leader' | 'co_leader' | 'member';
                    setEditRole(r);
                    if (r === 'leader') setEditRoleTitle('Club President');
                    else if (r === 'co_leader') setEditRoleTitle('Vice President');
                    else setEditRoleTitle('Core Member');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="leader">Club Leader (President) - Can organise events</option>
                  <option value="co_leader">Co-Leader (Vice President) - Can organise events</option>
                  <option value="member">Core Member</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Position / Designation Title</label>
                <input
                  type="text"
                  value={editRoleTitle}
                  onChange={e => setEditRoleTitle(e.target.value)}
                  placeholder="e.g. Club President, Vice President, Tech Head"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Member Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Optima Profile Modal (Individual Person Dossier & Metrics) */}
      {optimaMember && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden space-y-4">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  {optimaMember.userName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{optimaMember.userName}</h3>
                  <span className="text-[11px] text-slate-300 font-mono">{optimaMember.userEmail}</span>
                </div>
              </div>
              <button
                onClick={() => setOptimaMember(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 tracking-wider">
                    Assigned Leadership Clearance
                  </span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                    {optimaMember.roleTitle || (optimaMember.role === 'leader' ? 'Club President' : optimaMember.role === 'co_leader' ? 'Vice President' : 'Core Member')}
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  {optimaMember.status === 'active' ? 'Active Member' : 'Pending Review'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-400 font-medium block">Enrollment No.</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{optimaMember.studentId || '0901CS...'}</span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="text-[10px] text-slate-400 font-medium block">Department & Year</span>
                  <span className="font-bold text-slate-900 dark:text-white">{optimaMember.department} ({optimaMember.year})</span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 col-span-2">
                  <span className="text-[10px] text-slate-400 font-medium block">Official Joined Time & Verification</span>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{formatJoinedTime(optimaMember.joinedAt)}</span>
                  </div>
                  {optimaMember.approvedBy && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-1 font-medium">
                      ✓ Approved & recorded by: {optimaMember.approvedBy}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Optima Performance & Activity Score
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Workshop & Symposium Attendance</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">96% Optima</strong>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Event Organizing Clearance</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {optimaMember.role === 'leader' || optimaMember.role === 'co_leader' ? 'Authorized (President/VP)' : 'Participant'}
                  </strong>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setOptimaMember(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
                >
                  Close Optima Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
