import React, { useState, useCallback, useEffect } from 'react';
import { AnimationSettings, BoundingBox, SpriteSheetData, SliceMode } from './types';
import { EditorCanvas } from './components/EditorCanvas';
import { Preview } from './components/Preview';
import { detectSpritesWithAI } from './services/geminiService';
import { generateGif } from './utils/gifUtils';

const App: React.FC = () => {
  // State
  const [spriteData, setSpriteData] = useState<SpriteSheetData | null>(null);
  const [boxes, setBoxes] = useState<BoundingBox[]>([]);
  const [zoom, setZoom] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Grid Settings
  const [rows, setRows] = useState(1);
  const [cols, setCols] = useState(1);
  
  // Animation Settings
  const [settings, setSettings] = useState<AnimationSettings>({
    fps: 8,
    loop: true,
    transparent: null,
    scale: 2
  });

  // Handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setSpriteData({
          src: img.src,
          width: img.width,
          height: img.height,
          file
        });
        setBoxes([]); // Reset boxes
        setError(null);
        // Auto-set reasonable zoom
        if(img.width < 300) setZoom(3);
        else if(img.width < 600) setZoom(2);
        else setZoom(1);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const applyGridSlice = useCallback(() => {
    if (!spriteData) return;
    const newBoxes: BoundingBox[] = [];
    const w = Math.floor(spriteData.width / cols);
    const h = Math.floor(spriteData.height / rows);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        newBoxes.push({
          id: `grid-${x}-${y}`,
          x: x * w,
          y: y * h,
          width: w,
          height: h
        });
      }
    }
    setBoxes(newBoxes);
  }, [spriteData, rows, cols]);

  const applyAISlice = async () => {
    if (!spriteData) return;
    setIsProcessing(true);
    setError(null);
    try {
      const detected = await detectSpritesWithAI(spriteData.src);
      if (detected.length === 0) {
          setError("AI could not detect any sprites. Try adjusting the image or use Grid mode.");
      } else {
          setBoxes(detected);
      }
    } catch (err) {
      setError("Failed to process with AI. Check API Key or internet connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadGif = async () => {
    if (!spriteData || boxes.length === 0) return;
    setIsProcessing(true);
    try {
      const blob = await generateGif(spriteData.src, boxes, settings);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `animation-${Date.now()}.gif`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Failed to generate GIF.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Shortcuts
  useEffect(() => {
    // Optional: Keyboard shortcuts
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Header */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-6 justify-between shrink-0 z-20 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-indigo-500/20 shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="font-bold text-lg tracking-tight text-slate-100">Sprite<span className="text-indigo-400">Alchemist</span></h1>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
           {spriteData && <span>{spriteData.width}x{spriteData.height}px</span>}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Controls */}
        <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto z-10">
          <div className="p-6 space-y-8">
            
            {/* Upload */}
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Source</h2>
              {!spriteData ? (
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="border-2 border-dashed border-slate-700 rounded-xl h-32 flex flex-col items-center justify-center group-hover:border-indigo-500 transition-colors bg-slate-900/50">
                    <svg className="w-8 h-8 text-slate-600 mb-2 group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-sm text-slate-400 font-medium">Upload Sprite Sheet</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg border border-slate-700">
                   <img src={spriteData.src} alt="Thumb" className="w-10 h-10 object-cover rounded bg-slate-900 pixelated" />
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium truncate text-slate-200">{spriteData.file?.name}</p>
                     <button 
                      onClick={() => { setSpriteData(null); setBoxes([]); }}
                      className="text-xs text-red-400 hover:text-red-300 mt-0.5"
                     >
                       Remove
                     </button>
                   </div>
                </div>
              )}
            </section>

            {/* Slicing Tools */}
            <section className={!spriteData ? 'opacity-50 pointer-events-none' : ''}>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Slicing Tools</h2>
              
              <div className="space-y-4">
                {/* Grid Tool */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-sm font-semibold text-slate-300">Grid Slice</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Rows</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={rows} 
                        onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Cols</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={cols} 
                        onChange={(e) => setCols(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={applyGridSlice}
                    className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded transition-colors"
                  >
                    Apply Grid
                  </button>
                </div>

                {/* AI Tool */}
                <button 
                  onClick={applyAISlice}
                  disabled={isProcessing}
                  className="w-full py-3 relative overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 group"
                >
                  {isProcessing ? (
                     <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Analyzing...</span>
                     </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-indigo-200" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fillOpacity="0" />
                        <path fillRule="evenodd" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3M3.343 15.657l-.707.707m12.728 0l-.707-.707M13.657 3.343l.707.707M15.657 8.343l.707.707m-9.192 0l.707-.707" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Auto Detect (AI)</span>
                    </>
                  )}
                  {/* Shine effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10" />
                </button>
              </div>
            </section>

             {/* Settings */}
             <section className={!spriteData ? 'opacity-50 pointer-events-none' : ''}>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Animation</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-300">FPS: {settings.fps}</label>
                  <input 
                    type="range" 
                    min="1" max="60" 
                    value={settings.fps} 
                    onChange={(e) => setSettings({...settings, fps: parseInt(e.target.value)})}
                    className="w-24 accent-indigo-500 h-1.5 bg-slate-700 rounded-lg appearance-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-300">Scale: {settings.scale}x</label>
                  <input 
                    type="range" 
                    min="1" max="10" 
                    value={settings.scale} 
                    onChange={(e) => setSettings({...settings, scale: parseInt(e.target.value)})}
                    className="w-24 accent-indigo-500 h-1.5 bg-slate-700 rounded-lg appearance-none"
                  />
                </div>
              </div>
            </section>

            {/* Actions */}
             <section className={`mt-auto ${!spriteData || boxes.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                <button 
                  onClick={handleDownloadGif}
                  disabled={isProcessing}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? 'Processing...' : 'Download GIF'}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
             </section>
          </div>
        </aside>

        {/* Center: Canvas */}
        <main className="flex-1 flex flex-col relative bg-slate-950">
          {/* Toolbar */}
          <div className="h-12 border-b border-slate-800 bg-slate-900/50 flex items-center px-4 gap-4 justify-end">
             <div className="flex items-center gap-2">
               <button onClick={() => setZoom(Math.max(0.5, zoom - 0.5))} className="p-1.5 hover:bg-slate-800 rounded text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
               </button>
               <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
               <button onClick={() => setZoom(zoom + 0.5)} className="p-1.5 hover:bg-slate-800 rounded text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
               </button>
             </div>
          </div>
          
          {/* Workspace */}
          <div className="flex-1 overflow-hidden p-4">
            <EditorCanvas 
              data={spriteData} 
              boxes={boxes} 
              zoom={zoom}
              onBoxUpdate={setBoxes} // Placeholder for manual edit support
            />
          </div>

          {/* Error Toast */}
          {error && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-full shadow-xl backdrop-blur-sm animate-bounce">
              {error}
            </div>
          )}
        </main>

        {/* Right: Preview (Collapsible or Fixed Width) */}
        <aside className="w-64 bg-slate-900 border-l border-slate-800 p-6 overflow-y-auto hidden md:block z-10">
           <Preview data={spriteData} boxes={boxes} settings={settings} />
           
           <div className="mt-8">
             <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Stats</h4>
             <div className="text-xs text-slate-400 space-y-1 font-mono">
               <p>Sprites: <span className="text-slate-200">{boxes.length}</span></p>
               <p>Duration: <span className="text-slate-200">{(boxes.length * (1000/settings.fps) / 1000).toFixed(2)}s</span></p>
             </div>
           </div>
        </aside>
      </div>
    </div>
  );
};

export default App;