import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Shuffle,
  X,
  RefreshCw,
  Sun,
  Moon,
  FileSpreadsheet,
  Layers,
  BookOpen,
  Palette,
  FileText,
  Download,
  Eye
} from 'lucide-react';
import { defaultPracticeDataset, PracticeItem, MasterTier } from './data/pianoData';
import { defaultReferencePdfs, ReferencePdf } from './data/samplePdfs';
import { parseCSV } from './utils/csvParser';

const MASTER_TIERS: { id: MasterTier; label: string; icon: React.ReactNode }[] = [
  { id: 'Technique', label: 'Tech', icon: <Layers className="w-4 h-4 shrink-0" /> },
  { id: 'Repertoire', label: 'Rep', icon: <BookOpen className="w-4 h-4 shrink-0" /> },
  { id: 'Improvisation', label: 'Improv', icon: <Palette className="w-4 h-4 shrink-0" /> }
];

export default function App() {
  const [items, setItems] = useState<PracticeItem[]>(defaultPracticeDataset);
  const [tierSelections, setTierSelections] = useState<Record<MasterTier, PracticeItem[]>>({
    Technique: [],
    Repertoire: [],
    Improvisation: []
  });

  const [activeTier, setActiveTier] = useState<MasterTier>('Technique');
  const [selectedItemForModal, setSelectedItemForModal] = useState<PracticeItem | null>(null);
  const [selectedPdfForViewer, setSelectedPdfForViewer] = useState<ReferencePdf | null>(null);
  const [currentPdfPage, setCurrentPdfPage] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'sheets' | 'pdfs' | 'subcategories'>('sheets');
  const [hiddenSubcategories, setHiddenSubcategories] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('pd_hidden_subcategories');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isDarkMode, setIsDarkMode] = useState(true);

  // CSV live sync states
  const [csvUrl, setCsvUrl] = useState('');
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);
  const [csvStatus, setCsvStatus] = useState<{ message: string; isError: boolean } | null>(null);

  const initializedRef = useRef(false);

  // Apply dark class to root html
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Generate selections for all tiers
  const generateSelections = (currentDataset: PracticeItem[] = items, forceRandom = false) => {
    const savedSelections = localStorage.getItem('pd_session_selections');
    if (!forceRandom && savedSelections && !initializedRef.current) {
      try {
        const parsed = JSON.parse(savedSelections);
        if (parsed && Object.keys(parsed).length > 0) {
          setTierSelections(parsed);
          initializedRef.current = true;
          return;
        }
      } catch {}
    }

    const newSelections: Record<MasterTier, PracticeItem[]> = {
      Technique: [],
      Repertoire: [],
      Improvisation: []
    };

    const currentMap = new Map<MasterTier, Map<string, PracticeItem[]>>();
    MASTER_TIERS.forEach(t => currentMap.set(t.id, new Map()));

    currentDataset.forEach(item => {
      const catMap = currentMap.get(item.tier);
      if (catMap) {
        const catName = item.category.trim();
        if (!catMap.has(catName)) {
          catMap.set(catName, []);
        }
        catMap.get(catName)!.push(item);
      }
    });

    MASTER_TIERS.forEach(({ id: tier }) => {
      const catMap = currentMap.get(tier);
      if (!catMap) return;

      const tierItemsList: PracticeItem[] = [];
      catMap.forEach((catItems, catName) => {
        if (catItems.length === 0) return;
        const randomIndex = Math.floor(Math.random() * catItems.length);
        const selected = { ...catItems[randomIndex] };

        tierItemsList.push(selected);
      });

      newSelections[tier] = tierItemsList;
    });

    setTierSelections(newSelections);
    localStorage.setItem('pd_session_selections', JSON.stringify(newSelections));
    initializedRef.current = true;
  };

  useEffect(() => {
    generateSelections(items, false);
    const savedUrl = localStorage.getItem('fpp_sheets_csv_url');
    if (savedUrl) {
      setCsvUrl(savedUrl);
      fetchCsvData(savedUrl, false);
    }
  }, []);

  const fetchCsvData = async (url: string, showFeedback = true) => {
    if (!url.trim()) {
      setItems(defaultPracticeDataset);
      generateSelections(defaultPracticeDataset, true);
      if (showFeedback) setCsvStatus({ message: 'Loaded default built-in dataset.', isError: false });
      return;
    }

    setIsLoadingCsv(true);
    setCsvStatus(null);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const text = await response.text();
      const parsedItems = parseCSV(text);

      if (parsedItems.length > 0) {
        setItems(parsedItems);
        generateSelections(parsedItems, true);
        if (showFeedback) {
          setCsvStatus({
            message: `Successfully synced ${parsedItems.length} practice items!`,
            isError: false
          });
        }
      } else {
        throw new Error('No valid items found in CSV.');
      }
    } catch (err: any) {
      console.warn('Google Sheets CSV fetch restricted by browser CORS. Falling back to default database.');
      setItems(defaultPracticeDataset);
      generateSelections(defaultPracticeDataset, true);
      if (showFeedback) {
        setCsvStatus({
          message: 'Direct fetch restricted by browser CORS security. Using built-in database.',
          isError: true
        });
      }
    } finally {
      setIsLoadingCsv(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('fpp_sheets_csv_url', csvUrl);
    fetchCsvData(csvUrl, true);
  };

  // Theme-aware pleasant colors
  const primaryBlue = isDarkMode ? '#3B82F6' : '#2563EB';
  const subcategoryColor = isDarkMode ? 'text-[#60A5FA]' : 'text-[#1D4ED8]';

  const rawTierItems = tierSelections[activeTier] || [];
  const currentTierItems = rawTierItems.filter(item => !hiddenSubcategories[`${item.tier}:${item.category.trim()}`]);

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col font-sora antialiased transition-colors duration-150 ${
      isDarkMode 
        ? 'bg-[#121212] text-[#F3F4F6] selection:bg-blue-500/30 selection:text-white' 
        : 'bg-[#F4F5F7] text-[#1F2937] selection:bg-blue-500/20 selection:text-blue-900'
    }`}>
      {/* Top Header */}
      <header className="h-12 shrink-0 px-4 sm:px-6 flex items-center justify-between bg-transparent">
        <h1 className={`text-sm font-bold tracking-wider uppercase ${isDarkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
          {activeTier}
        </h1>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg border transition-all active:scale-95 ${
              isDarkMode 
                ? 'bg-[#1E1E1E] border-[#2A2A2A] text-[#A0A0A0] hover:text-white' 
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-950 shadow-sm'
            }`}
            title="Toggle light/dark mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              setCsvStatus(null);
              setIsSettingsOpen(true);
            }}
            className={`p-2 rounded-lg border transition-all active:scale-95 ${
              isDarkMode 
                ? 'bg-[#1E1E1E] border-[#2A2A2A] text-[#A0A0A0] hover:text-white' 
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-950 shadow-sm'
            }`}
            title="Google Sheets CSV Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Area: Active Category Section with Zero Scrolling */}
      <main className="flex-1 min-h-0 px-4 sm:px-6 pb-2 max-w-3xl w-full mx-auto flex flex-col overflow-hidden">
        <section
          className={`h-full border rounded-2xl p-4 sm:p-6 flex flex-col overflow-hidden shadow-xl transition-all ${
            isDarkMode ? 'bg-[#1A1A1E] border-[#2A2A30]' : 'bg-white border-slate-200/80 shadow-slate-200/50'
          }`}
        >
          {/* Subcategories & Randomized Items List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 sm:space-y-4 my-auto no-scrollbar">
            {activeTier === 'Repertoire' ? (() => {
              const repSource = hiddenSubcategories['Repertoire:Repertoire Sources'] ? null : currentTierItems.find(i => i.category.trim() === 'Repertoire Sources');
              const pageItem = hiddenSubcategories['Repertoire:Page #'] ? null : currentTierItems.find(i => i.category.trim() === 'Page #');
              const otherItems = currentTierItems.filter(i => {
                const c = i.category.trim();
                return c !== 'Repertoire Sources' && c !== 'Page #';
              });

              return (
                <>
                  {repSource && pageItem ? (
                    <div className="grid grid-cols-1 sm:grid-cols-[4fr_1fr] gap-3 items-stretch">
                      {/* Repertoire Source Container */}
                      <div
                        onClick={() => setSelectedItemForModal(repSource)}
                        className={`group p-4 sm:p-5 rounded-xl cursor-pointer transition-all active:scale-[0.99] min-w-0 ${
                          isDarkMode 
                            ? 'hover:bg-[#25252B] bg-[#222226]/80 border border-white/5' 
                            : 'hover:bg-slate-50 bg-slate-50/90 border border-slate-200/70'
                        }`}
                      >
                        <span className={`text-xs font-mono-sub tracking-wider uppercase block mb-1 whitespace-normal break-words ${subcategoryColor}`}>
                          {repSource.category}
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold tracking-tight truncate transition-colors">
                          {repSource.name}
                        </h3>
                      </div>

                      {/* Page # Container */}
                      <div
                        onClick={() => setSelectedItemForModal(pageItem || {
                          id: `${repSource.id}-page`,
                          tier: 'Repertoire',
                          category: 'Page #',
                          name: repSource.pageNumber || 'Page 1',
                          description: `Specific page reference for ${repSource.name}`
                        })}
                        className={`group p-4 sm:p-5 rounded-xl cursor-pointer transition-all active:scale-[0.99] min-w-0 ${
                          isDarkMode 
                            ? 'hover:bg-[#25252B] bg-[#222226]/80 border border-white/5' 
                            : 'hover:bg-slate-50 bg-slate-50/90 border border-slate-200/70'
                        }`}
                      >
                        <span className={`text-xs font-mono-sub tracking-wider uppercase block mb-1 whitespace-normal break-words ${subcategoryColor}`}>
                          Page #
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold tracking-tight truncate transition-colors">
                          {pageItem?.name || repSource.pageNumber || 'Page 1'}
                        </h3>
                      </div>
                    </div>
                  ) : repSource ? (
                    <div
                      onClick={() => setSelectedItemForModal(repSource)}
                      className={`group p-4 sm:p-5 rounded-xl cursor-pointer transition-all active:scale-[0.99] ${
                        isDarkMode 
                          ? 'hover:bg-[#25252B] bg-[#222226]/80 border border-white/5' 
                          : 'hover:bg-slate-50 bg-slate-50/90 border border-slate-200/70'
                      }`}
                    >
                      <span className={`text-xs font-mono-sub tracking-wider uppercase block mb-1 whitespace-normal break-words ${subcategoryColor}`}>
                        {repSource.category}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold tracking-tight truncate transition-colors">
                        {repSource.name}
                      </h3>
                    </div>
                  ) : pageItem ? (
                    <div
                      onClick={() => setSelectedItemForModal(pageItem)}
                      className={`group p-4 sm:p-5 rounded-xl cursor-pointer transition-all active:scale-[0.99] ${
                        isDarkMode 
                          ? 'hover:bg-[#25252B] bg-[#222226]/80 border border-white/5' 
                          : 'hover:bg-slate-50 bg-slate-50/90 border border-slate-200/70'
                      }`}
                    >
                      <span className={`text-xs font-mono-sub tracking-wider uppercase block mb-1 whitespace-normal break-words ${subcategoryColor}`}>
                        {pageItem.category}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold tracking-tight truncate transition-colors">
                        {pageItem.name}
                      </h3>
                    </div>
                  ) : null}

                  {otherItems.map((item) => (
                    <div
                      key={item.category}
                      onClick={() => setSelectedItemForModal(item)}
                      className={`group p-4 sm:p-5 rounded-xl cursor-pointer transition-all active:scale-[0.99] ${
                        isDarkMode 
                          ? 'hover:bg-[#25252B] bg-[#222226]/80 border border-white/5' 
                          : 'hover:bg-slate-50 bg-slate-50/90 border border-slate-200/70'
                      }`}
                    >
                      <span className={`text-xs font-mono-sub tracking-wider uppercase block mb-1 whitespace-normal break-words ${subcategoryColor}`}>
                        {item.category}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold tracking-tight truncate transition-colors">
                        {item.name}
                      </h3>
                    </div>
                  ))}
                </>
              );
            })() : (
              currentTierItems.map((item) => (
                <div
                  key={item.category}
                  onClick={() => setSelectedItemForModal(item)}
                  className={`group p-4 sm:p-5 rounded-xl cursor-pointer transition-all active:scale-[0.99] ${
                    isDarkMode 
                      ? 'hover:bg-[#25252B] bg-[#222226]/80 border border-white/5' 
                      : 'hover:bg-slate-50 bg-slate-50/90 border border-slate-200/70'
                  }`}
                >
                  <span className={`text-xs font-mono-sub tracking-wider uppercase block mb-1 whitespace-normal break-words ${subcategoryColor}`}>
                    {item.category}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight truncate transition-colors">
                    {item.name}
                  </h3>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Bottom Footer: Navigation Tabs & Shuffle Button */}
      <footer className={`h-20 shrink-0 px-4 sm:px-6 border-t flex items-center justify-between gap-3 transition-colors ${
        isDarkMode ? 'bg-[#121212] border-[#222228]' : 'bg-white border-slate-200 shadow-lg'
      }`}>
        {/* Navigation Tabs with full width grid */}
        <div className={`flex-1 grid grid-cols-3 gap-1 p-1 rounded-xl border ${
          isDarkMode ? 'bg-[#1A1A1E] border-[#2A2A30]' : 'bg-slate-100 border-slate-200'
        }`}>
          {MASTER_TIERS.map(({ id, label, icon }) => {
            const isActive = activeTier === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTier(id)}
                className={`py-2 px-2 rounded-lg text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate ${
                  isActive
                    ? 'text-white shadow-md'
                    : isDarkMode ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
                style={isActive ? { backgroundColor: primaryBlue } : {}}
              >
                {icon}
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Shuffle Button */}
        <button
          onClick={() => generateSelections(items, true)}
          style={{ backgroundColor: primaryBlue }}
          className="py-2.5 px-4 sm:px-6 rounded-xl text-white font-bold text-xs sm:text-sm tracking-wide flex items-center gap-2 active:scale-[0.99] transition-all cursor-pointer shadow-lg shrink-0"
        >
          <Shuffle className="w-4 h-4" />
          <span className="hidden sm:inline">Shuffle</span>
        </button>
      </footer>

      {/* Item Detail Modal */}
      {selectedItemForModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedItemForModal(null)}
        >
          <div
            className={`border rounded-2xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl space-y-5 ${
              isDarkMode ? 'bg-[#1A1A1E] border-[#2A2A30] text-[#F3F4F6]' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItemForModal(null)}
              className={`absolute top-5 right-5 p-2 rounded-xl border transition-colors ${
                isDarkMode ? 'bg-[#121212] border-[#2A2A30] text-neutral-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className={`text-xs font-mono-sub uppercase tracking-wider block mb-1.5 whitespace-normal break-words ${subcategoryColor}`}>
                {selectedItemForModal.category}
              </span>
              <h3 className={`text-2xl sm:text-3xl font-bold tracking-tight mb-4 ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                {selectedItemForModal.name}
              </h3>
              <p className={`text-base sm:text-lg leading-relaxed ${isDarkMode ? 'text-neutral-300' : 'text-slate-700'}`}>
                {selectedItemForModal.description || 'No description provided.'}
              </p>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setSelectedItemForModal(null)}
                style={{ backgroundColor: primaryBlue }}
                className="px-6 py-2.5 rounded-xl text-white font-bold text-sm tracking-wide transition-all shadow-md cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings / Preferences Modal */}
      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className={`border rounded-2xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl space-y-5 ${
              isDarkMode ? 'bg-[#1A1A1E] border-[#2A2A30] text-[#F3F4F6]' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Settings className={`w-5 h-5 ${subcategoryColor}`} />
                <span>Preferences &amp; Library</span>
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className={`p-2 rounded-xl border transition-colors ${
                  isDarkMode ? 'bg-[#121212] border-[#2A2A30] text-neutral-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section Tabs */}
            <div className={`grid grid-cols-3 gap-1 p-1 rounded-xl border ${
              isDarkMode ? 'bg-[#121212] border-[#2A2A30]' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setSettingsTab('sheets')}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  settingsTab === 'sheets'
                    ? 'text-white shadow-md'
                    : isDarkMode ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
                style={settingsTab === 'sheets' ? { backgroundColor: primaryBlue } : {}}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Sheets</span>
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('pdfs')}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  settingsTab === 'pdfs'
                    ? 'text-white shadow-md'
                    : isDarkMode ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
                style={settingsTab === 'pdfs' ? { backgroundColor: primaryBlue } : {}}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDFs</span>
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('subcategories')}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  settingsTab === 'subcategories'
                    ? 'text-white shadow-md'
                    : isDarkMode ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
                style={settingsTab === 'subcategories' ? { backgroundColor: primaryBlue } : {}}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Subcategories</span>
              </button>
            </div>

            {settingsTab === 'sheets' ? (
              <div className="space-y-4 animate-in fade-in duration-150">
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-neutral-400' : 'text-slate-700'}`}>
                      Published Google Sheets CSV URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                      value={csvUrl}
                      onChange={(e) => setCsvUrl(e.target.value)}
                      className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode ? 'bg-[#121212] border-[#2A2A30] text-white placeholder-neutral-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  {csvStatus && (
                    <div
                      className={`p-3 rounded-xl border text-sm ${
                        csvStatus.isError
                          ? 'bg-red-950/30 border-red-900/50 text-red-400'
                          : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'
                      }`}
                    >
                      {csvStatus.message}
                    </div>
                  )}

                  {/* Formatting Card */}
                  <div className={`border rounded-xl p-4 text-xs space-y-2 leading-relaxed ${
                    isDarkMode ? 'bg-[#121212] border-[#2A2A30] text-neutral-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <p className="font-bold text-sm">4-Column CSV Formatting:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Col A:</strong> Tier (Technique, Repertoire, Improvisation)</li>
                      <li><strong>Col B:</strong> Category</li>
                      <li><strong>Col C:</strong> Lesson Item</li>
                      <li><strong>Col D:</strong> Description</li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCsvUrl('');
                        localStorage.removeItem('fpp_sheets_csv_url');
                        setItems(defaultPracticeDataset);
                        generateSelections(defaultPracticeDataset, true);
                        setCsvStatus({ message: 'Reset to default dataset.', isError: false });
                      }}
                      className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                        isDarkMode ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Reset to Default
                    </button>

                    <button
                      type="submit"
                      disabled={isLoadingCsv}
                      style={{ backgroundColor: primaryBlue }}
                      className="px-6 py-2.5 rounded-xl text-white font-bold text-sm tracking-wide flex items-center gap-2 disabled:opacity-50 transition-colors shadow-md cursor-pointer"
                    >
                      {isLoadingCsv ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                      <span>Save &amp; Sync</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : settingsTab === 'pdfs' ? (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {defaultReferencePdfs.map((pdf) => (
                    <div
                      key={pdf.id}
                      onClick={() => setSelectedPdfForViewer(pdf)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isDarkMode ? 'bg-[#121212] border-[#2A2A30] hover:bg-[#1E1E1E]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold truncate">{pdf.title}</h4>
                        <p className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-slate-500'} truncate`}>
                          {pdf.category} • {pdf.fileSize}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {MASTER_TIERS.map(({ id: tierId, label: tierLabel }) => {
                    const tierItems = items.filter(i => i.tier === tierId);
                    const uniqueCats = Array.from(new Set(tierItems.map(i => i.category)));
                    if (uniqueCats.length === 0) return null;

                    return (
                      <div key={tierId} className="space-y-2">
                        <h5 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-neutral-300' : 'text-slate-700'}`}>
                          {tierLabel} Categories
                        </h5>
                        <div className={`border rounded-xl p-3 space-y-2 ${
                          isDarkMode ? 'bg-[#121212] border-[#2A2A30]' : 'bg-slate-50 border-slate-200'
                        }`}>
                          {uniqueCats.map((cat) => {
                            const catTrimmed = cat.trim();
                            const key = `${tierId}:${catTrimmed}`;
                            const isVisible = !hiddenSubcategories[key];

                            return (
                              <label
                                key={cat}
                                className="flex items-center justify-between gap-3 p-2 rounded-lg cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                              >
                                <span className="text-sm font-medium">{cat}</span>
                                <input
                                  type="checkbox"
                                  checked={isVisible}
                                  onChange={(e) => {
                                    const newHidden = {
                                      ...hiddenSubcategories,
                                      [key]: !e.target.checked
                                    };
                                    setHiddenSubcategories(newHidden);
                                    localStorage.setItem('pd_hidden_subcategories', JSON.stringify(newHidden));
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {selectedPdfForViewer && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedPdfForViewer(null)}
        >
          <div
            className={`border rounded-2xl max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl space-y-4 ${
              isDarkMode ? 'bg-[#1A1A1E] border-[#2A2A30] text-[#F3F4F6]' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPdfForViewer(null)}
              className={`absolute top-5 right-5 p-2 rounded-xl border transition-colors ${
                isDarkMode ? 'bg-[#121212] border-[#2A2A30] text-neutral-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className={`text-xs font-mono-sub uppercase tracking-wider block mb-1 ${subcategoryColor}`}>
                {selectedPdfForViewer.category} Reference Document
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                {selectedPdfForViewer.title}
              </h3>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
                {selectedPdfForViewer.description}
              </p>
            </div>

            {/* Interactive PDF / Document Reader View */}
            {(() => {
              const totalPages = selectedPdfForViewer.pages?.length || 1;
              const currentPageData = selectedPdfForViewer.pages?.[currentPdfPage - 1] || selectedPdfForViewer.pages?.[0];

              return (
                <div className={`w-full h-80 border rounded-xl p-5 overflow-y-auto flex flex-col justify-between ${
                  isDarkMode ? 'bg-[#121212] border-[#2A2A30]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                        Page {currentPdfPage} of {totalPages}
                      </span>
                      <span className="text-xs font-mono font-bold opacity-70">
                        {selectedPdfForViewer.fileName}
                      </span>
                    </div>

                    {currentPageData ? (
                      <div className="space-y-3">
                        <h4 className="text-base font-bold">{currentPageData.heading}</h4>
                        <ul className="space-y-1.5 list-disc list-inside text-xs sm:text-sm leading-relaxed opacity-90">
                          {currentPageData.content.map((bullet, idx) => (
                            <li key={idx}>{bullet}</li>
                          ))}
                        </ul>

                        {currentPageData.musicalExample && (
                          <div className={`mt-3 p-3 rounded-lg border text-xs space-y-1 ${
                            isDarkMode ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                          }`}>
                            <p className="font-bold">{currentPageData.musicalExample.title}</p>
                            {currentPageData.musicalExample.chords && (
                              <p className="font-mono text-[11px] opacity-80">{currentPageData.musicalExample.chords}</p>
                            )}
                            <p className="italic opacity-80">{currentPageData.musicalExample.notes}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm italic opacity-70">No content available for this page.</p>
                    )}
                  </div>

                  {/* Page Navigation Footer inside reader */}
                  <div className="flex items-center justify-between pt-3 border-t mt-3">
                    <button
                      type="button"
                      disabled={currentPdfPage <= 1}
                      onClick={() => setCurrentPdfPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border text-xs font-bold disabled:opacity-30 cursor-pointer"
                    >
                      Previous Page
                    </button>
                    <span className="text-xs font-bold">
                      {currentPdfPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPdfPage >= totalPages}
                      onClick={() => setCurrentPdfPage(p => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg border text-xs font-bold disabled:opacity-30 cursor-pointer"
                    >
                      Next Page
                    </button>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  alert(`Downloading ${selectedPdfForViewer.fileName}...`);
                }}
                className={`px-4 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                  isDarkMode ? 'bg-[#121212] border-[#2A2A30] text-neutral-200 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-800 hover:text-slate-950'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={() => setSelectedPdfForViewer(null)}
                style={{ backgroundColor: primaryBlue }}
                className="px-6 py-2.5 rounded-xl text-white font-bold text-sm tracking-wide transition-all shadow-md cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
