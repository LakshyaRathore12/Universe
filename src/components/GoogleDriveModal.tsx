import React, { useState, useEffect, useCallback } from 'react';
import { 
  Folder, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Image as ImageIcon, 
  File, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Trash2, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  HardDrive, 
  Plus, 
  ShieldCheck,
  Download
} from 'lucide-react';
import { DriveFileItem, fetchDriveFiles, uploadFileToDrive, deleteFileFromDrive } from '../lib/googleDrive.js';
import { googleSignIn, logoutGoogle } from '../lib/firebase.js';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  currentUserEmail?: string;
  onSelectFile?: (file: DriveFileItem) => void;
  onTokenUpdated?: (token: string, email?: string) => void;
  title?: string;
  subtitle?: string;
  selectActionLabel?: string;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  accessToken,
  currentUserEmail,
  onSelectFile,
  onTokenUpdated,
  title = 'Google Drive File Hub',
  subtitle = 'Browse, manage, and link your campus resources, slides, documents, and event passes directly from Google Drive.',
  selectActionLabel = 'Attach File'
}) => {
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'documents' | 'spreadsheets' | 'presentations' | 'images' | 'folders'>('all');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Destructive Action State (Mandatory explicit confirmation dialog)
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Upload State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileContent, setUploadFileContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const loadFiles = useCallback(async () => {
    if (!accessToken) {
      setFiles([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDriveFiles(accessToken, {
        searchQuery,
        mimeTypeFilter: filterType,
        pageSize: 30
      });
      setFiles(res.files);
    } catch (err: any) {
      console.error('Error fetching drive files:', err);
      setError(err.message || 'Failed to load files from Google Drive.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, searchQuery, filterType]);

  useEffect(() => {
    if (isOpen && accessToken) {
      loadFiles();
    }
  }, [isOpen, accessToken, loadFiles]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      const res = await googleSignIn();
      if (res.accessToken) {
        if (onTokenUpdated) {
          onTokenUpdated(res.accessToken, res.user.email || undefined);
        }
        setSuccessMsg(`Connected as ${res.user.email}!`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      console.error('Sign in failure:', err);
      setError(err.message || 'Could not authenticate with Google Drive.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!accessToken || !fileToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteFileFromDrive(accessToken, fileToDelete.id);
      if (res.success) {
        setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
        setSuccessMsg(`File "${fileToDelete.name}" was permanently removed from Google Drive.`);
        setTimeout(() => setSuccessMsg(null), 3500);
      } else {
        setError(res.message || 'Failed to delete file.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete file.');
    } finally {
      setIsDeleting(false);
      setFileToDelete(null);
    }
  };

  const handleCreateNewNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !uploadFileName.trim()) return;

    setIsUploading(true);
    setError(null);
    try {
      const res = await uploadFileToDrive(
        accessToken,
        uploadFileName.endsWith('.txt') || uploadFileName.endsWith('.md') ? uploadFileName : `${uploadFileName}.txt`,
        uploadFileContent,
        'text/plain',
        'Created via UniVerse Campus Event Network'
      );

      if (res.success && res.file) {
        setFiles(prev => [res.file!, ...prev]);
        setSuccessMsg(res.message || 'File uploaded successfully!');
        setShowUploadForm(false);
        setUploadFileName('');
        setUploadFileContent('');
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setError(res.message || 'Failed to create file.');
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) return <Folder className="w-5 h-5 text-amber-500" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    }
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      return <Presentation className="w-5 h-5 text-amber-600" />;
    }
    if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('text')) {
      return <FileText className="w-5 h-5 text-blue-500" />;
    }
    if (mimeType.includes('image')) {
      return <ImageIcon className="w-5 h-5 text-purple-500" />;
    }
    return <File className="w-5 h-5 text-slate-400" />;
  };

  const formatBytes = (bytes?: string) => {
    if (!bytes) return '--';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return '--';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-xl font-bold tracking-tight text-white">{title}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Messages */}
        {successMsg && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2 text-xs text-emerald-700 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-100 flex items-center justify-between text-xs text-rose-700 font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-rose-500 hover:text-rose-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Unauthenticated View */}
          {!accessToken ? (
            <div className="py-12 px-4 text-center max-w-md mx-auto space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
                <HardDrive className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Connect Google Drive</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Sign in with your Google Account to access lecture notes, event decks, registration spreadsheets, and certificates stored in your Google Drive.
                </p>
              </div>

              {/* Official Google Sign In Button */}
              <button 
                id="btn-google-drive-signin"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm shadow-sm hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
                <span>{isSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Secure OAuth authorization with zero-knowledge token handling</span>
              </div>
            </div>
          ) : (
            <>
              {/* Top Controls Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadFiles()}
                    placeholder="Search files in Google Drive..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={loadFiles}
                    disabled={loading}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                    title="Refresh file list"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
                  </button>

                  <button
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-indigo-200"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Note / Resource</span>
                  </button>
                </div>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {(['all', 'documents', 'spreadsheets', 'presentations', 'images', 'folders'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-full capitalize whitespace-nowrap font-medium transition-all ${
                      filterType === type
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Upload New Note Drawer Form */}
              {showUploadForm && (
                <form onSubmit={handleCreateNewNote} className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>Save Resource / Document to Google Drive</span>
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setShowUploadForm(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="File Name (e.g. Hackathon_Schedule_Notes.txt)"
                      value={uploadFileName}
                      onChange={e => setUploadFileName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-indigo-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <textarea
                      placeholder="Write notes, agenda summary, or resource description to save to Drive..."
                      value={uploadFileContent}
                      onChange={e => setUploadFileContent(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-indigo-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowUploadForm(false)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving to Drive...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Files Grid / List */}
              {loading ? (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <RefreshCw className="w-7 h-7 animate-spin mx-auto text-indigo-600" />
                  <p className="text-xs">Fetching Google Drive resources...</p>
                </div>
              ) : files.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2 border-2 border-dashed border-slate-200 rounded-2xl">
                  <File className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No files found</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    {searchQuery ? `No files matching "${searchQuery}"` : 'No files found in this category. You can upload a new note or document.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {files.map(file => (
                    <div
                      key={file.id}
                      className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-slate-50/50 transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600" title={file.name}>
                            {file.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {formatBytes(file.size)} • {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Drive File'}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-1.5">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 flex items-center gap-1 font-medium"
                              title="Open in Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View</span>
                            </a>
                          )}

                          <button
                            onClick={() => setFileToDelete(file)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Delete file from Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {onSelectFile && (
                          <button
                            onClick={() => {
                              onSelectFile(file);
                              onClose();
                            }}
                            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] shadow-sm active:scale-95 transition-all"
                          >
                            {selectActionLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            {accessToken ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Connected to Google Drive</span>
                {currentUserEmail && <span className="text-slate-400">({currentUserEmail})</span>}
              </>
            ) : (
              <span className="text-slate-500">Google Drive not connected</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {accessToken && (
              <button
                onClick={async () => {
                  await logoutGoogle();
                  if (onTokenUpdated) onTokenUpdated('');
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-medium transition-colors"
              >
                Disconnect
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>

      {/* Mandatory Explicit Confirmation Dialog for Destructive Actions */}
      {fileToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-heading text-lg font-bold text-slate-900">
                Permanently Delete File?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-slate-900">"{fileToDelete.name}"</span> from your Google Drive? This action cannot be undone.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-center gap-2">
              <File className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{fileToDelete.name}</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm shadow-rose-600/30"
              >
                {isDeleting ? 'Deleting...' : 'Delete from Drive'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
