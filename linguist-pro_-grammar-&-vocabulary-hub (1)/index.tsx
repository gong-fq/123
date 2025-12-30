import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- Types ---
interface WordDefinition {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  chineseTranslation: string;
  examples: Array<{ en: string; cn: string }>;
  synonyms: string[];
  antonyms: string[];
  grammarNotes: string;
}

interface HistoryItem {
  word: string;
  timestamp: number;
}

// --- AI Service ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

async function lookupWord(word: string): Promise<WordDefinition> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Look up the English word or phrase: "${word}". Provide detailed linguistics, grammar notes, and Chinese translations.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          phonetic: { type: Type.STRING, description: "IPA pronunciation" },
          partOfSpeech: { type: Type.STRING },
          definition: { type: Type.STRING, description: "Clear English definition" },
          chineseTranslation: { type: Type.STRING, description: "Accurate Chinese equivalent" },
          examples: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                en: { type: Type.STRING },
                cn: { type: Type.STRING }
              },
              required: ["en", "cn"]
            }
          },
          synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
          antonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
          grammarNotes: { type: Type.STRING, description: "Detailed grammar usage rules" }
        },
        required: ["word", "phonetic", "partOfSpeech", "definition", "chineseTranslation", "examples", "grammarNotes"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    throw new Error("Invalid response format");
  }
}

// --- Components ---
const Sidebar = ({ isOpen, onToggle, side, title, children }: any) => {
  const isLeft = side === 'left';
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={onToggle} />
      )}
      <div className={`fixed top-0 bottom-0 z-50 bg-white shadow-xl transition-all duration-300 ease-in-out border-slate-200
          ${isLeft ? 'left-0 border-r' : 'right-0 border-l'}
          ${isOpen ? 'w-72' : 'w-0'} overflow-hidden`}>
        <div className="flex flex-col h-full w-72">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-700 uppercase tracking-wider text-xs">{title}</h2>
            <button onClick={onToggle} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
              <i className={`fa-solid ${isLeft ? 'fa-angles-left' : 'fa-angles-right'}`}></i>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">{children}</div>
        </div>
      </div>
      {!isOpen && (
        <button onClick={onToggle} className={`fixed top-1/2 -translate-y-1/2 z-50 p-3 bg-white border border-slate-200 shadow-md rounded-full text-blue-600 hover:bg-blue-50 transition-all ${isLeft ? 'left-4' : 'right-4'}`}>
          <i className={`fa-solid ${isLeft ? 'fa-history' : 'fa-link'}`}></i>
        </button>
      )}
    </>
  );
};

