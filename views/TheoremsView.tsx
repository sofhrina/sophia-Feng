import React, { useState, useRef, useMemo, useEffect } from 'react';
import { TheoremItem, MasteryLevel } from '../types';
import { analyzeProof } from '../services/geminiService';
import { MarkdownDisplay } from '../components/MarkdownDisplay';
import { Camera, Upload, Eye, Check, Star, BookOpen, ArrowRight, Loader2, AlertCircle, Zap, Calendar, PenLine, Save } from 'lucide-react';

interface TheoremsViewProps {
  items: TheoremItem[];
  onAddItem: (item: TheoremItem) => void;
  onUpdateItem: (id: string, updates: Partial<TheoremItem>) => void;
  initialActiveId?: string | null;
}

export const TheoremsView: React.FC<TheoremsViewProps> = ({ items, onAddItem, onUpdateItem, initialActiveId }) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('Analysis');
  const [chapter, setChapter] = useState('Sequences');
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (initialActiveId) {
          setActiveId(initialActiveId);
      }
  }, [initialActiveId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!name || !content || !previewUrl) return;

    const newId = Date.now().toString();
    const newTheorem: TheoremItem = {
      id: newId,
      createdAt: Date.now(),
      subjectId: subject,
      chapterId: chapter,
      name,
      correctedName: null,
      content,
      userNotes: null,
      proofImage: previewUrl,
      proofSteps: null,
      logicMapping: null,
      concreteExample: null,
      flashcardSummary: null,
      uclImportance: 'Medium',
      mastery: 1,
      lastReviewed: Date.now(),
      isLoading: true
    };

    onAddItem(newTheorem);
    setActiveId(newId);
    
    // Reset form
    setName('');
    setContent('');
    setPreviewUrl(null);
    setIsAnalyzing(true);

    try {
      const result = await analyzeProof(newTheorem.name, newTheorem.content, newTheorem.proofImage!);
      onUpdateItem(newId, {
        proofSteps: result.proof_steps,
        logicMapping: result.logic_mapping,
        correctedName: result.corrected_name,
        concreteExample: result.concrete_example,
        flashcardSummary: result.flashcard_summary,
        uclImportance: result.ucl_importance,
        isLoading: false
      });
    } catch (error) {
      onUpdateItem(newId, { proofSteps: "Error analyzing.", isLoading: false });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateMastery = (id: string, level: MasteryLevel) => {
    onUpdateItem(id, { mastery: level, lastReviewed: Date.now() });
  };

  const groupedItems = useMemo(() => {
      const groups: Record<string, Record<string, TheoremItem[]>> = {};
      items.forEach(item => {
          if (!groups[item.subjectId]) groups[item.subjectId] = {};
          if (!groups[item.subjectId][item.chapterId]) groups[item.subjectId][item.chapterId] = [];
          groups[item.subjectId][item.chapterId].push(item);
      });
      return groups;
  }, [items]);

  const activeTheorem = items.find(t => t.id === activeId);

  return (
    <div className="flex h-full bg-mist-50">
      {/* Sidebar List */}
      <div className="w-80 border-r border-mist-200 flex flex-col bg-white shadow-lg z-10">
        <div className="p-4 border-b border-mist-200">
            <button 
                onClick={() => setActiveId(null)} 
                className="w-full bg-paris-300 hover:bg-paris-400 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
                <Camera className="w-4 h-4" /> Scan New Proof
            </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-mist-300">
            {Object.keys(groupedItems).length === 0 && <div className="text-center text-paris-300 text-sm italic mt-10">No theorems added yet.</div>}

            {Object.entries(groupedItems).map(([subjName, chapters]) => (
              <div key={subjName}>
                  <h2 className="text-xs font-black text-paris-400 uppercase tracking-widest mb-2 pl-1">{subjName}</h2>
                  {Object.entries(chapters).map(([chapName, chapterItems]) => (
                      <div key={chapName} className="mb-4">
                          <h3 className="text-sm font-bold text-paris-500 mb-2 pl-2 border-l-2 border-peach-400">{chapName}</h3>
                          <div className="space-y-2 pl-2">
                               {chapterItems.sort((a,b) => a.createdAt - b.createdAt).map(item => (
                                   <div 
                                        key={item.id}
                                        onClick={() => setActiveId(item.id)}
                                        className={`p-3 rounded-lg cursor-pointer transition-all border ${activeId === item.id ? 'bg-peach-100 border-peach-400 shadow-sm' : 'bg-white border-transparent hover:bg-mist-50 hover:border-mist-200'}`}
                                    >
                                        <div className={`font-bold text-sm truncate ${activeId === item.id ? 'text-paris-900' : 'text-paris-700'}`}>
                                        {item.correctedName || item.name}
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex gap-0.5">
                                                {[1,2,3,4,5].map(s => (
                                                    <div key={s} className={`w-1 h-1 rounded-full ${s <= item.mastery ? 'bg-peach-400' : 'bg-mist-300'}`} />
                                                ))}
                                            </div>
                                            <div className={`w-2 h-2 rounded-full ${item.uclImportance === 'High' ? 'bg-rose-400' : 'bg-paris-300'}`} title={`Importance: ${item.uclImportance}`} />
                                        </div>
                                    </div>
                               ))}
                          </div>
                      </div>
                  ))}
              </div>
            ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-mist-50">
        {!activeTheorem ? (
            // Input Form
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-2xl mx-auto bg-white p-10 rounded-2xl border border-mist-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-paris-900 mb-6 flex items-center gap-2 font-serif">
                        <Upload className="w-6 h-6 text-paris-300" />
                        Add & Analyze Theorem
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <input value={subject} onChange={e => setSubject(e.target.value)} className="bg-mist-50 border border-mist-200 rounded-lg p-3 text-paris-700 focus:ring-2 focus:ring-paris-300 outline-none transition-all" placeholder="Subject" />
                        <input value={chapter} onChange={e => setChapter(e.target.value)} className="bg-mist-50 border border-mist-200 rounded-lg p-3 text-paris-700 focus:ring-2 focus:ring-paris-300 outline-none transition-all" placeholder="Chapter" />
                    </div>
                    
                    <input 
                        value={name} onChange={e => setName(e.target.value)} 
                        className="w-full bg-mist-50 border border-mist-200 rounded-lg p-3 text-paris-700 font-bold mb-4 focus:ring-2 focus:ring-paris-300 outline-none transition-all" 
                        placeholder="Theorem Name (e.g. Mean Value Theorem)" 
                    />
                    
                    <textarea 
                        value={content} onChange={e => setContent(e.target.value)} 
                        className="w-full bg-mist-50 border border-mist-200 rounded-lg p-3 text-paris-700 h-32 resize-none mb-6 focus:ring-2 focus:ring-paris-300 outline-none transition-all" 
                        placeholder="Theorem Statement (LaTeX supported)..." 
                    />

                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-mist-300 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-paris-300 hover:bg-mist-50 transition-all mb-6 bg-white"
                    >
                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="h-full object-contain rounded-lg" />
                        ) : (
                            <div className="text-center">
                                <Camera className="w-10 h-10 text-mist-400 mx-auto mb-3" />
                                <span className="text-paris-500 font-medium">Upload Proof Photo</span>
                                <p className="text-xs text-paris-400 mt-1">We'll digitize and analyze the steps</p>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>

                    <button 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !name || !previewUrl}
                        className="w-full bg-paris-300 hover:bg-paris-400 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold shadow-md transition-all flex justify-center items-center gap-2"
                    >
                        {isAnalyzing ? <Loader2 className="animate-spin" /> : "Analyze Proof"}
                    </button>
                </div>
            </div>
        ) : (
            // View Mode (Split View)
            <div className="flex-1 flex flex-col h-full">
                {/* Toolbar */}
                <div className="h-20 bg-white border-b border-mist-200 flex items-center justify-between px-8 shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <div>
                           <h2 className="text-2xl font-bold text-paris-900 font-serif">
                                {activeTheorem.correctedName || activeTheorem.name}
                           </h2>
                           <div className="flex items-center gap-3 text-xs text-paris-400 mt-1">
                               <span>{activeTheorem.subjectId} / {activeTheorem.chapterId}</span>
                               <span>•</span>
                               <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(activeTheorem.createdAt).toLocaleDateString()}</span>
                           </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                         <button 
                           onClick={() => setIsEditing(!isEditing)}
                           className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isEditing ? 'bg-paris-300 text-white' : 'bg-mist-100 text-paris-600 hover:bg-mist-200'}`}
                        >
                            {isEditing ? <Save className="w-3 h-3" /> : <PenLine className="w-3 h-3" />}
                        </button>
                         <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                activeTheorem.uclImportance === 'High' ? 'border-rose-200 text-rose-600 bg-rose-50' : 
                                activeTheorem.uclImportance === 'Medium' ? 'border-peach-200 text-peach-600 bg-peach-100' :
                                'border-mist-300 text-paris-600 bg-mist-50'
                            }`}>
                                UCL: {activeTheorem.uclImportance}
                        </div>
                        <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-mist-200">
                            <span className="text-xs text-paris-500 font-bold uppercase mr-2">Mastery</span>
                            {[1,2,3,4,5].map((level) => (
                                <button key={level} onClick={() => updateMastery(activeTheorem.id, level as MasteryLevel)}>
                                    <Star className={`w-5 h-5 transition-transform hover:scale-110 ${activeTheorem.mastery >= level ? 'text-peach-400 fill-peach-400' : 'text-mist-200'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Split */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Theorem & Statement */}
                    <div className="w-5/12 border-r border-mist-200 bg-white p-8 overflow-y-auto">
                        
                        <div className="bg-white p-6 rounded-xl border-2 border-peach-200 shadow-sm mb-6">
                            <h3 className="text-xs font-bold text-peach-600 uppercase mb-3 tracking-wider">Theorem Statement</h3>
                            {isEditing ? (
                                <textarea 
                                    className="w-full h-32 bg-mist-50 p-2 rounded border border-paris-300 focus:ring-2 focus:ring-paris-300 outline-none text-sm text-paris-800"
                                    value={activeTheorem.content}
                                    onChange={(e) => onUpdateItem(activeTheorem.id, { content: e.target.value })}
                                />
                            ) : (
                                <MarkdownDisplay content={activeTheorem.content} />
                            )}
                        </div>

                        {activeTheorem.concreteExample && (
                            <div className="bg-mist-50 p-5 rounded-xl border border-mist-200 mb-6">
                                <h3 className="text-xs font-bold text-paris-500 uppercase mb-2 flex items-center gap-2">
                                    <Zap className="w-4 h-4" /> Concrete Example
                                </h3>
                                <MarkdownDisplay content={activeTheorem.concreteExample} className="text-sm text-paris-700" />
                            </div>
                        )}

                        {activeTheorem.proofImage && (
                            <div className="mt-6">
                                <h3 className="text-xs font-bold text-paris-400 uppercase mb-3">Original Source</h3>
                                <div className="relative group">
                                    <img src={activeTheorem.proofImage} className="w-full rounded-lg border border-mist-200 shadow-sm transition-opacity opacity-80 group-hover:opacity-100" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none">
                                        <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">Original Photo</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Proof Analysis */}
                    <div className="w-7/12 bg-mist-50/50 overflow-y-auto relative">
                        {activeTheorem.isLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-paris-400 bg-white/80 z-20">
                                <Loader2 className="w-10 h-10 animate-spin mb-2 text-paris-300" />
                                <p className="font-medium text-paris-600">Digitizing proof logic...</p>
                            </div>
                        ) : (
                            <div className="flex min-h-full">
                                {/* Proof Steps */}
                                <div className="flex-1 p-8">
                                    <h3 className="text-sm font-bold text-paris-600 uppercase mb-6 flex items-center gap-2 pb-4 border-b border-mist-200">
                                        <BookOpen className="w-5 h-5" /> Step-by-Step Proof
                                    </h3>
                                    <MarkdownDisplay content={activeTheorem.proofSteps || ''} className="text-paris-800" />
                                </div>
                                
                                {/* Logic Mapping Sidebar */}
                                <div className="w-72 border-l border-mist-200 bg-white p-6 text-sm sticky top-0 h-fit">
                                    <h3 className="text-xs font-bold text-peach-500 uppercase mb-4 flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4" /> Logical Flow
                                    </h3>
                                    <div className="text-paris-600 leading-relaxed">
                                        <p className="text-xs text-paris-400 mb-4 italic">
                                            Matches steps on the left. Shows dependencies.
                                        </p>
                                        <MarkdownDisplay content={activeTheorem.logicMapping || ''} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};