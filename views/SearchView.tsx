import React, { useState, useMemo } from 'react';
import { DefinitionItem, TheoremItem, ProblemItem } from '../types';
import { Search, BookOpen, Scale, HelpCircle } from 'lucide-react';
import { MarkdownDisplay } from '../components/MarkdownDisplay';

interface SearchViewProps {
  definitions: DefinitionItem[];
  theorems: TheoremItem[];
  problems: ProblemItem[];
}

export const SearchView: React.FC<SearchViewProps> = ({ definitions, theorems, problems }) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return { defs: [], theorems: [], problems: [] };
    const lowerQ = query.toLowerCase();

    return {
      defs: definitions.filter(d => 
        d.term.toLowerCase().includes(lowerQ) || 
        d.userContent.toLowerCase().includes(lowerQ) ||
        d.subjectId.toLowerCase().includes(lowerQ)
      ),
      theorems: theorems.filter(t => 
        t.name.toLowerCase().includes(lowerQ) || 
        (t.correctedName && t.correctedName.toLowerCase().includes(lowerQ)) ||
        t.content.toLowerCase().includes(lowerQ)
      ),
      problems: problems.filter(p => 
        p.content.toLowerCase().includes(lowerQ) || 
        p.summary?.toLowerCase().includes(lowerQ)
      )
    };
  }, [query, definitions, theorems, problems]);

  const hasResults = results.defs.length > 0 || results.theorems.length > 0 || results.problems.length > 0;

  return (
    <div className="flex flex-col h-full bg-mist-50">
      <div className="bg-white p-8 border-b border-mist-200 shadow-sm">
        <h1 className="text-2xl font-bold text-paris-900 mb-4 flex items-center gap-2 font-serif">
            <Search className="text-paris-300" /> Global Search
        </h1>
        <div className="relative max-w-2xl">
            <input 
                autoFocus
                type="text" 
                placeholder="Search for terms, theorems, or problem text..." 
                className="w-full pl-12 pr-4 py-4 bg-mist-50 border border-mist-200 rounded-xl text-lg text-paris-800 focus:ring-2 focus:ring-paris-300 outline-none shadow-inner"
                value={query}
                onChange={e => setQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-paris-400 w-5 h-5" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {!query && (
            <div className="text-center mt-20 text-paris-400">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Start typing to search your knowledge base...</p>
            </div>
        )}

        {query && !hasResults && (
            <div className="text-center mt-20 text-paris-400">
                <p>No results found for "{query}"</p>
            </div>
        )}

        {hasResults && (
            <div className="max-w-5xl mx-auto space-y-10">
                {results.defs.length > 0 && (
                    <section>
                        <h2 className="text-sm font-bold text-paris-400 uppercase mb-4 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> Definitions ({results.defs.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {results.defs.map(d => (
                                <div key={d.id} className="bg-white p-5 rounded-xl border border-mist-200 hover:border-paris-300 hover:shadow-md transition-all cursor-default group">
                                    <div className="flex justify-between mb-2">
                                        <h3 className="font-bold text-paris-800 group-hover:text-paris-500">{d.term}</h3>
                                        <span className="text-xs text-paris-400 bg-mist-50 px-2 py-1 rounded">{d.subjectId}</span>
                                    </div>
                                    <div className="text-sm text-paris-600 line-clamp-2">
                                        {d.flashcardSummary || d.userContent}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {results.theorems.length > 0 && (
                    <section>
                        <h2 className="text-sm font-bold text-paris-400 uppercase mb-4 flex items-center gap-2">
                            <Scale className="w-4 h-4" /> Theorems ({results.theorems.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {results.theorems.map(t => (
                                <div key={t.id} className="bg-white p-5 rounded-xl border border-mist-200 hover:border-paris-300 hover:shadow-md transition-all cursor-default group">
                                    <div className="flex justify-between mb-2">
                                        <h3 className="font-bold text-paris-800 group-hover:text-paris-500">{t.correctedName || t.name}</h3>
                                        <span className="text-xs text-paris-400 bg-mist-50 px-2 py-1 rounded">{t.subjectId}</span>
                                    </div>
                                    <div className="text-sm text-paris-600 line-clamp-2">
                                        {t.flashcardSummary || "Theorem proof and details..."}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {results.problems.length > 0 && (
                    <section>
                        <h2 className="text-sm font-bold text-paris-400 uppercase mb-4 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4" /> Problems ({results.problems.length})
                        </h2>
                        <div className="space-y-4">
                            {results.problems.map(p => (
                                <div key={p.id} className="bg-white p-5 rounded-xl border border-mist-200 hover:border-paris-300 hover:shadow-md transition-all">
                                    <div className="flex justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-paris-500 uppercase">{p.chapterId}</span>
                                            <span className="text-xs text-paris-300">•</span>
                                            <span className="text-xs text-paris-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {p.isWrong && <span className="text-rose-500 text-xs font-bold bg-rose-50 px-2 py-1 rounded">Mistake</span>}
                                    </div>
                                    <div className="text-sm text-paris-700 line-clamp-3 mb-2">
                                        <MarkdownDisplay content={p.content} />
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        {p.knowledgePoints.map((kp, i) => (
                                            <span key={i} className="text-[10px] bg-mist-50 text-paris-500 px-2 py-1 rounded-full">{kp}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        )}
      </div>
    </div>
  );
};