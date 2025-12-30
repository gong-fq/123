import React, { useState, useRef, useEffect } from 'react';
import { WordDefinition } from '../types';
import { generateAudio } from '../services/geminiService';

interface WordDisplayProps {
  data: WordDefinition;
}

const WordDisplay: React.FC<WordDisplayProps> = ({ data }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
    };
  }, [data]);

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const numChannels = 1;
    const sampleRate = 24000;
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const handleReadAloud = async () => {
    if (isPlaying) {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    setIsTtsLoading(true);
    // Constructing a natural reading string including the AI's explanation.
    const fullText = `Word: ${data.word}. Meaning: ${data.definition}. Chinese translation is ${data.chineseTranslation}. Here is the detailed explanation: ${data.grammarNotes}`;
    
    const base64Audio = await generateAudio(fullText);
    setIsTtsLoading(false);

    if (!base64Audio) {
      alert("Failed to generate voice. Please try again.");
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    try {
      const audioData = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(audioData, ctx);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      
      sourceNodeRef.current = source;
      source.start(0);
      setIsPlaying(true);
    } catch (err) {
      console.error("Audio Playback Error:", err);
      setIsPlaying(false);
    }
  };

  const playPronunciationOnly = () => {
    const utterance = new SpeechSynthesisUtterance(data.word);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-16">
      {/* Primary Card */}
      <div className={`bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden transition-all duration-500 ${isPlaying ? 'ring-4 ring-blue-100 shadow-xl' : ''}`}>
        {isPlaying && <div className="absolute top-0 left-0 h-2 bg-blue-500 w-full animate-shimmer"></div>}
        
        <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
          <div className="flex-1">
            <h2 className="text-5xl font-black text-slate-900 mb-3 tracking-tighter">{data.word}</h2>
            <div className="flex items-center gap-4">
              <span className="text-blue-600 font-mono text-xl font-semibold bg-blue-50 px-3 py-1 rounded-lg">{data.phonetic}</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-black uppercase tracking-widest border border-slate-200">
                {data.partOfSpeech}
              </span>
            </div>
          </div>
          <div className="flex gap-4">
             <button 
                onClick={playPronunciationOnly} 
                title="Word Pronunciation"
                className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-200 hover:text-slate-800 transition-all shadow-sm active:scale-90"
              >
                <i className="fa-solid fa-volume-high text-xl"></i>
            </button>
            <button 
              onClick={handleReadAloud} 
              disabled={isTtsLoading}
              title="Listen to Full Analysis"
              className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all shadow-2xl active:scale-95 ${
                isPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
              }`}
            >
              {isTtsLoading ? (
                <i className="fa-solid fa-spinner animate-spin text-3xl"></i>
              ) : (
                <i className={`fa-solid ${isPlaying ? 'fa-stop' : 'fa-play'} text-3xl`}></i>
              )}
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-8">
          <div className="mb-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Detailed Definition</h4>
            <p className="text-2xl text-slate-800 leading-tight font-bold">{data.definition}</p>
          </div>
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 cursor-default hover:bg-blue-700 transition-colors">
            <i className="fa-solid fa-globe text-blue-200 text-xl"></i>
            <span className="text-xl">{data.chineseTranslation}</span>
          </div>
        </div>
      </div>

      {/* Grammar Analysis */}
      <div className={`bg-white p-8 rounded-[2rem] shadow-sm border-l-[12px] border-l-blue-500 transition-all duration-500 ${isPlaying ? 'bg-blue-50/30' : 'bg-white'}`}>
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
          <i className="fa-solid fa-lightbulb-on text-blue-500"></i> AI MENTOR ANALYSIS (详解)
        </h3>
        <p className="text-slate-800 text-xl leading-relaxed whitespace-pre-wrap font-medium">
          {data.grammarNotes}
        </p>
      </div>

      {/* Examples */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
          <i className="fa-solid fa-messages text-blue-400"></i> SENTENCE CONTEXT (例句)
        </h3>
        <div className="space-y-8">
          {data.examples.map((ex, i) => (
            <div key={i} className="group pl-6 border-l-4 border-slate-200 hover:border-blue-500 transition-all py-1">
              <p className="text-slate-900 text-xl font-bold mb-3 group-hover:text-blue-900 transition-colors leading-snug">{ex.en}</p>
              <p className="text-slate-500 text-lg">{ex.cn}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Synonyms & Antonyms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all">
          <h4 className="text-[10px] font-black text-emerald-600 uppercase mb-5 tracking-[0.2em] flex items-center gap-3">
            <i className="fa-solid fa-layer-group text-xl"></i> SYNONYMS (同义)
          </h4>
          <div className="flex flex-wrap gap-3">
            {data.synonyms?.length ? data.synonyms.map(s => (
              <span key={s} className="px-4 py-2 bg-emerald-50 text-emerald-800 rounded-xl text-base font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors">
                {s}
              </span>
            )) : <span className="text-slate-300 italic">None found</span>}
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all">
          <h4 className="text-[10px] font-black text-rose-600 uppercase mb-5 tracking-[0.2em] flex items-center gap-3">
            <i className="fa-solid fa-split text-xl"></i> ANTONYMS (反义)
          </h4>
          <div className="flex flex-wrap gap-3">
            {data.antonyms?.length ? data.antonyms.map(a => (
              <span key={a} className="px-4 py-2 bg-rose-50 text-rose-800 rounded-xl text-base font-bold border border-rose-100 hover:bg-rose-100 transition-colors">
                {a}
              </span>
            )) : <span className="text-slate-300 italic">None found</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordDisplay;
