import React, { useState } from 'react';
import { 
  Database, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  X, 
  Sparkles, 
  Layers, 
  FileText, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Code
} from 'lucide-react';
import { Club, Registration, UniversityEvent } from '../types.js';
import { auth, googleSignIn, seedInitialFirestoreData } from '../lib/firebase.js';

interface DatabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: UniversityEvent[];
  clubs: Club[];
  registrations: Registration[];
}

export const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({
  isOpen,
  onClose,
  events,
  clubs,
  registrations
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'clubs' | 'registrations' | 'schema'>('overview');
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{
    success: boolean;
    eventsCount: number;
    clubsCount: number;
    registrationsCount: number;
    errors: string[];
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSeedToFirestore = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      // If user is not signed in to Firebase, trigger Google sign-in
      if (!auth.currentUser) {
        try {
          await googleSignIn();
        } catch (signInErr) {
          console.warn('Sign-in cancelled or failed, attempting seed anyway...');
        }
      }

      const res = await seedInitialFirestoreData(events, clubs, registrations);
      setSeedResult(res);
    } catch (err: any) {
      setSeedResult({
        success: false,
        eventsCount: 0,
        clubsCount: 0,
        registrationsCount: 0,
        errors: [err?.message || String(err)]
      });
    } finally {
      setSeeding(false);
    }
  };

  const sampleEventDoc = {
    title: "MITS CodeStorm Hackathon 2025",
    tagline: "36-Hour National Collegiate Hackathon at Madhav Institute",
    description: "Build AI-powered solutions, IoT hardware prototypes, and web systems for smart campuses.",
    clubId: "club-coding",
    clubName: "Coding Club MITS Gwalior",
    category: "Hackathon",
    startDate: "2025-10-25",
    startTime: "09:00 AM",
    endDate: "2025-10-26",
    endTime: "09:00 PM",
    venue: "Madhav IT Park Supercomputer Lab 402",
    capacity: 120,
    registeredCount: 45,
    status: "upcoming",
    contactEmail: "codingclub@mitsgwl.ac.in",
    isOnline: false
  };

  const sampleClubDoc = {
    name: "Coding Club MITS",
    category: "Technical",
    description: "Official competitive programming and open-source software development society.",
    leadName: "Lakshya Sharma",
    leadEmail: "25mc1la66@mitsgwl.ac.in",
    leadEnrollmentNo: "BTMC25O1065",
    facultyAdvisor: "Prof. Radhika Iyer",
    memberCount: 85,
    eventsHosted: 12,
    foundedYear: 2018,
    isVerified: true
  };

  const sampleRegDoc = {
    eventId: "evt-hackathon-2025",
    userName: "Aarav Sharma",
    userEmail: "aarav.sharma@mitsgwl.ac.in",
    studentId: "0901CS221089",
    department: "Computer Science & Engineering",
    year: "3rd Year",
    ticketCode: "MITS-782914",
    status: "confirmed",
    registeredAt: new Date().toISOString()
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Cloud Firestore & Database Hub</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                Database: <span className="text-amber-300 font-semibold">ai-studio-universeuniversi-a76bc1b9-310d-4a26-8150-300b091d2b14</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 gap-2 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'overview', label: '1-Click Auto Seed' },
            { id: 'events', label: 'Collection: events' },
            { id: 'clubs', label: 'Collection: clubs' },
            { id: 'registrations', label: 'Collection: registrations' },
            { id: 'schema', label: 'Field Dictionary' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-bold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          
          {/* TAB 1: 1-Click Auto Seed */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base text-indigo-950 dark:text-indigo-200">
                      Auto-Populate Database with Complete MITS Data
                    </h3>
                    <p className="text-xs text-indigo-800 dark:text-indigo-300 mt-1 leading-relaxed">
                      Instead of typing dozens of fields manually in the Firebase Console, you can push all campus events, societies/clubs, and registration records into Cloud Firestore with one click.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleSeedToFirestore}
                        disabled={seeding}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow flex items-center gap-2 transition-all cursor-pointer"
                      >
                        {seeding ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Writing Documents to Firestore...
                          </>
                        ) : (
                          <>
                            <Server className="w-4 h-4" />
                            ⚡ Auto-Populate Firestore Database Now
                          </>
                        )}
                      </button>

                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({events.length} Events • {clubs.length} Clubs • {registrations.length} Registrations ready)
                      </span>
                    </div>

                    {seedResult && (
                      <div className={`mt-4 p-3 rounded-lg text-xs border ${
                        seedResult.success 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800' 
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                      }`}>
                        <div className="flex items-center gap-2 font-bold mb-1">
                          {seedResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          {seedResult.success ? 'Database populated successfully!' : 'Finished with notes:'}
                        </div>
                        <p>
                          Added <strong>{seedResult.eventsCount}</strong> events, <strong>{seedResult.clubsCount}</strong> clubs, and <strong>{seedResult.registrationsCount}</strong> registrations to your Firestore database.
                        </p>
                        {seedResult.errors.length > 0 && (
                          <div className="mt-2 text-xs font-mono text-red-600 dark:text-red-300 max-h-24 overflow-y-auto">
                            {seedResult.errors.map((e, idx) => <div key={idx}>• {e}</div>)}
                          </div>
                        )}
                        <p className="mt-2 text-[11px] opacity-80">
                          Now refresh your Firebase Console tab to see all collections and documents appear live!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Collections Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">events</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      {events.length} records
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Title, club, category, schedule, venue, capacity, status.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">clubs</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                      {clubs.length} records
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Club name, lead email, advisor, founded year, members.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">registrations</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                      {registrations.length} records
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Candidate tickets, student enrollment, RSVP confirmation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: events collection */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Collection: <code>events</code></h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Here is the exact document structure with all fields ready to copy into Firebase Console:
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(JSON.stringify(sampleEventDoc, null, 2), 'event_json')}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === 'event_json' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'event_json' ? 'Copied JSON!' : 'Copy JSON'}
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
                <pre>{JSON.stringify(sampleEventDoc, null, 2)}</pre>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5">Field Name</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">title</td><td className="p-2.5 font-mono">string</td><td className="p-2.5">Name of the event (e.g. MITS CodeStorm)</td></tr>
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">clubName</td><td className="p-2.5 font-mono">string</td><td className="p-2.5">Hosting student society</td></tr>
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">clubId</td><td className="p-2.5 font-mono">string</td><td className="p-2.5">Foreign key to clubs collection</td></tr>
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">category</td><td className="p-2.5 font-mono">string</td><td className="p-2.5">Workshop, Hackathon, Seminar, Cultural</td></tr>
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">startDate</td><td className="p-2.5 font-mono">string</td><td className="p-2.5">Date in YYYY-MM-DD format</td></tr>
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">startTime</td><td className="p-2.5 font-mono">string</td><td className="p-2.5">Time of event (e.g. 10:00 AM)</td></tr>
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">venue</td><td className="p-2.5 font-mono">string</td><td className="p-2.5">Auditorium / Lab venue name</td></tr>
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">capacity</td><td className="p-2.5 font-mono">number</td><td className="p-2.5">Max allowed participants</td></tr>
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">status</td><td className="p-2.5 font-mono">string</td><td className="p-2.5">upcoming, ongoing, completed, cancelled</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: clubs collection */}
          {activeTab === 'clubs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Collection: <code>clubs</code></h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Recognized campus student societies & technical clubs:
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(JSON.stringify(sampleClubDoc, null, 2), 'club_json')}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === 'club_json' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'club_json' ? 'Copied JSON!' : 'Copy JSON'}
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
                <pre>{JSON.stringify(sampleClubDoc, null, 2)}</pre>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5">Field Name</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">name</td><td className="p-2.5 font-mono">string</td><td className="p-2.5">Full club name</td></tr>
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">category</td><td className="p-2.5 font-mono">string</td><td className="p-2.5">Technical, Cultural, Sports, Social</td></tr>
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">leadName</td><td className="p-2.5 font-mono">string</td><td className="p-2.5">President or student coordinator</td></tr>
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">leadEmail</td><td className="p-2.5 font-mono">string</td><td className="p-2.5">Official MITS email</td></tr>
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">facultyAdvisor</td><td className="p-2.5 font-mono">string</td><td className="p-2.5">Professor in charge</td></tr>
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">memberCount</td><td className="p-2.5 font-mono">number</td><td className="p-2.5">Number of active members</td></tr>
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">isVerified</td><td className="p-2.5 font-mono">boolean</td><td className="p-2.5">Dean/SAC approved status</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: registrations collection */}
          {activeTab === 'registrations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Collection: <code>registrations</code></h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Candidate attendance, passes, and check-in tickets:
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(JSON.stringify(sampleRegDoc, null, 2), 'reg_json')}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === 'reg_json' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'reg_json' ? 'Copied JSON!' : 'Copy JSON'}
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
                <pre>{JSON.stringify(sampleRegDoc, null, 2)}</pre>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5">Field Name</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">eventId</td><td className="p-2.5 font-mono">string</td><td className="p-2.5">Target event ID</td></tr>
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">userName</td><td className="p-2.5 font-mono">string</td><td className="p-2.5">Full student name</td></tr>
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">userEmail</td><td className="p-2.5 font-mono">string</td><td className="p-2.5">Student MITS email</td></tr>
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">studentId</td><td className="p-2.5 font-mono">string</td><td className="p-2.5">College enrollment number</td></tr>
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">ticketCode</td><td className="p-2.5 font-mono">string</td><td className="p-2.5">Unique ticket identifier</td></tr>
                    <tr><td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">status</td><td className="p-2.5 font-mono">string</td><td className="p-2.5">confirmed, checked_in, cancelled</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: Schema dictionary */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white">Active Database Blueprint</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All collections and relationships registered in <code>firebase-blueprint.json</code> and secured via <code>firestore.rules</code>:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="font-bold text-slate-900 dark:text-white">/events/{'{eventId}'}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Primary university workshops, hackathons, and seminars.</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="font-bold text-slate-900 dark:text-white">/clubs/{'{clubId}'}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Registered student societies, leaders, and advisors.</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="font-bold text-slate-900 dark:text-white">/registrations/{'{registrationId}'}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Event RSVP passes, QR barcodes, and attendance logs.</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="font-bold text-slate-900 dark:text-white">/drive_resources/{'{resourceId}'}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Google Drive attachments, syllabus notes, and slide decks.</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="font-bold text-slate-900 dark:text-white">/certificates/{'{certificateId}'}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Tamper-proof participation certificates with verification hashes.</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Strict Attribute-Based Access Control (ABAC) enforced in <code>firestore.rules</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
