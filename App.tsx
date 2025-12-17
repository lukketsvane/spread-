import React, { useState, useCallback, useMemo } from 'react';
import { parse } from 'marked';
import { Spread } from './types';
import { generateIllustrationForText } from './services/geminiService';
import { SpreadEditor } from './components/SpreadEditor';

// Helper to chunk text into "spreads"
const createSpreadsFromText = (fullText: string): Spread[] => {
  // Split by double newlines to find paragraphs
  const paragraphs = fullText.split(/\n\s*\n/);
  const spreads: Spread[] = [];
  
  let currentChunk = '';
  let spreadIndex = 1;

  // Simple logic: Combine paragraphs until we have roughly 600-1000 chars per spread
  for (const para of paragraphs) {
    if ((currentChunk.length + para.length) > 800) {
        if (currentChunk.trim()) {
            spreads.push({
                id: crypto.randomUUID(),
                pageNumber: spreadIndex++,
                textContent: currentChunk.trim(),
                status: 'idle'
            });
        }
        currentChunk = para + '\n\n';
    } else {
        currentChunk += para + '\n\n';
    }
  }

  // Push remainder
  if (currentChunk.trim()) {
      spreads.push({
          id: crypto.randomUUID(),
          pageNumber: spreadIndex++,
          textContent: currentChunk.trim(),
          status: 'idle'
      });
  }

  return spreads;
};

const DEFAULT_TEXT = `# Tidens Asynkroni: En Kronikk

Metoden for å reflektere over litteraturens kjennetegn er en tidsbasert kunst innen litteraturvitenskapen. Vi forstår ikke bare introduksjonen av tidspoetikk i opposisjon til spørsmålet om en historisk poetikk på den ene siden og målene for litteraturhistorie på den andre.

Vi ser det også som en refleksjon av konsekvensene som oppstår fra litteratur som en tidsbasert kunst. Litteraturhistorie plasserer bare romaner innenfor en kronologi. I motsetning til dette forankrer historisk poetikk litterære verk på to måter - i en historie av hendelser og i en historie av struktur.

Litterære kunstverk er dermed like mye singulære hendelser som de er agenter for en sjangerhistorie som strekker seg langt utover verket. I motsetning til dette minner tidspoetikk oss om at litteratur verken smelter fullstendig og rent inn i en kronologisk litteraturhistorie eller inn i en progresjon av sjangeren.

Tidspoetikk undersøker dermed potensialet i det litterære språket (tidsform) til å forme tid. Fra dette perspektivet kan den fortidige romanen fra altermodernismen fortsette fra tradisjonell fortelling uten å falle tilbake bak prestasjonene til den moderne nåtiden.`;

// Updated style prompt to match the "strek tegninger" / diagrammatic style
const STYLE_PROMPT = "Philosophical diagram style, hand-drawn black ink sketches, abstract figures, arrows and circles, minimalism, conceptual schematics, white background, shaky lines, intellectual aesthetic.";

