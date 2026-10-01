import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  GraduationCap, 
  Code2, 
  Copy, 
  Check, 
  Camera, 
  Sparkles
} from 'lucide-react';

interface DevelopersViewProps {
  onNavigateToEvents: () => void;
}

interface DeveloperData {
  id: string;
  name: string;
  title: string;
  email: string;
  linkedin: string;
  linkedinDisplay: string;
  github: string;
  githubDisplay: string;
  defaultAvatar: string;
  fallbackAvatar: string;
  education: {
    institution: string;
    degree: string;
    duration: string;
    enrollment: string;
    department: string;
    year: string;
  };
}

export const DevelopersView: React.FC<DevelopersViewProps> = ({ onNavigateToEvents }) => {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>(() => {
    return {
      'lakshya-rathore': localStorage.getItem('avatar_lakshya-rathore') || '/lakshya-profile.jpg',
      'lakshya-sharma': localStorage.getItem('avatar_lakshya-sharma') || '/lakshya-sharma.jpg',
      'jatin-gehlod': localStorage.getItem('avatar_jatin-gehlod') || '/jatin-gehlod.jpg'
    };
  });

  const [activeUploadDev, setActiveUploadDev] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedRathore = localStorage.getItem('avatar_lakshya-rathore');
    const savedSharma = localStorage.getItem('avatar_lakshya-sharma');
    const savedGehlod = localStorage.getItem('avatar_jatin-gehlod');
    
    setAvatarMap(prev => ({
      ...prev,
      'lakshya-rathore': savedRathore || prev['lakshya-rathore'],
      'lakshya-sharma': savedSharma || prev['lakshya-sharma'],
      'jatin-gehlod': savedGehlod || prev['jatin-gehlod']
    }));
  }, []);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const triggerUpload = (devId: string) => {
    setActiveUploadDev(devId);
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadDev) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      if (base64) {
        setAvatarMap(prev => ({ ...prev, [activeUploadDev]: base64 }));
        localStorage.setItem(`avatar_${activeUploadDev}`, base64);

        try {
          await fetch('/api/developer/avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Data: base64, developerKey: activeUploadDev })
          });
        } catch (err) {
          console.error('Failed to sync avatar with server:', err);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const developers: DeveloperData[] = [
    {
      id: 'lakshya-rathore',
      name: 'Lakshya Rathore',
      title: 'Full Stack Web Developer & Platform Architect',
      email: '25mc1la65@gmail.com',
      linkedin: 'https://www.linkedin.com/in/lakshyar29',
      linkedinDisplay: 'www.linkedin.com/in/lakshyar29',
      github: 'https://github.com/LakshyaRathore12',
      githubDisplay: 'github.com/LakshyaRathore12',
      defaultAvatar: '/lakshya-profile.jpg',
      fallbackAvatar: '/lakshya.jpg',
      education: {
        institution: 'Madhav Institute of Technology & Science, Gwalior',
        degree: 'B.Tech in Mathematics and Computing',
        duration: 'Aug 2025 - June 2029',
        enrollment: 'BTMC25O1065',
        department: 'Department of Mathematics and Computing',
        year: '2nd Year'
      }
    },
    {
      id: 'lakshya-sharma',
      name: 'Lakshya Sharma',
      title: 'Full Stack Web Developer & Systems Engineer',
      email: '25mc1la66@mitsgwl.ac.in',
      linkedin: 'https://www.linkedin.com/in/lakshya-sharma-249796384?utm_source=share_via&utm_content=profile&utm_medium=member_android',
      linkedinDisplay: 'linkedin.com/in/lakshya-sharma-249796384',
      github: 'https://github.com/Lakshya-sharma-k0',
      githubDisplay: 'github.com/Lakshya-sharma-k0',
      defaultAvatar: '/lakshya-sharma.jpg',
      fallbackAvatar: 'https://ui-avatars.com/api/?name=Lakshya+Sharma&size=192&background=6366f1&color=fff',
      education: {
        institution: 'Madhav Institute of Technology & Science, Gwalior',
        degree: 'B.Tech in Mathematics and Computing',
        duration: 'Aug 2025 - June 2029',
        enrollment: 'BTMC25O1066',
        department: 'Department of Mathematics and Computing',
        year: '2nd Year'
      }
    },
    {
      id: 'jatin-gehlod',
      name: 'Jatin Gehlod',
      title: 'Full Stack Web Developer & Contributor',
      email: '25mc1ja55@mitsgwl.ac.in',
      linkedin: 'https://www.linkedin.com/in/jatin-gehlod-87460b368?utm_source=share_via&utm_content=profile&utm_medium=member_android',
      linkedinDisplay: 'linkedin.com/in/jatin-gehlod-87460b368',
      github: 'https://github.com/jatinonly07-arch',
      githubDisplay: 'github.com/jatinonly07-arch',
      defaultAvatar: '/jatin-gehlod.jpg',
      fallbackAvatar: '/src/assets/images/jatin_gehlod_pfp_1790869111241.jpg',
      education: {
        institution: 'Madhav Institute of Technology & Science, Gwalior',
        degree: 'B.Tech in Mathematics and Computing',
        duration: 'Aug 2025 - June 2029',
        enrollment: 'BTMC25O1054',
        department: 'Department of Mathematics and Computing',
        year: '2nd Year'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onNavigateToEvents}
            id="btn-dev-back-events"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Events Dashboard</span>
          </button>
        </div>

        {/* Header Section (1:1 SDMS Style) */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 md:px-4 md:py-2 rounded-full mb-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-sm">
            <Code2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">
              Meet the Developers
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 text-slate-900 dark:text-white tracking-tight">
            The Team Behind{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Universe
            </span>
          </h1>

          <p className="text-sm md:text-base max-w-xl mx-auto text-slate-600 dark:text-slate-400 leading-relaxed">
            This platform was developed with passion and dedication by talented developers from Madhav Institute of Technology and Science (MITS) Gwalior.
          </p>
        </div>

        {/* Hidden File Input for Custom Photo Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
          id="dev-profile-file-input"
        />

        {/* Developers Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
          {developers.map((dev, index) => {
            const currentAvatar = avatarMap[dev.id] || dev.defaultAvatar;
            return (
              <div 
                key={dev.id}
                className="rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl transition-all hover:shadow-2xl flex flex-col"
              >
                {/* Card Header Gradient Banner */}
                <div className={`relative h-28 md:h-36 ${
                  index === 0 
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600'
                    : index === 1
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600'
                    : 'bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600'
                }`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.25),transparent_70%)] opacity-35" />
                  
                  {/* Circular Frame Profile Picture (Overlapping the banner) */}
                  <div className="absolute -bottom-14 md:-bottom-20 left-1/2 -translate-x-1/2 z-10 group">
                    <div className="relative w-28 h-28 md:w-40 md:h-40 rounded-full overflow-hidden ring-4 ring-white dark:ring-slate-900 shadow-2xl bg-white dark:bg-slate-800">
                      <img 
                        src={currentAvatar}
                        alt={dev.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = dev.fallbackAvatar;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Photo Change Hover Button */}
                      <button
                        type="button"
                        onClick={() => triggerUpload(dev.id)}
                        className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-semibold cursor-pointer"
                        title="Upload / Change Photo"
                      >
                        <Camera className="w-5 h-5 mb-1" />
                        <span>Change</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="pt-16 md:pt-24 pb-7 px-5 md:px-6 flex-1 flex flex-col">
                  
                  {/* Name & Title */}
                  <div className="text-center mb-5">
                    <div className="flex items-center justify-center gap-1.5">
                      <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                        {dev.name}
                      </h2>
                      {index === 0 && (
                        <span title="Lead Developer">
                          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                        </span>
                      )}
                    </div>
                    <p className={`text-xs md:text-sm font-medium mt-1 ${
                      index === 0 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : index === 1
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-teal-600 dark:text-teal-400'
                    }`}>
                      {dev.title}
                    </p>
                  </div>

                  {/* Social Action Symbols / Directing Links (Small Symbols) */}
                  <div className="flex justify-center items-center gap-2.5 mb-6">
                    {/* Email Small Symbol */}
                    <a
                      href={`mailto:${dev.email}`}
                      className="p-2 md:p-2.5 rounded-xl transition-all bg-slate-100 hover:bg-rose-500 hover:text-white dark:bg-slate-800 dark:hover:bg-rose-600 text-slate-600 dark:text-slate-400 dark:hover:text-white cursor-pointer shadow-xs active:scale-95"
                      title={`Email: ${dev.email}`}
                    >
                      <Mail className="w-4 h-4 md:w-5 md:h-5" />
                    </a>

                    {/* LinkedIn Small Symbol */}
                    <a
                      href={dev.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 md:p-2.5 rounded-xl transition-all bg-slate-100 hover:bg-[#0A66C2] hover:text-white dark:bg-slate-800 dark:hover:bg-[#0A66C2] text-slate-600 dark:text-slate-400 dark:hover:text-white cursor-pointer shadow-xs active:scale-95"
                      title={`LinkedIn: ${dev.linkedinDisplay}`}
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                      </svg>
                    </a>

                    {/* GitHub Small Symbol */}
                    <a
                      href={dev.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 md:p-2.5 rounded-xl transition-all bg-slate-100 hover:bg-slate-900 hover:text-white dark:bg-slate-800 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-400 dark:hover:text-white cursor-pointer shadow-xs active:scale-95"
                      title={`GitHub: ${dev.githubDisplay}`}
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                      </svg>
                    </a>

                    {/* Quick Copy Email Action */}
                    <button
                      onClick={() => handleCopyEmail(dev.email)}
                      className="p-2 md:p-2.5 rounded-xl transition-all bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-pointer shadow-xs active:scale-95"
                      title="Copy Email Address"
                    >
                      {copiedEmail === dev.email ? (
                        <Check className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4 md:w-5 md:h-5" />
                      )}
                    </button>
                  </div>

                  {/* Education Card (Aug 2025 - June 2029) */}
                  <div className="rounded-2xl p-4 md:p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 shadow-2xs mt-auto">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        Education
                      </h3>
                    </div>
                    
                    <p className="font-semibold text-xs md:text-sm text-slate-800 dark:text-slate-200">
                      {dev.education.institution}
                    </p>
                    
                    <p className="text-[11px] md:text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {dev.education.degree}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {/* Aug 2025 - June 2029 */}
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/80 text-[10px]">
                        {dev.education.duration}
                      </span>
                      <span>•</span>
                      <span className="font-medium text-slate-600 dark:text-slate-300">{dev.education.year}</span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                      <p>
                        Enrollment:{' '}
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {dev.education.enrollment}
                        </span>
                      </p>
                      <p className="truncate">{dev.education.department}</p>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Credit Line */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-500 pt-8 mt-4 border-t border-slate-200 dark:border-slate-800">
          <p>© {new Date().getFullYear()} Universe • Madhav Institute of Technology and Science Gwalior</p>
        </div>

      </main>
    </div>
  );
};
