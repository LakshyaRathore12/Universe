import React, { useState, useEffect } from 'react';
import { 
  X, 
  GraduationCap, 
  Users, 
  Shield, 
  ArrowRight, 
  UserCheck, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  BadgeCheck,
  Building,
  AtSign,
  AlertCircle
} from 'lucide-react';
import { User, UserRole } from '../types.js';
import { isMasterEmail } from '../lib/permissions.js';
import { googleSignIn } from '../lib/firebase.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  availableUsers: User[];
  initialRole?: UserRole;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  availableUsers,
  initialRole = 'student',
  initialMode = 'login'
}) => {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'register');
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  
  // Registration Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [studentId, setStudentId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('3rd Year');
  const [clubName, setClubName] = useState('');
  const [clubCategory, setClubCategory] = useState<'Technical' | 'Cultural' | 'Literary' | 'Sports' | 'Social' | 'Academic'>('Technical');
  const [clubDescription, setClubDescription] = useState('');
  
  // Login Form Fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync state whenever modal opens or initial props change
  useEffect(() => {
    if (isOpen) {
      setIsSignUp(initialMode === 'register');
      setSelectedRole(initialRole);
      setErrorMsg('');
      setLoginIdentifier('');
    }
  }, [isOpen, initialRole, initialMode]);

  if (!isOpen) return null;

  // Filter available users for the selected role (excluding master accounts from demo persona list)
  const studentsList = availableUsers.filter(u => u.role === 'student' && !isMasterEmail(u.email) && (!u.studentId || !isMasterEmail(u.studentId)));
  const facultyList = availableUsers.filter(u => u.role === 'faculty');
  const clubOrganizersList = availableUsers.filter(u => u.role === 'club_organizer');
  const adminList = availableUsers.filter(u => u.role === 'admin' || u.role === 'master_admin');

  // Domain validation helpers:
  // Faculty & Dean (admin): @mitsgwalior.in
  // Students: @mitsgwl.ac.in
  // Club Organizers: @mitsgwl.ac.in or @mitsgwalior.in
  // Master Control accounts log in seamlessly as normal students
  const getExpectedDomain = (role: 'student' | 'faculty' | 'club_organizer' | 'admin') => {
    if (role === 'faculty' || role === 'admin') return '@mitsgwalior.in';
    return '@mitsgwl.ac.in';
  };

  const isEmailValidForRole = (val: string, role: 'student' | 'faculty' | 'club_organizer' | 'admin') => {
    const trimmed = val.trim().toLowerCase();
    if (isMasterEmail(trimmed)) return true;
    if (role === 'faculty' || role === 'admin') {
      return trimmed.endsWith('@mitsgwalior.in');
    }
    if (role === 'student') {
      return trimmed.endsWith('@mitsgwl.ac.in') || trimmed.endsWith('@mits.gwl.ac.in');
    }
    // club_organizer can be either student or faculty lead
    return trimmed.endsWith('@mitsgwl.ac.in') || trimmed.endsWith('@mits.gwl.ac.in') || trimmed.endsWith('@mitsgwalior.in');
  };

  const handleAppendDomain = (field: 'login' | 'register') => {
    const domain = getExpectedDomain(selectedRole);
    if (field === 'login') {
      const clean = loginIdentifier.replace(/@.*$/, '').trim();
      if (clean) setLoginIdentifier(`${clean}${domain}`);
    } else {
      const clean = email.replace(/@.*$/, '').trim();
      if (clean) setEmail(`${clean}${domain}`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = loginIdentifier.trim();
    if (!query) {
      setErrorMsg(
        selectedRole === 'student'
          ? 'Please enter your MITS student email (@mitsgwl.ac.in) or Enrollment Number (e.g. 0901CS221089)'
          : selectedRole === 'faculty'
          ? 'Please enter your MITS faculty email (@mitsgwalior.in) or Faculty Staff ID'
          : selectedRole === 'admin'
          ? 'Please enter your Dean / Administrator email (@mitsgwalior.in)'
          : 'Please enter your MITS email or ID'
      );
      return;
    }

    // Domain validation if email entered
    if (query.includes('@') && !isEmailValidForRole(query, selectedRole)) {
      if (selectedRole === 'faculty' || selectedRole === 'admin') {
        setErrorMsg('Domain Restriction: Faculty and Dean accounts must use the official @mitsgwalior.in email domain.');
      } else if (selectedRole === 'student') {
        setErrorMsg('Domain Restriction: Student accounts must use the official @mitsgwl.ac.in institutional email domain.');
      } else {
        setErrorMsg('Domain Restriction: Must use an official MITS email domain (@mitsgwl.ac.in or @mitsgwalior.in).');
      }
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: query,
          role: selectedRole
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        setErrorMsg(data.message || 'Login failed. Please verify your MITS credentials.');
      }
    } catch {
      setErrorMsg('Failed to connect to MITS authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const { user: fbUser } = await googleSignIn();
      if (!fbUser?.email) {
        setErrorMsg('Google Sign-In failed: No email returned from Google account.');
        setLoading(false);
        return;
      }

      // Authenticate with server
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: fbUser.email,
          name: fbUser.displayName,
          photoURL: fbUser.photoURL,
          uid: fbUser.uid
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        setErrorMsg(data.message || 'Failed to authenticate Google account with MITS portal.');
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in cancelled: Google popup was closed before completing login.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else {
        setErrorMsg(err?.message || 'Google Sign-In failed. Please try again or use your MITS credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg('Please enter your full legal name and official MITS institutional email address');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!isEmailValidForRole(cleanEmail, selectedRole)) {
      if (selectedRole === 'faculty' || selectedRole === 'admin') {
        setErrorMsg('Official Domain Required: Registration for Faculty and Dean accounts requires an email ending with @mitsgwalior.in (e.g. prof.name@mitsgwalior.in or dean.academics@mitsgwalior.in)');
      } else if (selectedRole === 'student') {
        setErrorMsg('Official Domain Required: Student registration requires an institutional email ending with @mitsgwl.ac.in (e.g. 0901cs221089@mitsgwl.ac.in)');
      } else {
        setErrorMsg('Official Domain Required: Club organizer registration requires an email ending with @mitsgwl.ac.in or @mitsgwalior.in');
      }
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const payload: any = {
        name: name.trim(),
        email: cleanEmail,
        role: selectedRole,
        department,
        phone: phone.trim()
      };

      if (selectedRole === 'student') {
        payload.studentId = studentId.trim() || `0901CS${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`;
        payload.year = year;
      } else if (selectedRole === 'faculty') {
        payload.facultyId = facultyId.trim() || `FAC-MITS-${department.substring(0, 2).toUpperCase()}${Math.floor(10 + Math.random() * 90)}`;
        payload.designation = designation;
      } else if (selectedRole === 'club_organizer') {
        payload.studentId = studentId.trim() || `0901CS221045`;
        payload.year = year;
        payload.clubName = clubName.trim() || `${name}'s MITS Society`;
        payload.clubCategory = clubCategory;
        payload.clubDescription = clubDescription.trim() || 'Student registered club at MITS Gwalior.';
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        setErrorMsg(data.message || 'Registration failed.');
      }
    } catch {
      setErrorMsg('Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Banner with MITS Gwalior Branding */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative shrink-0 border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Building className="w-3 h-3 text-amber-300" />
              <span>Madhav Institute of Technology & Science, Gwalior</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {selectedRole === 'student' ? (
              <span className="flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-indigo-400" />
                MITS Student Portal
              </span>
            ) : selectedRole === 'faculty' ? (
              <span className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-amber-400" />
                MITS Faculty Coordinator Portal
              </span>
            ) : selectedRole === 'club_organizer' ? (
              <span className="flex items-center gap-2">
                <Users className="w-6 h-6 text-emerald-400" />
                MITS Club Organizer Portal
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-400" />
                MITS Academic Senate & Dean Portal
              </span>
            )}
          </h2>

          <p className="text-xs text-slate-300 mt-1">
            {selectedRole === 'student'
              ? 'Student rights: browse campus events, book tickets, scan QR passes, and download faculty-verified certificates.'
              : selectedRole === 'faculty'
              ? 'Faculty rights: academic advisement, official event approvals, attendance oversight, and verified certificates.'
              : selectedRole === 'club_organizer'
              ? 'Club Admin rights: schedule club workshops, broadcast attendee emails, and manage club attendance rosters.'
              : 'Academic Senate rights: institute-wide event administration, candidate roster oversight, and compliance.'}
          </p>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Authentication Error: </span>
                {errorMsg}
              </div>
            </div>
          )}

          {/* Mode Switcher: Sign In vs Register */}
          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                !isSignUp 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isSignUp 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Register New Profile
            </button>
          </div>

          {/* Role Selection Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Your MITS Role:
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {selectedRole === 'student' ? 'Student Account' : selectedRole === 'faculty' ? 'Faculty / Staff Account' : selectedRole === 'club_organizer' ? 'Club Admin Account' : 'Senate Admin'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Student Role */}
              <button
                type="button"
                id="tab-role-student"
                onClick={() => { setSelectedRole('student'); setErrorMsg(''); }}
                className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-1 transition-all relative cursor-pointer ${
                  selectedRole === 'student'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className={`p-1.5 rounded-lg ${selectedRole === 'student' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-bold ${selectedRole === 'student' ? 'text-indigo-950 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>
                    Student
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  RSVP & Passes
                </span>
                {selectedRole === 'student' && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600" />
                )}
              </button>

              {/* Faculty Role */}
              <button
                type="button"
                id="tab-role-faculty"
                onClick={() => { setSelectedRole('faculty'); setErrorMsg(''); }}
                className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-1 transition-all relative cursor-pointer ${
                  selectedRole === 'faculty'
                    ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 dark:border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className={`p-1.5 rounded-lg ${selectedRole === 'faculty' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-bold ${selectedRole === 'faculty' ? 'text-amber-950 dark:text-amber-200' : 'text-slate-800 dark:text-slate-200'}`}>
                    Faculty
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Advisor & Review
                </span>
                {selectedRole === 'faculty' && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-600" />
                )}
              </button>

              {/* Club Organizer Role */}
              <button
                type="button"
                id="tab-role-club"
                onClick={() => { setSelectedRole('club_organizer'); setErrorMsg(''); }}
                className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-1 transition-all relative cursor-pointer ${
                  selectedRole === 'club_organizer'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 dark:border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className={`p-1.5 rounded-lg ${selectedRole === 'club_organizer' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-bold ${selectedRole === 'club_organizer' ? 'text-emerald-950 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'}`}>
                    Club Admin
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Host & Manage
                </span>
                {selectedRole === 'club_organizer' && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-600" />
                )}
              </button>

              {/* Dean / Admin Role */}
              <button
                type="button"
                id="tab-role-admin"
                onClick={() => { setSelectedRole('admin'); setErrorMsg(''); }}
                className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-1 transition-all relative cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 dark:border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className={`p-1.5 rounded-lg ${selectedRole === 'admin' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-bold ${selectedRole === 'admin' ? 'text-purple-950 dark:text-purple-200' : 'text-slate-800 dark:text-slate-200'}`}>
                    Dean / Admin
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Academic Senate
                </span>
                {selectedRole === 'admin' && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-600" />
                )}
              </button>
            </div>
          </div>

          {/* SIGN IN VIEW */}
          {!isSignUp ? (
            <div className="space-y-5">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {selectedRole === 'student' ? 'MITS Student Email or Enrollment No.' :
                       selectedRole === 'faculty' ? 'MITS Faculty Email or Staff ID' :
                       selectedRole === 'club_organizer' ? 'MITS Club Organizer Email' :
                       'Dean / Administrator Email'}
                    </label>
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <AtSign className="w-3 h-3" />
                      <span>Domain: {getExpectedDomain(selectedRole)}</span>
                    </span>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="text"
                      id="input-login-identifier"
                      value={loginIdentifier}
                      onChange={e => setLoginIdentifier(e.target.value)}
                      placeholder={
                        selectedRole === 'student'
                          ? 'e.g. 0901cs221089@mitsgwl.ac.in or 0901CS221089'
                          : selectedRole === 'faculty'
                          ? 'e.g. radhika.iyer@mitsgwalior.in or FAC-MITS-CS42'
                          : selectedRole === 'club_organizer'
                          ? 'e.g. iste@mitsgwl.ac.in'
                          : 'e.g. dean.academics@mitsgwalior.in'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      {selectedRole === 'faculty' || selectedRole === 'admin' 
                        ? 'Official faculty/dean institutional email (@mitsgwalior.in)' 
                        : 'Official MITS student institutional email (@mitsgwl.ac.in)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAppendDomain('login')}
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      + {getExpectedDomain(selectedRole)}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-submit-login"
                  disabled={loading}
                  className={`w-full py-2.5 px-4 rounded-xl text-white text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer ${
                    selectedRole === 'faculty'
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                      : selectedRole === 'club_organizer'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                      : selectedRole === 'admin'
                      ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                  }`}
                >
                  {loading ? (
                    'Verifying MITS credentials...'
                  ) : (
                    <>
                      <span>Sign In as {selectedRole === 'student' ? 'Student' : selectedRole === 'faculty' ? 'Faculty Member' : selectedRole === 'club_organizer' ? 'Club Admin' : 'Dean / Admin'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Google Sign In Option */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold tracking-wider text-[10px]">
                      Or continue with
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-google-signin"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-bold transition-all shadow-2xs flex items-center justify-center gap-2.5 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign In with Google</span>
                </button>
              </div>

              {/* Verified MITS Demo Persona Quick Logins */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <UserCheck className="w-4 h-4 text-indigo-500" />
                    <span>MITS Verified Accounts ({selectedRole.toUpperCase()})</span>
                  </div>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">1-Click Login</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(selectedRole === 'student' ? studentsList :
                    selectedRole === 'faculty' ? facultyList :
                    selectedRole === 'club_organizer' ? clubOrganizersList : adminList).map(u => (
                    <button
                      key={u.id}
                      id={`btn-demo-user-${u.id}`}
                      onClick={() => {
                        onLoginSuccess(u);
                        onClose();
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-750 hover:border-indigo-400 transition-all text-left flex items-center gap-2.5 group cursor-pointer"
                    >
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-300 dark:ring-slate-600 group-hover:ring-indigo-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {u.name}
                        </div>
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono truncate">
                          {u.email}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span>{u.studentId || u.facultyId || u.department || 'MITS Gwalior'}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {selectedRole === 'faculty' ? 'Full Name & Academic Title' : 'Full Legal Name'}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={selectedRole === 'faculty' ? 'e.g. Dr. Rajesh Kulkarni' : 'e.g. Aarav Sharma'}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      MITS Email ({getExpectedDomain(selectedRole)})
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAppendDomain('register')}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      + {getExpectedDomain(selectedRole)}
                    </button>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={
                      selectedRole === 'faculty' || selectedRole === 'admin'
                        ? 'e.g. prof.name@mitsgwalior.in'
                        : 'e.g. 0901cs221089@mitsgwl.ac.in'
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Role-Specific Fields */}
              {selectedRole === 'student' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">MITS Enrollment No.</label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={e => setStudentId(e.target.value)}
                      placeholder="0901CS221089"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                    <select
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Academic Year</label>
                    <select
                      value={year}
                      onChange={e => setYear(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                      <option>Postgraduate (M.Tech / MCA)</option>
                    </select>
                  </div>
                </div>
              ) : selectedRole === 'faculty' ? (
                /* Faculty Specific Fields */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-amber-50/50 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Faculty Staff ID</label>
                    <input
                      type="text"
                      value={facultyId}
                      onChange={e => setFacultyId(e.target.value)}
                      placeholder="FAC-MITS-CS42"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">MITS Department</label>
                    <select
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option>Computer Science & Engineering</option>
                      <option>Information Technology</option>
                      <option>Electronics & Communication</option>
                      <option>Electrical Engineering</option>
                      <option>Mechanical Engineering</option>
                      <option>Civil Engineering</option>
                      <option>Architecture & Planning</option>
                      <option>Dean Student Welfare</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
                    <select
                      value={designation}
                      onChange={e => setDesignation(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option>Professor & Faculty Advisor</option>
                      <option>Head of Department (HOD)</option>
                      <option>Associate Professor</option>
                      <option>Assistant Professor</option>
                      <option>Dean Academic Affairs</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* Club Organizer Specific Fields */
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">MITS Club / Society Details</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Club / Chapter Name</label>
                      <input
                        type="text"
                        value={clubName}
                        onChange={e => setClubName(e.target.value)}
                        placeholder="e.g. MITS Coding Club"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                      <select
                        value={clubCategory}
                        onChange={e => setClubCategory(e.target.value as any)}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="Technical">Technical</option>
                        <option value="Cultural">Cultural</option>
                        <option value="Academic">Academic</option>
                        <option value="Literary">Literary</option>
                        <option value="Sports">Sports</option>
                        <option value="Social">Social</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Brief Description</label>
                    <textarea
                      rows={2}
                      value={clubDescription}
                      onChange={e => setClubDescription(e.target.value)}
                      placeholder="Objectives and activities of the club at MITS Gwalior"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Creating MITS Account...' : `Register as ${selectedRole === 'student' ? 'MITS Student' : selectedRole === 'faculty' ? 'Faculty Coordinator' : 'Club Admin'}`}
              </button>

              {/* Google Sign In Divider & Button */}
              <div className="space-y-3 pt-1">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold tracking-wider text-[10px]">
                      Or register with
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-google-register"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-bold transition-all shadow-2xs flex items-center justify-center gap-2.5 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign Up with Google</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