const App: React.FC = () => {
  const [inputText, setInputText] = useState(DEFAULT_TEXT);
  const [spreads, setSpreads] = useState<Spread[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'input' | 'preview'>('input');

  // Memoize rendered markdown to prevent unnecessary re-renders
  const previewHtml = useMemo(() => {
    try {
        return parse(inputText) as string;
    } catch (e) {
        return '';
    }
  }, [inputText]);

  const processSpreads = () => {
    if (!inputText.trim()) return;
    
    const newSpreads = createSpreadsFromText(inputText);
    setSpreads(newSpreads);
    setViewMode('preview');
    generateImagesSequentially(newSpreads);
  };

  const generateImagesSequentially = async (initialSpreads: Spread[]) => {
    setIsProcessing(true);
    
    // Create a working copy of ids to process
    const spreadIds = initialSpreads.map(s => s.id);

    // Process one by one to avoid rate limits and provide steady feedback
    for (const id of spreadIds) {
      // Find current spread content
      const currentSpread = initialSpreads.find(s => s.id === id);
      if (!currentSpread) continue;

      // Set status to loading
      setSpreads(prev => prev.map(s => s.id === id ? { ...s, status: 'generating' } : s));

      try {
        const imageUrl = await generateIllustrationForText(currentSpread.textContent, STYLE_PROMPT);
        
        // Update success
        setSpreads(prev => prev.map(s => s.id === id ? { ...s, status: 'success', imageUrl } : s));
      } catch (err) {
        // Update error
        setSpreads(prev => prev.map(s => s.id === id ? { ...s, status: 'error', error: (err as Error).message } : s));
      }
    }

    setIsProcessing(false);
  };

  const retryGeneration = async (id: string) => {
     const spread = spreads.find(s => s.id === id);
     if (!spread) return;

     setSpreads(prev => prev.map(s => s.id === id ? { ...s, status: 'generating', error: undefined } : s));

     try {
        const imageUrl = await generateIllustrationForText(spread.textContent, STYLE_PROMPT);
        setSpreads(prev => prev.map(s => s.id === id ? { ...s, status: 'success', imageUrl } : s));
      } catch (err) {
        setSpreads(prev => prev.map(s => s.id === id ? { ...s, status: 'error', error: (err as Error).message } : s));
      }
  };

  return (
    <div className="min-h-screen font-sans text-gray-800 pb-20">
      
      {/* Header */}
      <header className="bg-paper border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-2xl">✍️</span>
                <h1 className="font-serif text-xl font-bold tracking-tight">Chronicle Illustrator</h1>
            </div>
            
            <div className="flex gap-4">
                {viewMode === 'preview' && (
                    <button 
                        onClick={() => setViewMode('input')}
                        className="text-sm font-semibold text-gray-500 hover:text-ink"
                    >
                        Edit Text
                    </button>
                )}
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-8">
        
        {viewMode === 'input' ? (
            <div className="animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
                    {/* Left Column: Markdown Input */}
                    <div className="flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center text-xs text-gray-500 font-mono">
                            <span>MARKDOWN SOURCE</span>
                        </div>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="flex-1 p-6 focus:outline-none resize-none font-mono text-sm leading-relaxed text-gray-700 bg-transparent w-full"
                            placeholder="# Enter your chronicle here..."
                        />
                    </div>

                    {/* Right Column: Preview */}
                    <div className="flex flex-col bg-paper rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
                         <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center text-xs text-gray-500 font-mono z-10">
                            <span>PREVIEW</span>
                            <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded-full">WYSIWYG</span>
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto">
                            <article 
                                className="prose prose-lg font-serif text-ink prose-headings:font-serif prose-headings:font-bold prose-p:leading-relaxed max-w-none"
                                dangerouslySetInnerHTML={{ __html: previewHtml }}
                            />
                        </div>
                        {/* Overlay gradient at bottom to suggest scrolling */}
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-paper to-transparent pointer-events-none"></div>
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <button
                        onClick={processSpreads}
                        disabled={!inputText.trim()}
                        className="group relative inline-flex items-center justify-center px-8 py-3 font-semibold text-white transition-all duration-200 bg-ink rounded-full hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="mr-2">Generate Spreads</span>
                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </button>
                </div>
            </div>
        ) : (
            <div className="animate-fade-in">
                <div className="flex justify-between items-end mb-8 border-b border-gray-300 pb-4">
                     <div>
                        <h2 className="text-3xl font-serif italic text-ink">Visual Draft</h2>
                        <p className="text-gray-500 mt-1">
                            {spreads.length} Spreads • Style: Nano Banana Pro (Sketch)
                        </p>
                     </div>
                     {isProcessing && (
                         <div className="flex items-center gap-2 text-sm text-ink bg-yellow-100 px-3 py-1 rounded-full">
                             <span className="animate-spin">⏳</span>
                             Generating illustrations...
                         </div>
                     )}
                </div>

                <div className="space-y-8">
                    {spreads.map((spread) => (
                        <SpreadEditor 
                            key={spread.id} 
                            spread={spread} 
                            onRetry={retryGeneration}
                        />
                    ))}
                </div>

                <div className="h-32 flex items-center justify-center text-gray-400">
                    <span className="font-hand text-xl opacity-50">End of Chronicle</span>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default App;