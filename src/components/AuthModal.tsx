import React, { useState } from 'react';
import { X, GraduationCap, Users, Shield, ArrowRight, UserCheck } from 'lucide-react';
import { User, UserRole } from '../types.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  availableUsers: User[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  availableUsers
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('2nd Year');
  const [clubName, setClubName] = useState('');
  const [clubCategory, setClubCategory] = useState<'Technical' | 'Cultural' | 'Literary' | 'Sports' | 'Social' | 'Academic'>('Technical');
  const [clubDescription, setClubDescription] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) {
      setErrorMsg('Please enter your university email');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail })
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        setErrorMsg(data.message || 'Login failed. Please check the email.');
      }
    } catch {
      setErrorMsg('Failed to connect to authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setErrorMsg('Please enter your full name and email');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const payload: any = {
        name,
        email,
        role,
        department,
        year
      };
      if (role === 'student') {
        payload.studentId = studentId || `UNI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      } else if (role === 'club_organizer') {
        payload.clubName = clubName || `${name}'s Society`;
        payload.clubCategory = clubCategory;
        payload.clubDescription = clubDescription || 'Student registered club.';
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        setErrorMsg(data.message || 'Registration failed');
      }
    } catch {
      setErrorMsg('Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Campus Identity</span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-white">
            {isSignUp ? 'Join UniVerse Portal' : 'Sign in to UniVerse'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Access campus workshops, seminars, and club management
          </p>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Tab Toggle: Sign In vs Sign Up */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
            <button
              onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                !isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register Account / Club
            </button>
          </div>

          {!isSignUp ? (
            <div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    University Email Address
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="e.g. aarav.sharma@campus.edu"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>

              {/* Quick Demo Accounts */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Instant 1-Click Demo Profiles</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {availableUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onLoginSuccess(u);
                        onClose();
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-left flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600">
                            {u.name}
                          </p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 group-hover:bg-indigo-100 group-hover:text-indigo-700">
                        {u.role === 'student' ? 'Student' : u.role === 'club_organizer' ? 'Club Org' : 'Admin'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  I am registering as:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      role === 'student'
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      <span>Student</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Discover events, RSVP & get tickets</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('club_organizer')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      role === 'club_organizer'
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>Club Organizer</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Host, schedule & notify attendees</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Samarth Patel"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. samarth@campus.edu"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {role === 'student' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Student ID (Optional)</label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={e => setStudentId(e.target.value)}
                      placeholder="UNI-2024-..."
                      className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                    <select
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="w-full px-2 py-2 text-xs rounded-lg border border-slate-300"
                    >
                      <option>Computer Science & Engineering</option>
                      <option>Electronics & Communication</option>
                      <option>Mechanical & Aerospace</option>
                      <option>Business & Management</option>
                      <option>Biotechnology</option>
                      <option>Design & Media</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Year</label>
                    <select
                      value={year}
                      onChange={e => setYear(e.target.value)}
                      className="w-full px-2 py-2 text-xs rounded-lg border border-slate-300"
                    >
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                      <option>Postgraduate / PhD</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-800">Club Registration Details</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Club / Society Name</label>
                      <input
                        type="text"
                        value={clubName}
                        onChange={e => setClubName(e.target.value)}
                        placeholder="e.g. Google Developer Student Club"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Club Category</label>
                      <select
                        value={clubCategory}
                        onChange={e => setClubCategory(e.target.value as any)}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300"
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
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Club Mission / Brief</label>
                    <textarea
                      rows={2}
                      value={clubDescription}
                      onChange={e => setClubDescription(e.target.value)}
                      placeholder="What is your club about?"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
