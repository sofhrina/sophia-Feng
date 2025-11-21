import React, { useState, useRef, useEffect } from 'react';
import { ProblemItem, ProblemStep, DefinitionItem, TheoremItem, MasteryLevel } from '../types';
import { generateAiProblem, solveUserProblem, generateMissingConcept } from '../services/geminiService';
import { MarkdownDisplay } from '../components/MarkdownDisplay';
import { Brain, Target, Play, CheckCircle, HelpCircle, Layers, Loader2, History, XCircle, Zap, ArrowRight, Star, Edit3, Save, BookOpen, Image, Trash2, Upload, AlertTriangle, ChevronDown } from 'lucide-react';

interface ExercisesViewProps {
  items: ProblemItem[];
  definitions: DefinitionItem[];
  theorems: TheoremItem[];
  onAddItem: (item: ProblemItem) => void;
  onUpdateItem: (id: string, updates: Partial<ProblemItem>) => void;
  onAddDefinition: (item: DefinitionItem) => void;
  onEditDefinition: (item: DefinitionItem) => void;
  initialActiveId?: string | null;
}

export const ExercisesView: React.FC<ExercisesViewProps> = ({ items, definitions, theorems, onAddItem, onUpdateItem, onAddDefinition, onEditDefinition, initialActiveId }) => {
  const [mode, setMode] = useState<'ai' | 'user'>('ai');
  const [subject, setSubject] = useState('Analysis');
  const [chapter, setChapter] = useState('Sequences');
  const [specificTopic, setSpecificTopic] = useState('');
  const [difficulty, setDifficulty] = useState('UCL 2:1'); // Default Medium
  
  // User Input State
  const [userProblemText, setUserProblemText] = useState('');
  const [userImages, setUserImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User Solution State
  const [currentUserAnswer, setCurrentUserAnswer] = useState('');
  const [userSolutionImages, setUserSolutionImages] = useState<string[]>([]);
  const solutionInputRef = useRef<HTMLInputElement>(null);
  
  // Struggle State
  const [showStruggleForm, setShowStruggleForm] = useState(false);
  const [struggleNote, setStruggleNote] = useState('');
  const [struggleImages, setStruggleImages] = useState<string[]>([]);
  const struggleInputRef = useRef<HTMLInputElement>(null);

  const [currentProblemId, setCurrentProblemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [learningConcept, setLearningConcept] = useState<string | null>(null);
  const [visibleStepIndex, setVisibleStepIndex] = useState(-1);
  
  // Handle Deep Link
  useEffect(() => {
      if (initialActiveId) {
          const prob = items.find(p => p.id === initialActiveId);
          if (prob) {
              setCurrentProblemId(initialActiveId);
              setVisibleStepIndex(prob.steps.length); // Show full solution
              setCurrentUserAnswer(prob.userAnswer || '');
              setUserSolutionImages(prob.solutionImages || []);
          }
      }
  }, [initialActiveId, items]);

  // --- File Handlers ---

  const handleProblemFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => setUserImages(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file as Blob);
    });
  };

  const handleSolutionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => setUserSolutionImages(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file as Blob);
    });
  };

  const handleStruggleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => setStruggleImages(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file as Blob);
    });
  };

  // --- Logic ---

  const handleGenerate = async () => {
    setIsLoading(true);
    setCurrentProblemId(null);
    setVisibleStepIndex(-1);
    setCurrentUserAnswer('');
    setUserSolutionImages([]);
    resetStruggleForm();

    try {
      const result = await generateAiProblem(subject, chapter, difficulty, specificTopic);
      const newProblem: ProblemItem = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        subjectId: subject,
        chapterId: chapter,
        source: 'ai',
        content: result.content,
        originalImages: null,
        summary: result.summary,
        steps: result.steps,
        knowledgePoints: result.knowledgePoints,
        uclDifficulty: result.difficulty,
        userAnswer: null,
        solutionImages: null,
        struggleNote: null,
        struggleImages: null,
        isSolved: false,
        isWrong: false,
        mastery: 1
      };
      onAddItem(newProblem);
      setCurrentProblemId(newProblem.id);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSolveUser = async () => {
    if (!userProblemText && userImages.length === 0) return;
    setIsLoading(true);
    setCurrentProblemId(null);
    setVisibleStepIndex(-1);
    resetStruggleForm();
    
    try {
      const result = await solveUserProblem(userProblemText, userImages.length > 0 ? userImages : undefined);
      const newProblem: ProblemItem = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        subjectId: subject,
        chapterId: chapter,
        source: 'user',
        content: result.problem_transcription || userProblemText || "Problem from Image",
        originalImages: userImages.length > 0 ? [...userImages] : null,
        summary: result.summary,
        steps: result.steps,
        knowledgePoints: result.knowledgePoints,
        uclDifficulty: 'Self-Assigned',
        userAnswer: currentUserAnswer, 
        solutionImages: userSolutionImages.length > 0 ? [...userSolutionImages] : null,
        struggleNote: null,
        struggleImages: null,
        isSolved: false,
        isWrong: false,
        mastery: 1
      };
      onAddItem(newProblem);
      setCurrentProblemId(newProblem.id);
      // Reset input
      setUserProblemText('');
      setUserImages([]);
    } catch (error) {
        console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoLearn = async (term: string) => {
      setLearningConcept(term);
      try {
          const result = await generateMissingConcept(term);
          const newDef: DefinitionItem = {
              id: Date.now().toString(),
              createdAt: Date.now(),
              subjectId: subject,
              chapterId: chapter,
              term: term,
              userContent: "Auto-generated from Exercise",
              userNotes: null,
              aiContentEn: result.ai_content_en,
              aiContentZh: result.ai_content_zh,
              funAnalogy: result.fun_analogy,
              chapterConnection: result.chapter_connection,
              uclImportance: result.ucl_importance,
              relatedExtensions: result.extensions,
              flashcardSummary: result.flashcard_summary,
              mastery: 1,
              lastReviewed: Date.now(),
              isLoading: false
          };
          onAddDefinition(newDef);
          onEditDefinition(newDef);
      } catch (e) {
          console.error("Failed to auto-learn", e);
      } finally {
          setLearningConcept(null);
      }
  };

  const updateMastery = (id: string, level: MasteryLevel) => {
    onUpdateItem(id, { mastery: level });
  };

  const saveUserAnswer = () => {
      if (currentProblemId) {
          onUpdateItem(currentProblemId, { 
              userAnswer: currentUserAnswer,
              solutionImages: userSolutionImages
          });
      }
  };

  const submitStruggle = () => {
      if (currentProblemId) {
          onUpdateItem(currentProblemId, {
              isWrong: true,
              struggleNote: struggleNote,
              struggleImages: struggleImages
          });
          setShowStruggleForm(false);
      }
  };

  const resetStruggleForm = () => {
      setShowStruggleForm(false);
      setStruggleNote('');
      setStruggleImages([]);
  };

  const currentProblem = items.find(i => i.id === currentProblemId);

  const showNextStep = () => {
    if (currentProblem && visibleStepIndex < currentProblem.steps.length - 1) {
      setVisibleStepIndex(prev => prev + 1);
    } else if (currentProblem && visibleStepIndex === currentProblem.steps.length - 1) {
        onUpdateItem(currentProblem.id, { isSolved: true });
    }
  };

  return (
    <div className="flex h-full bg-mist-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Controls */}
        <div className="bg-white p-6 border-b border-mist-200 flex flex-col gap-4 shadow-sm z-10">
           <div className="flex gap-4 items-center">
                <div className="flex-1 grid grid-cols-4 gap-2">
                    <input value={subject} onChange={e => setSubject(e.target.value)} className="bg-mist-50 border border-mist-200 rounded px-3 py-2 text-paris-700 text-sm focus:ring-1 focus:ring-paris-300 outline-none" placeholder="Subject" />
                    <input value={chapter} onChange={e => setChapter(e.target.value)} className="bg-mist-50 border border-mist-200 rounded px-3 py-2 text-paris-700 text-sm focus:ring-1 focus:ring-paris-300 outline-none" placeholder="Chapter" />
                    
                    {mode === 'ai' && (
                        <>
                            <div className="relative">
                                <select 
                                    value={difficulty} 
                                    onChange={e => setDifficulty(e.target.value)}
                                    className="w-full appearance-none bg-mist-50 border border-mist-200 rounded px-3 py-2 text-paris-700 text-sm focus:ring-1 focus:ring-paris-300 outline-none"
                                >
                                    <option value="UCL Pass">UCL Pass (Easy)</option>
                                    <option value="UCL 2:1">UCL 2:1 (Medium)</option>
                                    <option value="UCL First Class">UCL First Class (Hard)</option>
                                </select>
                                <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-paris-400 pointer-events-none" />
                            </div>
                            <input value={specificTopic} onChange={e => setSpecificTopic(e.target.value)} className="bg-mist-50 border border-mist-200 rounded px-3 py-2 text-paris-700 text-sm focus:ring-1 focus:ring-paris-300 outline-none" placeholder="Target Topic (e.g. Taylor Series)" />
                        </>
                    )}
                </div>
           </div>
           
           <div className="flex flex-col gap-3">
               <div className="flex items-center justify-between">
                    <div className="flex bg-mist-100 rounded-lg p-1 mr-2 border border-mist-200">
                        <button onClick={() => setMode('ai')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'ai' ? 'bg-white text-paris-500 shadow-sm' : 'text-paris-600 hover:text-paris-800'}`}>Generate Question</button>
                        <button onClick={() => setMode('user')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'user' ? 'bg-white text-paris-500 shadow-sm' : 'text-paris-600 hover:text-paris-800'}`}>Solve Mine</button>
                    </div>

                     <button 
                        onClick={mode === 'ai' ? handleGenerate : handleSolveUser}
                        disabled={isLoading}
                        className="bg-paris-300 hover:bg-paris-400 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-md ml-auto"
                    >
                        {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Play className="fill-current w-4 h-4" />}
                        {mode === 'ai' ? 'Generate Challenge' : 'Solve Photos'}
                    </button>
               </div>

              {mode === 'user' && (
                <div className="flex flex-col gap-2 animate-fadeIn">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={userProblemText}
                            onChange={(e) => setUserProblemText(e.target.value)}
                            placeholder="Paste problem text (Optional if uploading photos)..."
                            className="flex-1 bg-white border border-mist-300 rounded-lg px-4 py-2 text-paris-800 focus:border-paris-300 outline-none"
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            className="bg-white border border-mist-300 text-paris-600 px-4 py-2 rounded-lg hover:bg-mist-50 flex items-center gap-2"
                        >
                            <Upload className="w-4 h-4" /> Photos ({userImages.length})
                        </button>
                        <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleProblemFileChange} />
                    </div>
                    
                    {/* Image Preview Grid */}
                    {userImages.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {userImages.map((img, idx) => (
                                <div key={idx} className="relative group shrink-0">
                                    <img src={img} className="h-20 w-20 object-cover rounded-lg border border-mist-200" />
                                    <button 
                                        onClick={() => setUserImages(prev => prev.filter((_, i) => i !== idx))}
                                        className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <XCircle className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
              )}
           </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto p-8 bg-mist-50">
          {currentProblem ? (
            <div className="max-w-4xl mx-auto pb-20">
              <div className="bg-white rounded-2xl border border-mist-200 p-8 mb-8 shadow-sm relative overflow-hidden">
                 <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl font-bold text-xs uppercase ${
                     currentProblem.uclDifficulty.includes('First') ? 'bg-rose-100 text-rose-600' :
                     currentProblem.uclDifficulty.includes('2:1') ? 'bg-peach-100 text-peach-600' : 'bg-mist-100 text-paris-600'
                 }`}>
                    {currentProblem.uclDifficulty}
                 </div>
                 <div className="flex justify-between items-start mb-6">
                     <h3 className="text-xs font-bold text-paris-500 uppercase tracking-wider flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" /> Problem Statement
                     </h3>
                     <div className="flex gap-1 items-center">
                         <span className="text-xs text-paris-400 mr-2">Mastery:</span>
                         {[1,2,3,4,5].map(star => (
                             <button key={star} onClick={() => updateMastery(currentProblem.id, star as MasteryLevel)}>
                                 <Star className={`w-4 h-4 ${star <= currentProblem.mastery ? 'fill-peach-400 text-peach-400' : 'text-mist-300'}`} />
                             </button>
                         ))}
                     </div>
                 </div>
                 
                 {/* Render Original Images if Present */}
                 {currentProblem.originalImages && currentProblem.originalImages.length > 0 && (
                     <div className="flex gap-4 overflow-x-auto pb-4 mb-4 border-b border-mist-100">
                         {currentProblem.originalImages.map((img, i) => (
                             <img key={i} src={img} alt={`Problem Part ${i+1}`} className="h-64 rounded-lg border border-mist-200 shadow-sm" />
                         ))}
                     </div>
                 )}

                 <div className="text-lg text-paris-900 leading-relaxed font-serif">
                    <MarkdownDisplay content={currentProblem.content} />
                 </div>
              </div>

              {/* User Answer Section */}
              <div className="bg-peach-100/30 rounded-xl border border-peach-200 p-6 mb-8">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-peach-600 text-sm flex items-center gap-2 uppercase tracking-wider">
                          <Edit3 className="w-4 h-4" /> My Steps & Solution
                      </h3>
                      <div className="flex items-center gap-2">
                          <button 
                            onClick={() => solutionInputRef.current?.click()}
                            className="text-xs bg-white border border-peach-300 text-peach-600 px-3 py-1.5 rounded-full hover:bg-peach-50 font-bold flex items-center gap-1"
                          >
                              <Image className="w-3 h-3" /> Add Photos
                          </button>
                          <input type="file" multiple accept="image/*" ref={solutionInputRef} className="hidden" onChange={handleSolutionFileChange} />

                          <button 
                            onClick={saveUserAnswer}
                            className="text-xs bg-paris-300 text-white px-3 py-1.5 rounded-full hover:bg-paris-400 font-bold flex items-center gap-1 shadow-sm transition-all"
                          >
                              <Save className="w-3 h-3" /> Save Work
                          </button>
                      </div>
                  </div>
                  <textarea 
                    value={currentUserAnswer || currentProblem.userAnswer || ''}
                    onChange={(e) => setCurrentUserAnswer(e.target.value)}
                    placeholder="Type your step-by-step solution here... (Supports LaTeX $$ and Markdown)"
                    className="w-full bg-white border border-mist-200 rounded-lg p-4 text-paris-800 focus:ring-2 focus:ring-paris-200 outline-none min-h-[200px] font-mono text-sm leading-relaxed mb-4"
                  />
                  
                  {/* User Solution Images */}
                  {(userSolutionImages.length > 0 || (currentProblem.solutionImages && currentProblem.solutionImages.length > 0)) && (
                      <div className="flex gap-2 overflow-x-auto">
                          {(userSolutionImages.length > 0 ? userSolutionImages : currentProblem.solutionImages)?.map((img, i) => (
                               <div key={i} className="relative group">
                                   <img src={img} className="h-32 rounded-lg border border-mist-200 shadow-sm" />
                                   <button 
                                        onClick={() => setUserSolutionImages(prev => prev.filter((_, idx) => idx !== i))}
                                        className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                   >
                                       <Trash2 className="w-3 h-3" />
                                   </button>
                               </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* Solution Steps */}
              <div className="space-y-6">
                 {currentProblem.steps.map((step, idx) => (
                   <div 
                     key={idx} 
                     className={`transition-all duration-500 ${
                       idx <= visibleStepIndex 
                         ? 'opacity-100 translate-y-0' 
                         : 'opacity-0 translate-y-4 hidden'
                     }`}
                   >
                      <div className="flex gap-4">
                         <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-paris-300 flex items-center justify-center font-bold text-white z-10 shadow-sm">
                              {step.stepNumber}
                            </div>
                            {idx < visibleStepIndex && <div className="w-0.5 flex-1 bg-mist-200 my-2"></div>}
                         </div>
                         <div className="flex-1 bg-white border border-mist-200 rounded-xl p-6 shadow-sm">
                            <div className="mb-4 text-paris-600">
                               <MarkdownDisplay content={step.explanation} />
                            </div>
                            {step.math && (
                                <div className="bg-mist-50 p-4 rounded-lg border border-mist-100 overflow-x-auto">
                                    <MarkdownDisplay content={step.math.startsWith('$') ? step.math : `$${step.math}$`} />
                                </div>
                            )}
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
              
              {/* Action Buttons / Struggle Form */}
              <div className="flex flex-col items-center mt-10 gap-6">
                  {visibleStepIndex < currentProblem.steps.length - 1 && (
                     <button 
                        onClick={showNextStep}
                        className="bg-paris-800 hover:bg-paris-700 text-white px-8 py-3 rounded-full font-medium flex items-center gap-2 transition-all hover:shadow-lg"
                     >
                        <HelpCircle className="w-5 h-5 text-paris-300" />
                        Show Step {visibleStepIndex + 2}
                     </button>
                  )}

                  {(visibleStepIndex === currentProblem.steps.length - 1) && (
                     <div className="w-full">
                         {!showStruggleForm && !currentProblem.isWrong && (
                             <div className="flex justify-center gap-4">
                                <button 
                                    onClick={() => setShowStruggleForm(true)} 
                                    className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
                                >
                                    <AlertTriangle className="w-5 h-5" />
                                    I struggled with this
                                </button>
                                <div className="bg-paris-100 text-paris-600 border border-paris-200 px-8 py-3 rounded-xl flex items-center gap-3 shadow-sm">
                                    <CheckCircle className="w-6 h-6" />
                                    <span className="font-bold text-lg">Problem Completed</span>
                                </div>
                            </div>
                         )}

                         {(showStruggleForm || (currentProblem.isWrong && currentProblem.struggleNote)) && (
                             <div className="mt-6 bg-rose-50 border border-rose-200 rounded-xl p-6 animate-fadeIn">
                                 <h4 className="font-bold text-rose-700 mb-4 flex items-center gap-2">
                                     <AlertTriangle className="w-5 h-5" /> Struggle Analysis
                                 </h4>
                                 
                                 {showStruggleForm ? (
                                    <>
                                        <textarea 
                                            value={struggleNote}
                                            onChange={e => setStruggleNote(e.target.value)}
                                            placeholder="Why did you struggle? (e.g. forgot the chain rule...)"
                                            className="w-full bg-white border border-rose-200 rounded-lg p-3 text-sm mb-4 outline-none focus:ring-2 focus:ring-rose-200"
                                        />
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => struggleInputRef.current?.click()} className="text-xs bg-white text-rose-600 border border-rose-200 px-3 py-1.5 rounded-full font-bold hover:bg-rose-50">
                                                    Upload Stuck Point
                                                </button>
                                                <input type="file" ref={struggleInputRef} className="hidden" accept="image/*" onChange={handleStruggleFileChange} />
                                                <span className="text-xs text-rose-400">{struggleImages.length} images</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={resetStruggleForm} className="text-xs text-paris-500 hover:text-paris-700 font-bold px-3">Cancel</button>
                                                <button onClick={submitStruggle} className="text-xs bg-rose-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-rose-600 shadow-sm">Save & Review Later</button>
                                            </div>
                                        </div>
                                    </>
                                 ) : (
                                     <div>
                                         <p className="text-rose-800 text-sm mb-2 font-medium">"{currentProblem.struggleNote}"</p>
                                         {currentProblem.struggleImages && (
                                             <div className="flex gap-2 overflow-x-auto mt-2">
                                                 {currentProblem.struggleImages.map((img, i) => (
                                                     <img key={i} src={img} className="h-20 rounded border border-rose-200" />
                                                 ))}
                                             </div>
                                         )}
                                     </div>
                                 )}
                             </div>
                         )}
                     </div>
                  )}
              </div>

            </div>
          ) : (
            !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-mist-400">
                 <BookOpen className="w-20 h-20 mb-6 opacity-30" />
                 <p className="text-lg font-medium">Configure the generator or upload photos to begin</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Sidebar: History & Knowledge */}
      <div className="w-80 bg-white border-l border-mist-200 flex flex-col z-20 shadow-sm">
         <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b border-mist-200 bg-mist-50/50">
                <h3 className="font-bold text-paris-600 flex items-center gap-2 text-xs uppercase tracking-wider">
                <History className="w-4 h-4 text-paris-300" />
                Recent Problems
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {items.length === 0 && <p className="text-center text-xs text-paris-400 mt-4">No history yet.</p>}
                {items.sort((a,b) => b.createdAt - a.createdAt).map(p => (
                    <div 
                        key={p.id} 
                        onClick={() => { 
                            setCurrentProblemId(p.id); 
                            setVisibleStepIndex(p.steps.length);
                            setCurrentUserAnswer(p.userAnswer || '');
                            setUserSolutionImages(p.solutionImages || []);
                        }}
                        className={`p-3 rounded-lg cursor-pointer border text-xs transition-colors ${
                            currentProblemId === p.id ? 'bg-peach-100 border-peach-400' : 'bg-white border-mist-200 hover:bg-mist-50'
                        }`}
                    >
                        <div className="flex justify-between mb-1">
                            <span className="font-bold text-paris-700 truncate w-20">{new Date(p.createdAt).toLocaleDateString()}</span>
                            {p.isWrong && <span className="text-rose-600 font-bold bg-rose-50 px-1 rounded">Review</span>}
                        </div>
                        <div className="text-paris-700 font-medium mb-1">
                            {p.summary || "Math Problem"}
                        </div>
                        {p.originalImages && p.originalImages.length > 0 && (
                            <div className="mt-1 flex items-center gap-1 text-paris-400">
                                <Image className="w-3 h-3" /> <span className="text-[10px]">{p.originalImages.length} photo(s)</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
         </div>
         
         <div className="h-1/2 border-t border-mist-200 flex flex-col">
             <div className="p-4 border-b border-mist-200 bg-mist-50/50">
                <h3 className="font-bold text-paris-600 flex items-center gap-2 text-xs uppercase tracking-wider">
                <Brain className="w-4 h-4 text-peach-500" />
                Knowledge Graph
                </h3>
            </div>
             <div className="flex-1 p-4 overflow-y-auto bg-white">
                {currentProblem ? (
                    <div className="space-y-2">
                        {currentProblem.knowledgePoints.map((tag, i) => {
                            const existsInDefs = definitions.some(d => d.term.toLowerCase() === tag.toLowerCase());
                            const existsInThms = theorems.some(t => (t.name.toLowerCase() === tag.toLowerCase() || t.correctedName?.toLowerCase() === tag.toLowerCase()));
                            const exists = existsInDefs || existsInThms;

                            return (
                                <div key={i} className="flex items-center justify-between bg-mist-50 p-2 rounded border border-mist-200">
                                    <span className="text-sm text-paris-700 font-medium">{tag}</span>
                                    {exists ? (
                                        <CheckCircle className="w-4 h-4 text-paris-300" />
                                    ) : (
                                        <button 
                                            onClick={() => handleAutoLearn(tag)}
                                            disabled={!!learningConcept}
                                            className="text-xs bg-peach-100 text-peach-600 px-2 py-1 rounded flex items-center gap-1 hover:bg-peach-200 transition-colors"
                                        >
                                            {learningConcept === tag ? <Loader2 className="w-3 h-3 animate-spin"/> : <Zap className="w-3 h-3" />}
                                            Auto-Learn
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {currentProblem.knowledgePoints.length === 0 && (
                            <span className="text-xs text-paris-400 italic">AI did not identify specific named theorems for this problem.</span>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-xs text-paris-400 mt-10">Select a problem to see its knowledge graph</div>
                )}
            </div>
         </div>
      </div>
    </div>
  );
};