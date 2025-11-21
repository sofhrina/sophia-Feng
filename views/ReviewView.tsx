import React, { useState } from 'react';
import { DefinitionItem, TheoremItem, ProblemItem, Section } from '../types';
import { AlertTriangle, Repeat, Layers, BookOpen, Scale, Calendar, ArrowUpRight, ArrowRight } from 'lucide-react';
import { MarkdownDisplay } from '../components/MarkdownDisplay';

interface ReviewViewProps {
  definitions: DefinitionItem[];
  theorems: TheoremItem[];
  problems: ProblemItem[];
  onNavigateToItem: (section: Section, id: string) => void;
}

export const ReviewView: React.FC<ReviewViewProps> = ({ definitions, theorems, problems, onNavigateToItem }) => {
  const [activeTab, setActiveTab] = useState<'definitions' | 'theorems' | 'mistakes'>('definitions');
  
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleFlip = (id: string) => {
      setFlippedCards(prev => ({
          ...prev,
          [id]: !prev[id]
      }));
  };

  const weakDefinitions = definitions.filter(d => d.mastery <= 3 || d.uclImportance === 'High');
  const weakTheorems = theorems.filter(t => t.mastery <= 3 || t.uclImportance === 'High');
  const wrongProblems = problems.filter(p => p.isWrong);

  return (
    <div className="flex h-full bg-mist-50 flex-col">
      <div className="p-8 bg-white border-b border-mist-200 shadow-sm">
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-paris-900 mb-2 flex items-center gap-3 font-serif">
                    <Repeat className="w-8 h-8 text-paris-300" />
                    Exam Prep & Review
                </h1>
                <p className="text-paris-500 text-sm">
                Focusing on low mastery items and high-priority UCL topics.
                </p>
            </div>
            
            <div className="flex bg-mist-100 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('definitions')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'definitions' ? 'bg-white shadow text-paris-500' : 'text-paris-600 hover:text-paris-800'}`}
                >
                    Definitions ({weakDefinitions.length})
                </button>
                <button 
                    onClick={() => setActiveTab('theorems')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'theorems' ? 'bg-white shadow text-paris-500' : 'text-paris-600 hover:text-paris-800'}`}
                >
                    Theorems ({weakTheorems.length})
                </button>
                <button 
                    onClick={() => setActiveTab('mistakes')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'mistakes' ? 'bg-white shadow text-rose-500' : 'text-paris-600 hover:text-paris-800'}`}
                >
                    Mistakes ({wrongProblems.length})
                </button>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 bg-mist-50">
        <div className="max-w-7xl mx-auto">
            
            {activeTab === 'definitions' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                    {weakDefinitions.map(def => (
                        <div key={def.id} className="h-64 perspective-1000 group cursor-pointer" onClick={() => toggleFlip(def.id)}>
                            <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d border border-mist-200 rounded-xl shadow-sm bg-white ${flippedCards[def.id] ? 'rotate-y-180' : ''}`}>
                                
                                {/* Front */}
                                <div className="absolute inset-0 backface-hidden flex flex-col p-6 rounded-xl overflow-hidden bg-white">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-peach-100 rounded-bl-full -mr-10 -mt-10 z-0"></div>
                                    <div className="relative z-10 flex-1 flex flex-col justify-center text-center">
                                        <div className="flex justify-center mb-3">
                                            <BookOpen className="w-6 h-6 text-peach-400" />
                                        </div>
                                        <h3 className="font-bold text-paris-900 text-xl mb-3 font-serif">{def.term}</h3>
                                        <p className="text-xs text-paris-400 uppercase font-bold tracking-widest">Click to Flip</p>
                                    </div>
                                    <div className="relative z-10 pt-4 border-t border-mist-100 flex justify-between items-center">
                                        <div className="flex flex-col text-left">
                                            <span className="text-[10px] text-paris-400 uppercase font-bold">{def.chapterId}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase w-fit mt-1 ${def.uclImportance === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-mist-100 text-paris-500'}`}>
                                                {def.uclImportance} Priority
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-paris-400 block">Mastery: {def.mastery}/5</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Back */}
                                <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col p-6 rounded-xl bg-peach-100/50 border-2 border-peach-200 overflow-hidden">
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <div className="text-paris-700 text-sm leading-relaxed italic overflow-y-auto max-h-40 scrollbar-hide">
                                            {def.flashcardSummary || def.userContent.substring(0, 100) + "..."}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigateToItem(Section.DEFINITIONS, def.id);
                                        }}
                                        className="mt-4 w-full bg-white border border-peach-300 text-peach-600 text-xs font-bold py-2 rounded-lg hover:bg-peach-400 hover:text-white transition-colors flex items-center justify-center gap-1"
                                    >
                                        Full Details <ArrowUpRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {weakDefinitions.length === 0 && <EmptyState message="No weak definitions found!" />}
                </div>
            )}

            {activeTab === 'theorems' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                    {weakTheorems.map(theorem => (
                        <div key={theorem.id} className="h-64 perspective-1000 group cursor-pointer" onClick={() => toggleFlip(theorem.id)}>
                             <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d border border-mist-200 rounded-xl shadow-sm bg-white ${flippedCards[theorem.id] ? 'rotate-y-180' : ''}`}>
                                
                                {/* Front */}
                                <div className="absolute inset-0 backface-hidden flex flex-col p-6 rounded-xl overflow-hidden bg-white">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-paris-100 rounded-bl-full -mr-10 -mt-10 z-0"></div>
                                    <div className="relative z-10 flex-1 flex flex-col justify-center text-center">
                                        <div className="flex justify-center mb-3">
                                            <Scale className="w-6 h-6 text-paris-300" />
                                        </div>
                                        <h3 className="font-bold text-paris-900 text-lg mb-3 font-serif">{theorem.correctedName || theorem.name}</h3>
                                         <p className="text-xs text-paris-400 uppercase font-bold tracking-widest">Click to Flip</p>
                                    </div>
                                    <div className="relative z-10 pt-4 border-t border-mist-100 flex justify-between items-center">
                                         <div className="flex flex-col text-left">
                                            <span className="text-[10px] text-paris-400 uppercase font-bold">{theorem.chapterId}</span>
                                            <div className="flex gap-1 mt-1">
                                                <div className={`w-2 h-2 rounded-full ${theorem.mastery < 3 ? 'bg-peach-400' : 'bg-paris-300'}`}></div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-paris-400 block">Mastery: {theorem.mastery}/5</span>
                                        </div>
                                    </div>
                                </div>

                                 {/* Back */}
                                <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col p-6 rounded-xl bg-paris-100/50 border-2 border-paris-200 overflow-hidden">
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <div className="text-paris-700 text-sm leading-relaxed italic overflow-y-auto max-h-40 scrollbar-hide">
                                            {theorem.flashcardSummary || "Review full proof details..."}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigateToItem(Section.THEOREMS, theorem.id);
                                        }}
                                        className="mt-4 w-full bg-white border border-paris-300 text-paris-500 text-xs font-bold py-2 rounded-lg hover:bg-paris-300 hover:text-white transition-colors flex items-center justify-center gap-1"
                                    >
                                        Full Proof <ArrowUpRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {weakTheorems.length === 0 && <EmptyState message="No weak theorems found!" />}
                </div>
            )}

            {activeTab === 'mistakes' && (
                <div className="space-y-4 animate-fadeIn">
                    {wrongProblems.map(prob => (
                        <div key={prob.id} className="bg-white border-l-4 border-rose-400 rounded-r-xl shadow-sm p-6 flex gap-6 hover:shadow-md transition-shadow">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="bg-rose-50 text-rose-600 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> Needs Review
                                    </span>
                                    <span className="text-xs text-paris-500 uppercase font-bold">{prob.subjectId} / {prob.chapterId}</span>
                                    <span className="text-xs text-paris-300 ml-auto"><Calendar className="w-3 h-3 inline mr-1"/> {new Date(prob.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="mb-4 text-paris-700 text-sm border-b border-mist-100 pb-4">
                                    <MarkdownDisplay content={prob.content} />
                                </div>
                                <div className="flex justify-between items-end">
                                     <div className="flex gap-2">
                                        {prob.knowledgePoints.map((kp, i) => (
                                            <span key={i} className="bg-mist-100 text-paris-500 text-[10px] px-2 py-1 rounded-full">{kp}</span>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => onNavigateToItem(Section.EXERCISES, prob.id)}
                                        className="text-xs bg-paris-300 text-white px-4 py-2 rounded-lg font-bold hover:bg-paris-400 transition-colors flex items-center gap-2"
                                    >
                                        Retake Problem <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {wrongProblems.length === 0 && <EmptyState message="No outstanding wrong problems!" />}
                </div>
            )}
        </div>
      </div>
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
    <div className="col-span-full text-center py-20 text-paris-400 bg-white rounded-xl border border-dashed border-mist-300">
        <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p className="font-medium">{message}</p>
    </div>
);