import React, { useState } from 'react';
import { DefinitionItem, TheoremItem, ChapterSummaryItem } from '../types';
import { generateChapterSummary } from '../services/geminiService';
import { MarkdownDisplay } from '../components/MarkdownDisplay';
import { Library, Loader2, Sparkles, BookOpen, Scale } from 'lucide-react';

interface ChapterSummaryViewProps {
    definitions: DefinitionItem[];
    theorems: TheoremItem[];
    summaries: ChapterSummaryItem[];
    onAddSummary: (item: ChapterSummaryItem) => void;
}

export const ChapterSummaryView: React.FC<ChapterSummaryViewProps> = ({ definitions, theorems, summaries, onAddSummary }) => {
    const [subject, setSubject] = useState('Analysis');
    const [chapter, setChapter] = useState('Sequences');
    const [isGenerating, setIsGenerating] = useState(false);

    const existingSummary = summaries.find(s => s.subjectId === subject && s.chapterId === chapter);

    const chapterDefinitions = definitions.filter(d => d.subjectId === subject && d.chapterId === chapter);
    const chapterTheorems = theorems.filter(t => t.subjectId === subject && t.chapterId === chapter);
    const hasContent = chapterDefinitions.length > 0 || chapterTheorems.length > 0;

    const handleGenerate = async () => {
        if (!hasContent) return;
        setIsGenerating(true);
        
        try {
            const combinedContent = [...chapterDefinitions, ...chapterTheorems];
            const summaryText = await generateChapterSummary(subject, chapter, combinedContent);
            
            const newItem: ChapterSummaryItem = {
                id: Date.now().toString(),
                createdAt: Date.now(),
                subjectId: subject,
                chapterId: chapter,
                aiSummary: summaryText,
                isLoading: false
            };
            onAddSummary(newItem);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex h-full bg-mist-50 flex-col">
            <div className="bg-white border-b border-mist-200 p-6 shadow-sm z-10">
                <h1 className="text-2xl font-bold text-paris-900 mb-4 flex items-center gap-2 font-serif">
                    <Library className="text-paris-300" />
                    Chapter Revision Hub
                </h1>
                <div className="flex gap-4 items-end">
                     <div className="flex-1 grid grid-cols-2 gap-4 max-w-lg">
                        <div>
                            <label className="block text-xs font-bold text-paris-400 uppercase mb-1">Subject</label>
                            <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-mist-50 border border-mist-200 rounded px-3 py-2 text-paris-700 text-sm outline-none focus:ring-2 focus:ring-paris-300" />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-paris-400 uppercase mb-1">Chapter</label>
                            <input value={chapter} onChange={e => setChapter(e.target.value)} className="w-full bg-mist-50 border border-mist-200 rounded px-3 py-2 text-paris-700 text-sm outline-none focus:ring-2 focus:ring-paris-300" />
                        </div>
                    </div>
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !hasContent}
                        className="bg-paris-300 hover:bg-paris-400 disabled:opacity-50 disabled:bg-paris-200 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-md"
                    >
                        {isGenerating ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4 text-white" />}
                        Generate Revision Sheet
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 flex gap-8">
                {/* Left: User Content List */}
                <div className="w-1/3 space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-paris-400 uppercase mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> Definitions in Chapter
                        </h3>
                        {chapterDefinitions.length === 0 && <p className="text-sm text-paris-400 italic">No definitions yet.</p>}
                        <div className="space-y-2">
                            {chapterDefinitions.map(d => (
                                <div key={d.id} className="bg-white p-3 rounded border border-mist-200 text-sm font-medium text-paris-700 shadow-sm">
                                    {d.term}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-paris-400 uppercase mb-3 flex items-center gap-2">
                            <Scale className="w-4 h-4" /> Theorems in Chapter
                        </h3>
                        {chapterTheorems.length === 0 && <p className="text-sm text-paris-400 italic">No theorems yet.</p>}
                        <div className="space-y-2">
                            {chapterTheorems.map(t => (
                                <div key={t.id} className="bg-white p-3 rounded border border-mist-200 text-sm font-medium text-paris-700 shadow-sm">
                                    {t.correctedName || t.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: AI Summary */}
                <div className="flex-1">
                    {existingSummary ? (
                        <div className="bg-white rounded-2xl border border-mist-200 shadow-sm p-10 min-h-full">
                             <div className="flex justify-between items-start mb-6 border-b border-mist-100 pb-4">
                                <h2 className="text-xl font-bold text-paris-900">
                                    {subject}: {chapter} Summary
                                </h2>
                                <span className="text-xs text-paris-400">Generated on {new Date(existingSummary.createdAt).toLocaleDateString()}</span>
                             </div>
                             <MarkdownDisplay content={existingSummary.aiSummary} className="text-paris-800 leading-loose" />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-paris-400 bg-white rounded-2xl border border-dashed border-mist-300">
                            <Sparkles className="w-16 h-16 mb-4 text-peach-400" />
                            <p className="font-medium">Add content and click Generate to create a master revision sheet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};