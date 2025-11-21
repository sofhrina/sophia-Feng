import React, { useState } from 'react';
import { Section, DefinitionItem, TheoremItem, ProblemItem, ChapterSummaryItem } from './types';
import { Sidebar } from './components/Sidebar';
import { DefinitionsView } from './views/DefinitionsView';
import { TheoremsView } from './views/TheoremsView';
import { ExercisesView } from './views/ExercisesView';
import { ChapterSummaryView } from './views/ChapterSummaryView';
import { ReviewView } from './views/ReviewView';
import { SearchView } from './views/SearchView';
import { MarkdownDisplay } from './components/MarkdownDisplay';
import { X, Globe, BookMarked } from 'lucide-react';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>(Section.DEFINITIONS);
  
  // Centralized State
  const [definitions, setDefinitions] = useState<DefinitionItem[]>([]);
  const [theorems, setTheorems] = useState<TheoremItem[]>([]);
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [summaries, setSummaries] = useState<ChapterSummaryItem[]>([]);

  // Modal State for Instant Edit (Exercises)
  const [editingDef, setEditingDef] = useState<DefinitionItem | null>(null);

  // State for Cross-Navigation (Review -> Definition Detail)
  const [targetItemId, setTargetItemId] = useState<string | null>(null);

  // --- Actions ---

  const addDefinition = (item: DefinitionItem) => setDefinitions(prev => [item, ...prev]);
  const updateDefinition = (id: string, updates: Partial<DefinitionItem>) => {
      setDefinitions(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
      if (editingDef && editingDef.id === id) {
          setEditingDef(prev => prev ? { ...prev, ...updates } : null);
      }
  };

  const addTheorem = (item: TheoremItem) => setTheorems(prev => [item, ...prev]);
  const updateTheorem = (id: string, updates: Partial<TheoremItem>) => {
      setTheorems(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addProblem = (item: ProblemItem) => setProblems(prev => [item, ...prev]);
  const updateProblem = (id: string, updates: Partial<ProblemItem>) => {
      setProblems(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addSummary = (item: ChapterSummaryItem) => setSummaries(prev => [item, ...prev]);

  const handleNavigateToItem = (section: Section, id: string) => {
      setTargetItemId(id);
      setActiveSection(section);
  };

  const renderSection = () => {
    switch (activeSection) {
      case Section.SEARCH:
        return <SearchView definitions={definitions} theorems={theorems} problems={problems} />;
      case Section.DEFINITIONS:
        return <DefinitionsView 
                  items={definitions} 
                  onAddItem={addDefinition} 
                  onUpdateItem={updateDefinition} 
                  initialActiveId={targetItemId} 
               />;
      case Section.THEOREMS:
        return <TheoremsView 
                  items={theorems} 
                  onAddItem={addTheorem} 
                  onUpdateItem={updateTheorem} 
                  initialActiveId={targetItemId} 
               />;
      case Section.EXERCISES:
        return <ExercisesView 
                  items={problems} 
                  definitions={definitions} 
                  theorems={theorems} 
                  onAddItem={addProblem} 
                  onUpdateItem={updateProblem} 
                  onAddDefinition={addDefinition}
                  onEditDefinition={setEditingDef}
                  initialActiveId={targetItemId}
               />;
      case Section.CHAPTER_SUMMARY:
        return <ChapterSummaryView definitions={definitions} theorems={theorems} summaries={summaries} onAddSummary={addSummary} />;
      case Section.REVIEW:
        return <ReviewView 
                  definitions={definitions} 
                  theorems={theorems} 
                  problems={problems} 
                  onNavigateToItem={handleNavigateToItem} 
               />;
      default:
        return <DefinitionsView items={definitions} onAddItem={addDefinition} onUpdateItem={updateDefinition} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-700">
      <Sidebar activeSection={activeSection} onNavigate={(section) => {
          setActiveSection(section);
          setTargetItemId(null); // Reset target when manually navigating
      }} />
      <main className="flex-1 relative overflow-hidden">
        {renderSection()}
      </main>

      {/* Instant Edit Modal for Auto-Learned Concepts */}
      {editingDef && (
          <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-10">
              <div className="bg-white rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-paris-50/50">
                      <div>
                          <h2 className="text-2xl font-bold text-paris-900 font-serif">{editingDef.term}</h2>
                          <span className="text-xs text-paris-600 font-bold uppercase">Instant Concept View</span>
                      </div>
                      <button onClick={() => setEditingDef(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                          <X className="w-6 h-6 text-slate-500" />
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-800">
                       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 text-paris-700 border-b border-paris-50 pb-2">
                                <BookMarked className="w-5 h-5" />
                                <h3 className="font-bold font-serif">Definition (EN)</h3>
                            </div>
                            <MarkdownDisplay content={editingDef.aiContentEn || 'Generating...'} />
                       </div>
                       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 text-slate-600 border-b border-slate-50 pb-2">
                                <Globe className="w-5 h-5" />
                                <h3 className="font-bold font-serif">Definition (CN)</h3>
                            </div>
                            <MarkdownDisplay content={editingDef.aiContentZh || 'Generating...'} />
                       </div>
                  </div>
                  <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                      <button onClick={() => setEditingDef(null)} className="bg-paris-600 hover:bg-paris-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm">Done</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;