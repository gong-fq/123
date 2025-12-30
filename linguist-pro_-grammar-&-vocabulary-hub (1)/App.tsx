import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import WordDisplay from './components/WordDisplay';
import { lookupWord } from './services/geminiService';
import { WordDefinition, HistoryItem, ExternalSource } from './types';

const EXTERNAL_SOURCES: ExternalSource[] = [
  { name: 'Merriam-Webster', url: 'https://www.merriam-webster.com/dictionary/', icon: 'fa-book-open' },
  { name: 'Oxford Learner\'s', url: 'https://www.oxfordlearnersdictionaries.com/definition/english/', icon: 'fa-graduation-cap' },
  { name: 'Cambridge Dictionary', url: 'https://dictionary.cambridge.org/dictionary/english/', icon: 'fa-language' },
  { name: 'Collins Dictionary', url: 'https://www.collinsdictionary.com/dictionary/english/', icon: 'fa-spell-check' },
  { name: 'Etymonline', url: 'https://www.etymonline.com/word/', icon: 'fa-history' },
];

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WordDefinition | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [leftOpen, setLeftOpen] = useState(window.innerWidth > 1024);
  const [rightOpen, setRightOpen] = useState(window.innerWidth > 1024);
  const [isListening, setIsListening] = useState(false);
  const [transcriptFeedback, setTranscriptFeedback] = useState('');
  const [searchMode, setSearchMode] = useState<'EN' | 'CN'>('EN');
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('linguist_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const addToHistory = (word: string) => {
    const newItem = { word, timestamp: Date.now() };
    const updated = [newItem, ...history.filter(h => h.word !== word)].slice(0, 50);
    setHistory(updated);
    localStorage.setItem('linguist_history', JSON.stringify(updated));
  };

  const performSearch = useCallback(async (searchQuery: string, mode: 'EN' | 'CN') => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setLoading(true);
    setTranscriptFeedback('');
    try {
      const data = await lookupWord(trimmed, mode);
      setResult(data);
      addToHistory(data.word);
      setQuery(data.word); 
    } catch (error) {
      console.error(error);
      alert('Search failed. The AI might be busy or the query was unclear.');
    } finally {
      setLoading(false);
    }
  }, [history]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query, searchMode);
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = searchMode === 'EN' ? 'en-US' : 'zh-CN';
    recognition.interimResults = true; // Show interim for feedback
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      setIsListening(true);
      setTranscriptFeedback('Listening...');
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      setTranscriptFeedback(`Error: ${event.error}`);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
        
      setTranscriptFeedback(transcript);

      if (event.results[0].isFinal) {
        setQuery(transcript);
        performSearch(transcript, searchMode);
      }
    };
    
    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="min-h-screen flex bg-slate-50 transition-all duration-300 font-sans selection:bg-blue-100">
      <Sidebar isOpen={leftOpen} onToggle={() => setLeftOpen(!leftOpen)} side="left" title="Study History">
        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="text-center py-10 opacity-30">
              <i className="fa-solid fa-clock-rotate-left text-3xl mb-2"></i>
              <p className="text-xs italic">Empty history</p>
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.timestamp}
                onClick={() => { performSearch(item.word, 'EN'); }}
                className="w-full text-left p-3 hover:bg-blue-50 rounded-xl transition-all group flex items-center justify-between border border-transparent hover:border-blue-100"
              >
                <span className="font-semibold text-slate-700 text-sm truncate pr-2">{item.word}</span>
                <i className="fa-solid fa-arrow-right text-[10px] text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-transform"></i>
              </button>
            ))
          )}
        </div>
      </Sidebar>

      <main className={`flex-1 flex flex-col transition-all duration-300 ${leftOpen ? 'lg:ml-72' : ''} ${rightOpen ? 'lg:mr-72' : ''}`}>
        <div className="max-w-3xl mx-auto w-full px-4 pt-16 pb-24">
          <header className="text-center mb-12">
            <div className="inline-block p-3 bg-blue-600 rounded-2xl shadow-2xl shadow-blue-200 mb-5">
              <i className="fa-solid fa-brain-circuit text-white text-3xl"></i>
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Linguist Pro</h1>
            <p className="text-slate-500 font-medium tracking-wide">AI-Powered Bilingual English Mastery</p>
          </header>

          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 p-8 mb-10 border border-slate-100 relative">
            <div className="flex justify-center mb-8">
              <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 border border-slate-200/50 shadow-inner w-full max-w-sm">
                <button 
                  onClick={() => setSearchMode('EN')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${searchMode === 'EN' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <i className="fa-solid fa-font"></i>
                  EN Mode
                </button>
                <button 
                  onClick={() => setSearchMode('CN')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${searchMode === 'CN' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <i className="fa-solid fa-language"></i>
                  中文查词
                </button>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
              <div className="relative group">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchMode === 'EN' ? "Explore an English term..." : "输入中文，获取地道英语解析..."}
                  className="w-full pl-14 pr-16 py-5 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-lg font-medium shadow-inner"
                />
                <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 text-xl transition-colors"></i>
                <button
                  type="button"
                  onClick={startVoiceSearch}
                  title="Voice Search"
                  className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-md ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-slate-400 hover:text-blue-600'
                  }`}
                >
                  <i className="fa-solid fa-microphone-lines text-xl"></i>
                </button>
              </div>

              {transcriptFeedback && (
                <div className="px-5 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg flex items-center gap-2 animate-pulse">
                  <i className="fa-solid fa-ear-listen text-xs"></i>
                  {transcriptFeedback}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
              >
                {loading ? (
                  <i className="fa-solid fa-circle-notch animate-spin text-2xl"></i>
                ) : (
                  <>
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    {searchMode === 'EN' ? 'ANALYZE WORD' : '开始智能翻译'}
                  </>
                )}
              </button>
            </form>
          </div>

          {result && <WordDisplay data={result} />}
          {!result && !loading && (
            <div className="text-center py-24 px-4 bg-slate-100/50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-blue-100">
                <i className="fa-solid fa-graduation-cap text-4xl"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to Master English?</h3>
              <p className="text-slate-400 max-w-sm mx-auto">
                {searchMode === 'EN' ? 'Type or speak an English term to see deep grammar insights.' : '输入中文或点击语音，AI将为您匹配地道的英文解析。'}
              </p>
            </div>
          )}
        </div>
      </main>

      <Sidebar isOpen={rightOpen} onToggle={() => setRightOpen(!rightOpen)} side="right" title="Dictionary Links">
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest px-2">External Portals</p>
          <div className="space-y-2">
            {EXTERNAL_SOURCES.map((source) => (
              <a
                key={source.name}
                href={`${source.url}${result?.word || query || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 text-slate-600 hover:text-blue-600 hover:bg-white hover:shadow-lg rounded-2xl transition-all group border border-transparent hover:border-blue-100"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-blue-50">
                  <i className={`fa-solid ${source.icon} text-base`}></i>
                </div>
                <span className="font-bold text-sm">{source.name}</span>
                <i className="fa-solid fa-arrow-up-right-from-square text-[10px] ml-auto opacity-0 group-hover:opacity-100 transition-opacity"></i>
              </a>
            ))}
          </div>
          
          <div className="mt-10 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-blue-100 shadow-inner">
            <h4 className="text-blue-900 font-black text-xs mb-3 flex items-center gap-2">
              <i className="fa-solid fa-headphones-simple"></i>
              AUDIO MASTER
            </h4>
            <p className="text-xs text-blue-800/80 leading-relaxed font-medium">
              Use the <strong className="text-blue-600">Play</strong> button on any result to hear the full AI teacher's explanation read aloud.
            </p>
          </div>
        </div>
      </Sidebar>
    </div>
  );
};

export default App;
