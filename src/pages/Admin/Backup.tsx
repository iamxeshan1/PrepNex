import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Database, 
  Download, 
  Upload, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileJson, 
  RefreshCw, 
  Users, 
  FileBox, 
  ClipboardList, 
  BookOpen, 
  Activity, 
  GraduationCap, 
  Building, 
  Megaphone,
  HardDrive,
  Clock,
  FileCheck,
  X,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { seedDefaultData } from '../../services/seed';

interface CollectionConfig {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'critical' | 'content' | 'system';
}

const COLLECTIONS_CONFIG: CollectionConfig[] = [
  { id: 'users', name: 'Users & Aspirants', description: 'Registered user profiles, roles, and stats', icon: Users, category: 'critical' },
  { id: 'questions', name: 'Question Bank', description: 'All questions, options, answers & explanations', icon: FileBox, category: 'critical' },
  { id: 'tests', name: 'Mock Test Sets', description: 'Mock tests, paper configurations & mark settings', icon: ClipboardList, category: 'critical' },
  { id: 'exams', name: 'Exam Catalog', description: 'Exam categories, total tests & pricing data', icon: BookOpen, category: 'critical' },
  { id: 'subjects', name: 'Subjects & Topics', description: 'Subject hierarchies and topic taxonomies', icon: Layers, category: 'content' },
  { id: 'liveTests', name: 'Live Test Sessions', description: 'Scheduled and active live scholarship exams', icon: Activity, category: 'content' },
  { id: 'study_material', name: 'Study Material & Ebooks', description: 'Ebook records, PDF links and downloads', icon: GraduationCap, category: 'content' },
  { id: 'agencies', name: 'Agencies / Boards', description: 'Recruitment boards (UPSC, SSC, Banking, etc.)', icon: Building, category: 'content' },
  { id: 'jobAlerts', name: 'Job Alerts', description: 'Official exam notifications and job posts', icon: Megaphone, category: 'content' },
];

