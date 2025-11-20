import React, { useState, useMemo, useEffect } from 'react';
import { DefinitionItem, MasteryLevel } from '../types';
import { expandDefinition } from '../services/geminiService';
import { MarkdownDisplay } from '../components/MarkdownDisplay';
import { Plus, Sparkles, Loader2, Star, BookMarked, Globe, Link, Lightbulb, Calendar, PenLine, Save, StickyNote } from 'lucide-react';

interface DefinitionsViewProps {
  items: DefinitionItem[];
  onAddItem: (item: DefinitionItem) => void;
  onUpdateItem: (id: string, updates: Partial<DefinitionItem>) => void;
  initialActiveId?: string | null;
}

export const DefinitionsView: React.FC<DefinitionsViewProps> = ({ items, onAddItem, onUpdateItem, initialActiveId }) => {
  const [term, setTerm] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('Analysis');
  const [chapter, setChapter] = useState('Sequences');
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
      if (initialActiveId) {
          setActiveId(initialActiveId);
      }
  }, [initialActiveId]);

  const handleAdd = async () => {
    if (!term.trim() || !content.trim()) return;

    const newId = Date.now().toString();
    const newDef: DefinitionItem = {
      id: newId,
      createdAt: Date.now(),
      term,
      subjectId: subject,
      chapterId: chapter,
      userContent: content,
      userNotes: null,
      aiContentEn: null,
      aiContentZh: null,
      funAnalogy: null,
      chapterConnection: null,
      uclImportance: 'Medium',
      relatedExtensions: null,
      flashcardSummary: null,
      mastery: 1,
      lastReviewed: Date.now(),
      isLoading: true,
    };

    onAddItem(newDef);
    setTerm('');
    setContent('');
    setActiveId(newId);
    setIsGenerating(true);

    try {
      const result = await expandDefinition(newDef.term, newDef.userContent, newDef.subjectId, newDef.chapterId);
      onUpdateItem(newId, {
        aiContentEn: result.ai_content_en,
        aiContentZh: result.ai_content_zh,
        funAnalogy: result.fun_analogy,
        chapterConnection: result.chapter_connection,
        uclImportance: result.ucl_importance,
        relatedExtensions: result.extensions,
        flashcardSummary: result.flashcard_summary,
        isLoading: false
      });
    } catch (e) {
      onUpdateItem(newId, { aiContentEn: "Error generating content.", isLoading: false });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateMastery = (id: string, level: MasteryLevel) => {
    onUpdateItem(id, { mastery: level, lastReviewed: Date.now() });
  };

  const groupedItems = useMemo(() => {
      const groups: Record<string, Record<string, DefinitionItem[]>> = {};
      
      items.forEach(item => {
          if (!groups[item.subjectId]) groups[item.subjectId] = {};
          if (!groups[item.subjectId][item.chapterId]) groups[item.subjectId][item.chapterId] = [];
          groups[item.subjectId][item.chapterId].push(item);
      });
      return groups;
  }, [items]);

  const activeDef = items.find(d => d.id === activeId);

  return (
    <div className="flex h-full bg-mist-50">
      {/* Left List & Controls */}
      <div className="w-96 border-r border-mist-200 flex flex-col bg-white z-10 shadow-lg">
        <div className="p-6 border-b border-mist-200 space-y-4 bg-mist-50/50">
          <div>
            <label className="text-xs font-bold text-paris-500 uppercase tracking-wider">Taxonomy</label>
            <div className="flex gap-2 mt-1">
                <input value={subject} onChange={e => setSubject(e.target.value)} className="w-1/2 bg-white border border-mist-200 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-paris-300 outline-none transition-all text-paris-800 placeholder-paris-400" placeholder="Subject" />
                <input value={chapter} onChange={e => setChapter(e.target.value)} className="w-1/2 bg-white border border-mist-200 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-paris-300 outline-none transition-all text-paris-800 placeholder-paris-400" placeholder="Chapter" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-mist-200 shadow-sm transition-all focus-within:ring-2 focus-within:ring-paris-300">
            <input
                type="text"
                placeholder="New Term (e.g. Radius of Convergence)"
                className="w-full bg-transparent border-b border-mist-100 px-1 py-2 text-paris-900 font-bold mb-2 focus:border-paris-300 outline-none placeholder-paris-300"
                value={term}
                onChange={e => setTerm(e.target.value)}
            />
            <textarea
                placeholder="Type definition (Markdown)..."
                className="w-full bg-mist-50/50 rounded px-3 py-2 text-paris-700 h-20 resize-none text-sm focus:outline-none focus:ring-1 focus:ring-paris-300 placeholder-paris-300"
                value={content}
                onChange={e => setContent(e.target.value)}
            />
            <button
                onClick={handleAdd}
                disabled={isGenerating || !term}
                className="w-full mt-3 bg-paris-300 hover:bg-paris-400 text-white text-sm font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md"
            >
                {isGenerating ? <Loader2 className="animate-spin w-3 h-3" /> : <Plus className="w-3 h-3" />}
                Expand & Analyze
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-mist-300">
          {Object.keys(groupedItems).length === 0 && <div className="text-center p-8 text-paris-300 text-sm italic">No definitions found.</div>}
          
          {Object.entries(groupedItems).map(([subjName, chapters]) => (
              <div key={subjName}>
                  <h2 className="text-xs font-black text-paris-400 uppercase tracking-widest mb-2 pl-1">{subjName}</h2>
                  {Object.entries(chapters).map(([chapName, chapterItems]) => (
                      <div key={chapName} className="mb-4">
                          <h3 className="text-sm font-bold text-paris-600 mb-2 pl-2 border-l-2 border-peach-400">{chapName}</h3>
                          <div className="space-y-2 pl-2">
                              {chapterItems.sort((a,b) => a.createdAt - b.createdAt).map((def, index) => (
                                <div
                                  key={def.id}
                                  onClick={() => setActiveId(def.id)}
                                  className={`p-3 rounded-lg cursor-pointer border transition-all group relative ${
                                    activeId === def.id 
                                      ? 'bg-peach-100 border-peach-400 shadow-md' 
                                      : 'bg-white border-mist-200 hover:border-paris-300 hover:shadow-sm'
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-bold text-paris-300 uppercase mb-0.5 block">
                                            Def {index + 1}
                                        </span>
                                        <h4 className={`font-bold text-sm ${activeId === def.id ? 'text-paris-900' : 'text-paris-700'}`}>{def.term}</h4>
                                        <div className="flex items-center gap-1 mt-1 text-[10px] text-paris-400">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(def.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full shadow-sm ${def.uclImportance === 'High' ? 'bg-rose-400' : def.uclImportance === 'Medium' ? 'bg-peach-400' : 'bg-mist-300'}`}></div>
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

      {/* Right Content */}
      <div className="flex-1 overflow-y-auto bg-mist-50">
        {activeDef ? (
          <div className="max-w-5xl mx-auto p-10">
            {/* Header Area */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-mist-200 mb-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-paris-300"></div>
                <div className="flex justify-between items-start pb-6 border-b border-mist-100 mb-6">
                    <div>
                        <span className="text-paris-400 text-xs font-bold uppercase tracking-wider mb-1 block flex items-center gap-2">
                            {activeDef.subjectId} <span className="text-mist-300">/</span> {activeDef.chapterId}
                        </span>
                        <h1 className="text-4xl font-serif font-bold text-paris-900 mb-3 tracking-tight">{activeDef.term}</h1>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                activeDef.uclImportance === 'High' ? 'border-rose-200 text-rose-600 bg-rose-50' : 
                                activeDef.uclImportance === 'Medium' ? 'border-peach-200 text-peach-600 bg-peach-100' :
                                'border-mist-300 text-paris-500 bg-mist-50'
                            }`}>
                                UCL Priority: {activeDef.uclImportance}
                            </span>
                            <span className="text-paris-400 text-xs">Added on {new Date(activeDef.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-4">
                        <button 
                           onClick={() => setIsEditing(!isEditing)}
                           className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${isEditing ? 'bg-paris-300 text-white shadow-md' : 'bg-mist-100 text-paris-600 hover:bg-mist-200'}`}
                        >
                            {isEditing ? <Save className="w-4 h-4" /> : <PenLine className="w-4 h-4" />}
                            {isEditing ? 'Done Editing' : 'Edit Content'}
                        </button>

                        <div className="flex flex-col items-end gap-2 bg-white p-3 rounded-lg border border-mist-200">
                            <span className="text-xs text-paris-500 font-bold uppercase">Mastery Level</span>
                            <div className="flex gap-1">
                                {[1,2,3,4,5].map((level) => (
                                    <button 
                                        key={level}
                                        onClick={() => updateMastery(activeDef.id, level as MasteryLevel)}
                                        className={`p-1 transition-all hover:scale-110 ${activeDef.mastery >= level ? 'text-peach-400 fill-peach-400' : 'text-mist-200'}`}
                                    >
                                        <Star className="w-5 h-5" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Input Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Original Note */}
                     <div className="opacity-90 hover:opacity-100 transition-opacity">
                         <h3 className="text-xs font-bold text-paris-400 uppercase mb-2">Original Definition</h3>
                         <div className={`bg-mist-50 p-4 rounded-lg border ${isEditing ? 'border-paris-300 ring-2 ring-paris-100' : 'border-mist-200'}`}>
                            {isEditing ? (
                                <textarea 
                                    className="w-full h-32 bg-transparent outline-none text-sm text-paris-700 resize-none"
                                    value={activeDef.userContent}
                                    onChange={(e) => onUpdateItem(activeDef.id, { userContent: e.target.value })}
                                />
                            ) : (
                                <MarkdownDisplay content={activeDef.userContent} className="text-sm text-paris-600" />
                            )}
                         </div>
                     </div>

                     {/* My Reflections */}
                     <div className="opacity-90 hover:opacity-100 transition-opacity">
                         <h3 className="text-xs font-bold text-peach-600 uppercase mb-2 flex items-center gap-2">
                            <StickyNote className="w-4 h-4" /> My Reflections
                         </h3>
                         <div className={`bg-peach-100/50 p-4 rounded-lg border ${isEditing ? 'border-paris-300 ring-2 ring-paris-100' : 'border-peach-200'} min-h-[160px]`}>
                             {isEditing ? (
                                <textarea 
                                    className="w-full h-32 bg-transparent outline-none text-sm text-paris-700 resize-none placeholder-paris-400"
                                    placeholder="Add your own thoughts, new insights, or lecture notes here..."
                                    value={activeDef.userNotes || ''}
                                    onChange={(e) => onUpdateItem(activeDef.id, { userNotes: e.target.value })}
                                />
                            ) : (
                                <div onClick={() => setIsEditing(true)} className="cursor-pointer h-full">
                                    {activeDef.userNotes ? (
                                        <MarkdownDisplay content={activeDef.userNotes} className="text-sm text-paris-700" />
                                    ) : (
                                        <span className="text-paris-400 text-sm italic">Click 'Edit' or here to add personal reflections...</span>
                                    )}
                                </div>
                            )}
                         </div>
                     </div>
                </div>
            </div>

            {activeDef.isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-paris-300">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="font-medium">Consulting UCL Mathematics Database...</p>
              </div>
            ) : (
              <div className="space-y-8 animate-fadeIn pb-20">
                 
                 {/* Core Definition (Bilingual) */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="bg-white p-6 rounded-xl border border-mist-200 shadow-sm hover:shadow-md transition-shadow relative">
                        <div className="flex items-center gap-2 mb-4 text-paris-500 border-b border-mist-100 pb-2">
                            <BookMarked className="w-5 h-5" />
                            <h3 className="font-bold font-serif">Rigorous Definition (EN)</h3>
                        </div>
                        <MarkdownDisplay content={activeDef.aiContentEn || ''} />
                     </div>
                     <div className="bg-white p-6 rounded-xl border border-mist-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-4 text-paris-500 border-b border-mist-100 pb-2">
                            <Globe className="w-5 h-5" />
                            <h3 className="font-bold font-serif">Translation (CN)</h3>
                        </div>
                        <MarkdownDisplay content={activeDef.aiContentZh || ''} />
                     </div>
                 </div>

                 {/* Fun Analogy & Chapter Connection */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-gradient-to-br from-mist-50 to-white p-6 rounded-xl border border-mist-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Sparkles className="w-24 h-24 text-peach-400" />
                        </div>
                        <div className="flex items-start gap-4 relative z-10">
                            <div className="bg-peach-100 p-3 rounded-full">
                                <Sparkles className="w-6 h-6 text-peach-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-paris-800 mb-2 font-serif">Intuitive Analogy</h3>
                                <div className="text-paris-700 italic leading-relaxed">
                                    "{activeDef.funAnalogy}"
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-mist-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 text-paris-700">
                            <Link className="w-5 h-5 text-paris-300" />
                            <h3 className="font-bold text-sm uppercase">Unified Chapter Link</h3>
                        </div>
                        <p className="text-paris-600 text-sm leading-relaxed border-l-2 border-paris-200 pl-3">
                            {activeDef.chapterConnection}
                        </p>
                    </div>
                 </div>

                 {/* Extensions */}
                 <div className="bg-white p-6 rounded-xl border border-mist-200">
                    <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-5 h-5 text-peach-400" />
                        <h3 className="text-sm font-bold text-paris-600 uppercase">Extensions & Pitfalls</h3>
                    </div>
                    <MarkdownDisplay content={activeDef.relatedExtensions || ''} className="text-paris-600 text-sm" />
                 </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-mist-400 bg-mist-50">
            <div className="text-center">
                <BookMarked className="w-16 h-16 mx-auto mb-4 opacity-30 text-paris-300" />
                <p>Select a term or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};