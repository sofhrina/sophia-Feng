import React from 'react';
import { BookOpen, Scale, PenTool, GraduationCap, BrainCircuit, Library, Search } from 'lucide-react';
import { Section } from '../types';

interface SidebarProps {
  activeSection: Section;
  onNavigate: (section: Section) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, onNavigate }) => {
  const navItems = [
    { id: Section.SEARCH, label: 'Global Search', icon: Search },
    { id: Section.DEFINITIONS, label: 'Definitions', icon: BookOpen },
    { id: Section.THEOREMS, label: 'Theorems & Proofs', icon: Scale },
    { id: Section.EXERCISES, label: 'Exercises', icon: PenTool },
    { id: Section.CHAPTER_SUMMARY, label: 'Chapter Summaries', icon: Library },
    { id: Section.REVIEW, label: 'Exam Prep', icon: BrainCircuit },
  ];

  return (
    <div className="w-20 md:w-64 bg-white/50 border-r border-mist-200 flex flex-col h-full transition-all duration-300 shadow-xl z-10 text-paris-800 font-sans backdrop-blur-md">
      <div className="p-6 flex items-center gap-3 border-b border-mist-200 bg-mist-50/80">
        <div className="p-2 bg-paris-300 rounded-lg shadow-lg shadow-paris-300/30">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold text-paris-900 hidden md:block tracking-tight font-serif">MathMaster</span>
      </div>

      <nav className="flex-1 py-6 space-y-2 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-paris-300 text-white font-bold shadow-md shadow-paris-300/20' 
                  : 'text-paris-600 hover:bg-mist-100 hover:text-paris-500'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-paris-400 group-hover:text-paris-500'}`} />
              <span className="hidden md:block">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-mist-200">
        <div className="text-xs text-center md:text-left bg-peach-100 p-3 rounded-lg border border-peach-200">
          <span className="block font-bold text-peach-600 mb-1">UCL Mode Active</span>
          <span className="hidden md:inline opacity-80 text-peach-500">Difficulty calibrated.</span>
        </div>
      </div>
    </div>
  );
};