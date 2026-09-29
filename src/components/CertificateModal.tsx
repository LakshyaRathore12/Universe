import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  HardDrive, 
  Mail, 
  CheckCircle2, 
  Award, 
  ShieldCheck, 
  Share2, 
  Copy, 
  Check, 
  Calendar, 
  MapPin, 
  ExternalLink 
} from 'lucide-react';
import { ParticipationCertificate, User } from '../types.js';
import { saveCertificateToDrive } from '../lib/googleDrive.js';

interface CertificateModalProps {
  certificate: ParticipationCertificate | null;
  onClose: () => void;
  currentUser?: User | null;
  accessToken?: string | null;
  onOpenGoogleDrive?: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  certificate,
  onClose,
  currentUser,
  accessToken,
  onOpenGoogleDrive
}) => {
  const [copied, setCopied] = useState(false);
  const [savingDrive, setSavingDrive] = useState(false);
  const [driveResult, setDriveResult] = useState<{ url: string; name: string } | null>(null);
  const [emailing, setEmailing] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(certificate.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToDrive = async () => {
    if (!accessToken) {
      if (onOpenGoogleDrive) onOpenGoogleDrive();
      return;
    }

    setSavingDrive(true);
    setDriveResult(null);

    try {
      const res = await saveCertificateToDrive(accessToken, {
        id: certificate.id,
        studentName: certificate.studentName,
        studentId: certificate.studentId,
        eventTitle: certificate.eventTitle,
        clubName: certificate.clubName,
        eventDate: certificate.eventDate,
        eventVenue: certificate.eventVenue,
        department: certificate.department,
        issuedAt: certificate.issuedAt,
        issuedBy: certificate.issuedBy,
        verificationHash: certificate.verificationHash
      });

      if (res.success && res.file?.webViewLink) {
        setDriveResult({ url: res.file.webViewLink, name: res.file.name });
      } else {
        alert(res.message || 'Could not save certificate to Google Drive');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving to Google Drive');
    } finally {
      setSavingDrive(false);
    }
  };

  const handleResendEmail = async () => {
    setEmailing(true);
    setEmailMsg(null);
    try {
      const res = await fetch(`/api/certificates/${certificate.id}/email`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setEmailMsg(`✓ Certificate emailed to ${certificate.studentEmail}!`);
      } else {
        setEmailMsg(data.message || 'Failed to send email.');
      }
    } catch {
      setEmailMsg('Network error sending email.');
    } finally {
      setEmailing(false);
      setTimeout(() => setEmailMsg(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[95vh] bg-slate-900 rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col my-auto text-white">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print bg-slate-950 p-4 px-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Participation Certificate</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {certificate.id}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Verified attendance certification issued by {certificate.clubName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              title="Print or Save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>

            <button
              onClick={handleSaveToDrive}
              disabled={savingDrive}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Save to Google Drive"
            >
              <HardDrive className={`w-4 h-4 text-indigo-400 ${savingDrive ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{savingDrive ? 'Saving...' : 'Save to Drive'}</span>
            </button>

            <button
              onClick={handleResendEmail}
              disabled={emailing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              title="Send email copy"
            >
              <Mail className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Email Copy</span>
            </button>

            <button
              onClick={handleCopyId}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              title="Copy Certificate ID"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy ID'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback alerts */}
        {driveResult && (
          <div className="no-print bg-emerald-950/80 border-b border-emerald-800/80 px-6 py-2 flex items-center justify-between text-xs text-emerald-200">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Certificate document saved to Google Drive: <strong>{driveResult.name}</strong>
            </span>
            <a
              href={driveResult.url}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1"
            >
              <span>Open in Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {emailMsg && (
          <div className="no-print bg-indigo-950/80 border-b border-indigo-800/80 px-6 py-2 text-xs text-indigo-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            <span>{emailMsg}</span>
          </div>
        )}

        {/* Certificate Display Area (Printable Canvas) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/50 flex justify-center items-center">
          
          <div 
            id="printable-certificate"
            className="w-full max-w-3xl bg-gradient-to-br from-amber-50/95 via-white to-slate-50 text-slate-900 rounded-2xl p-6 sm:p-12 shadow-2xl border-8 border-double border-amber-600/60 relative overflow-hidden print:shadow-none print:m-0 print:border-8 print:border-double print:border-amber-700"
          >
            {/* Elegant Background Watermark Crest */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none">
              <Award className="w-[500px] h-[500px] text-amber-900" />
            </div>

            {/* Corner Decorative Borders */}
            <div className="absolute top-2 left-2 w-12 h-12 border-t-2 border-l-2 border-amber-600/80" />
            <div className="absolute top-2 right-2 w-12 h-12 border-t-2 border-r-2 border-amber-600/80" />
            <div className="absolute bottom-2 left-2 w-12 h-12 border-b-2 border-l-2 border-amber-600/80" />
            <div className="absolute bottom-2 right-2 w-12 h-12 border-b-2 border-r-2 border-amber-600/80" />

            {/* University & Directorate Header */}
            <div className="text-center relative z-10 space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-[10px] font-extrabold uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>University of Technology & Sciences • Campus Senate</span>
              </div>

              <h2 className="font-serif text-xs sm:text-sm font-semibold tracking-wider text-slate-600 uppercase mt-2">
                Directorate of Student Welfare & Extra-Curricular Affairs
              </h2>

              <div className="py-2">
                <h1 className="font-serif text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 uppercase">
                  Certificate of Participation
                </h1>
                <div className="w-32 h-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto mt-2" />
              </div>

              <p className="text-xs sm:text-sm italic font-serif text-slate-600 pt-1">
                This certificate is proudly awarded to
              </p>
            </div>

            {/* Recipient Candidate Name */}
            <div className="text-center my-4 sm:my-6 relative z-10">
              <div className="font-serif text-2xl sm:text-4xl font-bold text-indigo-950 tracking-wide underline decoration-amber-500/60 decoration-2 underline-offset-8">
                {certificate.studentName}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-semibold text-slate-600">
                <span>Enrollment No: <strong className="font-mono text-slate-900">{certificate.studentId}</strong></span>
                <span>•</span>
                <span>Dept: <strong className="text-slate-900">{certificate.department}</strong></span>
                {certificate.year && (
                  <>
                    <span>•</span>
                    <span>Class: <strong className="text-slate-900">{certificate.year}</strong></span>
                  </>
                )}
              </div>
            </div>

            {/* Event Description & Citation */}
            <div className="text-center max-w-xl mx-auto text-xs sm:text-sm text-slate-700 leading-relaxed relative z-10 space-y-2">
              <p>
                in formal recognition of verified active participation and attendance in the collegiate technical/cultural program:
              </p>
              <div className="font-serif font-bold text-base sm:text-xl text-slate-900 px-4 py-2 bg-amber-50/70 border-y border-amber-200/80 rounded-lg inline-block my-1">
                "{certificate.eventTitle}"
              </div>
              <p className="text-xs text-slate-600">
                Organized with distinction by <strong>{certificate.clubName}</strong> held at <strong>{certificate.eventVenue}</strong> on <strong>{certificate.eventDate}</strong> ({certificate.eventTime}).
              </p>
            </div>

            {/* Signatures & Seal Section */}
            <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 items-end relative z-10 text-center">
              
              {/* Signatory 1: Lead Speaker / Advisor */}
              <div className="space-y-1">
                <div className="font-serif italic text-sm text-indigo-900 font-semibold tracking-wider">
                  {certificate.signatories[0]?.name || 'Devansh Verma'}
                </div>
                <div className="w-24 sm:w-32 h-px bg-slate-400 mx-auto" />
                <div className="text-[10px] sm:text-xs font-bold text-slate-800">
                  {certificate.signatories[0]?.title || 'Club President'}
                </div>
                <div className="text-[9px] text-slate-500 truncate">
                  {certificate.signatories[0]?.organization || certificate.clubName}
                </div>
              </div>

              {/* Central Official Golden Crest Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-amber-500 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-md flex items-center justify-center text-white">
                  <div className="absolute inset-1 rounded-full border border-dashed border-amber-200/80 flex items-center justify-center text-center p-1">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-amber-900 mt-1">
                  Official Seal
                </div>
              </div>

              {/* Signatory 2: Faculty Advisor / Dean */}
              <div className="space-y-1">
                <div className="font-serif italic text-sm text-indigo-900 font-semibold tracking-wider">
                  {certificate.signatories[2]?.name || 'Dr. Anand Ramanathan'}
                </div>
                <div className="w-24 sm:w-32 h-px bg-slate-400 mx-auto" />
                <div className="text-[10px] sm:text-xs font-bold text-slate-800">
                  {certificate.signatories[2]?.title || 'Dean of Student Affairs'}
                </div>
                <div className="text-[9px] text-slate-500 truncate">
                  {certificate.signatories[2]?.organization || 'Central Academic Council'}
                </div>
              </div>

            </div>

            {/* Bottom Verification Footer with QR Code */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 text-[10px] text-slate-500">
              
              <div className="flex items-center gap-3">
                {certificate.qrCodeUrl && (
                  <img 
                    src={certificate.qrCodeUrl} 
                    alt="Certificate QR Verification"
                    className="w-12 h-12 rounded border border-slate-300 bg-white p-0.5 shrink-0" 
                  />
                )}
                <div>
                  <div className="font-mono font-bold text-slate-800">
                    CERT ID: {certificate.id}
                  </div>
                  <div className="font-mono text-[9px] text-slate-500 truncate max-w-[240px]">
                    Hash: {certificate.verificationHash}
                  </div>
                  <div className="text-[9px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Attendance Verified & Authenticated</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div>Issued On: <strong className="text-slate-800">{new Date(certificate.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
                <div className="text-[9px] text-slate-500">UniVerse Central Collegiate System</div>
              </div>

            </div>

          </div>

        </div>

        {/* Modal Bottom Status (Hidden on print) */}
        <div className="no-print bg-slate-950 p-4 px-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Digital Certificate is cryptographically hashed and linked to attendee roster.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
};