const WordDisplay = ({ data }: { data: WordDefinition }) => {
  const playAudio = () => {
    const utterance = new SpeechSynthesisUtterance(data.word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-4xl font-bold text-slate-800 mb-1">{data.word}</h2>
            <div className="flex items-center gap-3">
              <span className="text-blue-600 font-mono font-medium">{data.phonetic}</span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase italic">{data.partOfSpeech}</span>
            </div>
          </div>
          <button onClick={playAudio} className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">
            <i className="fa-solid fa-volume-high text-lg"></i>
          </button>
        </div>
        <div className="border-t border-slate-50 pt-6">
          <p className="text-lg text-slate-700 leading-relaxed mb-4">{data.definition}</p>
          <div className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-md shadow-blue-200">{data.chineseTranslation}</div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <i className="fa-solid fa-book text-blue-400"></i> Grammar Notes
        </h3>
        <p className="text-slate-600 leading-relaxed italic whitespace-pre-wrap">{data.grammarNotes}</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <i className="fa-solid fa-quote-left text-blue-400"></i> Contextual Examples
        </h3>
        <div className="space-y-6">
          {data.examples.map((ex, i) => (
            <div key={i} className="group pl-4 border-l-4 border-blue-100 hover:border-blue-400 transition-colors">
              <p className="text-slate-800 font-medium mb-1">{ex.en}</p>
              <p className="text-slate-500 text-sm">{ex.cn}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-[10px] font-bold text-emerald-600 uppercase mb-4 flex items-center gap-2"><i className="fa-solid fa-equals"></i> Synonyms</h4>
          <div className="flex flex-wrap gap-2">
            {data.synonyms?.length ? data.synonyms.map(s => <span key={s} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100">{s}</span>) : <span className="text-slate-300 italic text-xs">None</span>}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-[10px] font-bold text-rose-600 uppercase mb-4 flex items-center gap-2"><i className="fa-solid fa-not-equal"></i> Antonyms</h4>
          <div className="flex flex-wrap gap-2">
            {data.antonyms?.length ? data.antonyms.map(a => <span key={a} className="px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-medium border border-rose-100">{a}</span>) : <span className="text-slate-300 italic text-xs">None</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

const EXTERNAL_SOURCES = [
  { name: 'Merriam-Webster', url: 'https://www.merriam-webster.com/dictionary/', icon: 'fa-book-open' },
  { name: 'Oxford Learner\'s', url: 'https://www.oxfordlearnersdictionaries.com/definition/english/', icon: 'fa-graduation-cap' },
  { name: 'Cambridge Dictionary', url: 'https://dictionary.cambridge.org/dictionary/english/', icon: 'fa-language' },
  { name: 'Collins Dictionary', url: 'https://www.collinsdictionary.com/dictionary/english/', icon: 'fa-spell-check' },
  { name: 'Etymonline', url: 'https://www.etymonline.com/word/', icon: 'fa-history' },
];

// --- Main App ---
const App = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WordDefinition | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [leftOpen, setLeftOpen] = useState(window.innerWidth > 1024);
  const [rightOpen, setRightOpen] = useState(window.innerWidth > 1024);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('linguist_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await lookupWord(query);
      setResult(data);
      const updatedHistory = [{ word: data.word, timestamp: Date.now() }, ...history.filter(h => h.word !== data.word)].slice(0, 50);
      setHistory(updatedHistory);
      localStorage.setItem('linguist_history', JSON.stringify(updatedHistory));
    } catch (error) {
      alert('Failed to analyze word. Check your network or try again.');
    } finally {
      setLoading(false);
    }
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
    };
    recognition.start();
  };

  return (
    <div className="min-h-screen flex bg-slate-50 transition-all duration-300">
      <Sidebar isOpen={leftOpen} onToggle={() => setLeftOpen(!leftOpen)} side="left" title="History">
        {history.length === 0 ? <p className="text-slate-400 text-xs italic py-4">No history yet.</p> : history.map((item) => (
          <button key={item.timestamp} onClick={() => { setQuery(item.word); }} className="w-full text-left p-3 hover:bg-blue-50 rounded-lg transition-colors group flex items-center justify-between">
            <span className="font-medium text-slate-700 text-sm">{item.word}</span>
            <i className="fa-solid fa-chevron-right text-[10px] text-slate-300 group-hover:text-blue-400"></i>
          </button>
        ))}
      </Sidebar>

      <main className={`flex-1 flex flex-col transition-all duration-300 ${leftOpen ? 'lg:ml-72' : ''} ${rightOpen ? 'lg:mr-72' : ''}`}>
        <div className="max-w-3xl mx-auto w-full px-4 pt-12 pb-24">
          <header className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-blue-600 mb-2 tracking-tight">Linguist Pro</h1>
            <p className="text-slate-400 text-sm">Advanced English Learning Platform</p>
          </header>

          <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-6 mb-8 border border-slate-100">
            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter English word or phrase..."
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl outline-none transition-all text-lg font-medium"
                />
                <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <button type="button" onClick={startVoiceSearch} className={`absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-slate-200 text-slate-400'}`}>
                  <i className="fa-solid fa-microphone"></i>
                </button>
              </div>
              <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <><i className="fa-solid fa-bolt"></i> SEARCH</>}
              </button>
            </form>
          </div>

          {result ? <WordDisplay data={result} /> : !loading && (
            <div className="text-center py-20 px-4 opacity-50">
              <i className="fa-solid fa-magnifying-glass text-blue-300 text-5xl mb-6"></i>
              <p className="text-slate-500">Master usage, grammar, and pronunciation instantly.</p>
            </div>
          )}
        </div>
      </main>

      <Sidebar isOpen={rightOpen} onToggle={() => setRightOpen(!rightOpen)} side="right" title="Resources">
        <div className="space-y-4">
          {EXTERNAL_SOURCES.map((source) => (
            <a key={source.name} href={`${source.url}${result?.word || query || ''}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all group">
              <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center group-hover:bg-blue-100">
                <i className={`fa-solid ${source.icon} text-xs`}></i>
              </div>
              <span className="font-medium text-xs">{source.name}</span>
              <i className="fa-solid fa-arrow-up-right-from-square text-[8px] ml-auto opacity-20"></i>
            </a>
          ))}
        </div>
      </Sidebar>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}