export default function AdminBackup() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [selectedCollections, setSelectedCollections] = useState<string[]>(
    COLLECTIONS_CONFIG.map(c => c.id)
  );

  // Export State
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [lastExportInfo, setLastExportInfo] = useState<{ filename: string; totalDocs: number; sizeKb: number; timestamp: string } | null>(null);

  // Import / Restore State
  const [importedJson, setImportedJson] = useState<any | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<{ currentCollection: string; processed: number; total: number } | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [clearExisting, setClearExisting] = useState(false);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);

  // Fetch live counts for all collections
  const fetchCounts = async () => {
    setLoadingCounts(true);
    const updatedCounts: Record<string, number> = {};
    for (const config of COLLECTIONS_CONFIG) {
      try {
        const snap = await getDocs(collection(db, config.id));
        updatedCounts[config.id] = snap.size;
      } catch (err) {
        console.error(`Error counting ${config.id}:`, err);
        updatedCounts[config.id] = 0;
      }
    }
    setCounts(updatedCounts);
    setLoadingCounts(false);
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const toggleSelectCollection = (id: string) => {
    if (selectedCollections.includes(id)) {
      setSelectedCollections(prev => prev.filter(item => item !== id));
    } else {
      setSelectedCollections(prev => [...prev, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedCollections(COLLECTIONS_CONFIG.map(c => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedCollections([]);
  };

  // EXPORT FUNCTIONALITY
  const handleExportBackup = async () => {
    if (selectedCollections.length === 0) {
      alert("Please select at least one collection to export.");
      return;
    }

    setExporting(true);
    setExportProgress("Initializing database export...");

    try {
      const backupData: Record<string, any[]> = {};
      let grandTotalDocs = 0;

      for (let i = 0; i < selectedCollections.length; i++) {
        const colId = selectedCollections[i];
        const config = COLLECTIONS_CONFIG.find(c => c.id === colId);
        setExportProgress(`Exporting ${config?.name || colId} (${i + 1}/${selectedCollections.length})...`);

        const snap = await getDocs(collection(db, colId));
        const docsArray = snap.docs.map(docSnap => ({
          _documentId: docSnap.id,
          ...docSnap.data()
        }));

        backupData[colId] = docsArray;
        grandTotalDocs += docsArray.length;
      }

      const backupPayload = {
        exportMetadata: {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          appName: 'PrepNext',
          environment: 'Cloud Firestore',
          totalCollections: selectedCollections.length,
          totalDocuments: grandTotalDocs
        },
        collections: backupData
      };

      const jsonString = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const timestampStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `prepnext-firestore-backup-${timestampStr}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const sizeKb = Math.round(blob.size / 1024);

      setLastExportInfo({
        filename,
        totalDocs: grandTotalDocs,
        sizeKb,
        timestamp: new Date().toLocaleTimeString()
      });

      setExportProgress("Backup exported successfully!");
      setTimeout(() => setExportProgress(null), 4000);
    } catch (err: any) {
      console.error("Export error:", err);
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  // FILE PARSING FOR RESTORE
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportError(null);
    setRestoreSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);

        if (!parsed || (typeof parsed !== 'object')) {
          throw new Error("Invalid JSON file structure.");
        }

        // Support both structured backup format { collections: { ... } } or flat collection object
        const collectionsObj = parsed.collections || parsed;

        if (typeof collectionsObj !== 'object' || Object.keys(collectionsObj).length === 0) {
          throw new Error("No collection records found in the backup file.");
        }

        setImportedJson(parsed);
      } catch (err: any) {
        setImportError(`Invalid Backup File: ${err.message}`);
        setImportedJson(null);
      }
    };

    reader.readAsText(file);
  };

  // RESTORE FUNCTIONALITY
  const handleExecuteRestore = async () => {
    if (!importedJson) return;

    const collectionsData = importedJson.collections || importedJson;
    const colKeys = Object.keys(collectionsData);

    if (colKeys.length === 0) {
      alert("No data found to restore.");
      return;
    }

    setRestoring(true);
    setRestoreSuccess(null);
    setImportError(null);

    let totalDocsRestored = 0;

    try {
      for (const colId of colKeys) {
        const records = collectionsData[colId];
        if (!Array.isArray(records)) continue;

        const config = COLLECTIONS_CONFIG.find(c => c.id === colId);
        const colDisplayName = config?.name || colId;

        // Optionally clear existing documents if toggle selected
        if (clearExisting) {
          setRestoreProgress({
            currentCollection: `Clearing existing ${colDisplayName}...`,
            processed: 0,
            total: records.length
          });
          const currentSnap = await getDocs(collection(db, colId));
          for (const d of currentSnap.docs) {
            await deleteDoc(doc(db, colId, d.id));
          }
        }

        for (let i = 0; i < records.length; i++) {
          const item = records[i];
          const docId = item._documentId || item.id || item.uid || doc(collection(db, colId)).id;

          // Clean up metadata key if present before writing
          const recordToSave = { ...item };
          delete recordToSave._documentId;

          setRestoreProgress({
            currentCollection: `Restoring ${colDisplayName}`,
            processed: i + 1,
            total: records.length
          });

          await setDoc(doc(db, colId, docId), recordToSave, { merge: true });
          totalDocsRestored++;
        }
      }

      setRestoreSuccess(`Restoration complete! Successfully restored ${totalDocsRestored} documents across ${colKeys.length} collections.`);
      setImportedJson(null);
      setFileName(null);
      fetchCounts();
    } catch (err: any) {
      console.error("Restore error:", err);
      setImportError(`Restoration interrupted: ${err.message}`);
    } finally {
      setRestoring(false);
      setRestoreProgress(null);
    }
  };

  const handleTriggerDefaultSeed = async () => {
    setShowSeedConfirm(false);
    setRestoring(true);
    setRestoreSuccess(null);
    try {
      await seedDefaultData(true);
      setRestoreSuccess("Baseline exam catalog, questions, subjects & aspirants restored successfully!");
      fetchCounts();
    } catch (err: any) {
      setImportError(`Seed failed: ${err.message}`);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <AdminLayout title="Firestore Backup & Recovery">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-[#002f26] to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#006e5d_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#006e5d]/30 border border-[#006e5d]/50 text-emerald-300 rounded-full text-xs font-black uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Data Protection & Loss Prevention
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">Firestore Database Backup & Restore</h1>
              <p className="text-slate-300 text-sm leading-relaxed">
                Export JSON snapshots of critical collections (questions, exams, mock sets, user accounts) to local disk. Easily upload and restore snapshots in case of accidental deletions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={fetchCounts}
                disabled={loadingCounts}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${loadingCounts ? 'animate-spin' : ''}`} />
                Refresh Database Stats
              </button>
              <button 
                onClick={() => setShowSeedConfirm(true)}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                Seed Baseline Data
              </button>
            </div>
          </div>
        </div>

        {/* Live Collection Inventory Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-[#006e5d]" />
              Database Collection Overview
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {COLLECTIONS_CONFIG.length} Managed Collections
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {COLLECTIONS_CONFIG.map(col => {
              const Icon = col.icon;
              const count = counts[col.id] ?? 0;
              const isSelected = selectedCollections.includes(col.id);

              return (
                <div 
                  key={col.id}
                  onClick={() => toggleSelectCollection(col.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected 
                      ? 'bg-white border-[#006e5d] ring-2 ring-[#006e5d]/10 shadow-md' 
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl transition-colors ${
                        isSelected ? 'bg-[#006e5d]/10 text-[#006e5d]' : 'bg-slate-200/60 text-slate-500'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{col.name}</h3>
                          {col.category === 'critical' && (
                            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-black uppercase rounded">Critical</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{col.description}</p>
                      </div>
                    </div>
                    
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => {}} // handled by parent onClick
                      className="w-4 h-4 text-[#006e5d] rounded border-slate-300 focus:ring-[#006e5d] cursor-pointer"
                    />
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Record Count</span>
                    <span className="text-base font-black text-slate-900">
                      {loadingCounts ? (
                        <span className="inline-block w-8 h-4 bg-slate-200 animate-pulse rounded"></span>
                      ) : (
                        count.toLocaleString()
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Action Grid: Backup (Export) & Recovery (Restore) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* SECTION 1: EXPORT / BACKUP TOOL */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-teal-50 border border-teal-100 rounded-2xl text-[#006e5d]">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">1. Export JSON Backup</h2>
                    <p className="text-xs text-slate-500">Generate a structured JSON snapshot file of selected collections</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleSelectAll}
                    className="text-xs font-bold text-[#006e5d] hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">•</span>
                  <button 
                    onClick={handleDeselectAll}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Deselect
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span>Selected Collections for Export</span>
                  <span className="text-[#006e5d] font-bold">{selectedCollections.length} of {COLLECTIONS_CONFIG.length}</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selectedCollections.map(id => {
                    const cfg = COLLECTIONS_CONFIG.find(c => c.id === id);
                    return (
                      <span key={id} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {cfg?.name || id}
                      </span>
                    );
                  })}
                  {selectedCollections.length === 0 && (
                    <span className="text-xs text-rose-500 italic font-medium">No collections selected. Check boxes above to select.</span>
                  )}
                </div>
              </div>

              {exportProgress && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-teal-800 text-xs font-bold flex items-center gap-3 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#006e5d]" />
                  <span>{exportProgress}</span>
                </div>
              )}

              {lastExportInfo && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Backup Saved: {lastExportInfo.filename}</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-700 text-[11px] font-medium pt-1 border-t border-emerald-200/60">
                    <span>{lastExportInfo.totalDocs} documents exported</span>
                    <span>{lastExportInfo.sizeKb} KB • {lastExportInfo.timestamp}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleExportBackup}
              disabled={exporting || selectedCollections.length === 0}
              className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                exporting || selectedCollections.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-[#006e5d] hover:bg-[#005a4d] text-white active:scale-[0.99]'
              }`}
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting Snapshot...' : 'Download JSON Backup'}
            </button>
          </div>

          {/* SECTION 2: IMPORT / RESTORE TOOL */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-600">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">2. Restore From JSON File</h2>
                    <p className="text-xs text-slate-500">Upload a previously exported backup file to restore records</p>
                  </div>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="relative border-2 border-dashed border-slate-300 hover:border-[#006e5d] rounded-2xl p-6 text-center transition-colors bg-slate-50/50 group">
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="space-y-2 pointer-events-none">
                  <div className="w-12 h-12 mx-auto bg-slate-100 text-slate-400 group-hover:text-[#006e5d] group-hover:bg-teal-50 rounded-2xl flex items-center justify-center transition-colors">
                    <FileJson className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      {fileName ? fileName : 'Click to upload or drag & drop backup JSON'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">Accepts standard .json backup files exported from PrepNext</p>
                  </div>
                </div>
              </div>

              {/* Inspection Preview if JSON loaded */}
              {importedJson && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 shadow-lg border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-teal-400">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span>Backup Inspection Ready</span>
                    </div>
                    {importedJson.exportMetadata?.exportedAt && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(importedJson.exportMetadata.exportedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Collections breakdown */}
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {Object.keys(importedJson.collections || importedJson).map(col => {
                      const recs = (importedJson.collections || importedJson)[col];
                      const count = Array.isArray(recs) ? recs.length : 0;
                      return (
                        <div key={col} className="flex items-center justify-between py-1 px-2.5 bg-slate-800/80 rounded-lg text-slate-300 font-mono">
                          <span>{col}</span>
                          <span className="font-bold text-teal-300">{count} records</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Overwrite mode toggle */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold">
                      <input 
                        type="checkbox"
                        checked={clearExisting}
                        onChange={(e) => setClearExisting(e.target.checked)}
                        className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                      />
                      <span className={clearExisting ? 'text-rose-400 font-bold' : ''}>
                        Clear existing docs before restoring
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Restore Progress Bar */}
              {restoreProgress && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span>{restoreProgress.currentCollection}</span>
                    <span>{restoreProgress.processed} / {restoreProgress.total}</span>
                  </div>
                  <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-600 h-full transition-all duration-200"
                      style={{ width: `${Math.round((restoreProgress.processed / Math.max(restoreProgress.total, 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {restoreSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{restoreSuccess}</span>
                </div>
              )}

              {importError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs font-bold flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleExecuteRestore}
              disabled={restoring || !importedJson}
              className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                restoring || !importedJson
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-amber-600 hover:bg-amber-700 text-white active:scale-[0.99]'
              }`}
            >
              <Upload className="w-4 h-4" />
              {restoring ? 'Restoring Database...' : 'Execute Database Restore'}
            </button>
          </div>

        </div>

        {/* MODAL: SEED CONFIRMATION */}
        <AnimatePresence>
          {showSeedConfirm && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Database className="w-5 h-5 text-[#006e5d]" />
                    <span>Seed Baseline Reference Data</span>
                  </div>
                  <button 
                    onClick={() => setShowSeedConfirm(false)}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  This will populate default mock exams, question sets, subjects, live test schedules, study materials, and sample aspirant profiles into your database without deleting existing user data.
                </p>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowSeedConfirm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTriggerDefaultSeed}
                    className="px-5 py-2 bg-[#006e5d] hover:bg-[#005a4d] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Confirm & Seed Data
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
}
