
export enum Section {
  DEFINITIONS = 'definitions',
  THEOREMS = 'theorems',
  EXERCISES = 'exercises',
  CHAPTER_SUMMARY = 'chapter_summary',
  REVIEW = 'review',
  SEARCH = 'search',
}

export type MasteryLevel = 1 | 2 | 3 | 4 | 5; // 1: New/Forgot, 5: Mastered

export interface DefinitionItem {
  id: string;
  createdAt: number;
  subjectId: string; // e.g. "Analysis"
  chapterId: string; // e.g. "Sequences"
  term: string;
  userContent: string;
  userNotes: string | null; // Personal thoughts/reflection
  
  // AI Enrichment
  aiContentEn: string | null;
  aiContentZh: string | null;
  funAnalogy: string | null;
  chapterConnection: string | null;
  uclImportance: 'High' | 'Medium' | 'Low';
  flashcardSummary: string | null;
  relatedExtensions: string | null;
  
  mastery: MasteryLevel;
  lastReviewed: number;
  isLoading: boolean;
}

export interface TheoremItem {
  id: string;
  createdAt: number;
  subjectId: string;
  chapterId: string;
  name: string;
  correctedName: string | null;
  content: string;
  userNotes: string | null; // Personal thoughts/reflection
  proofImage: string | null;
  
  // AI Analysis
  proofSteps: string | null;
  logicMapping: string | null;
  concreteExample: string | null;
  flashcardSummary: string | null;
  uclImportance: 'High' | 'Medium' | 'Low'; // Added

  mastery: MasteryLevel;
  lastReviewed: number;
  isLoading: boolean;
}

export interface ProblemStep {
  stepNumber: number;
  description: string;
  math: string;
  explanation: string;
}

export interface ProblemItem {
  id: string;
  createdAt: number;
  subjectId: string;
  chapterId: string;
  source: 'user' | 'ai';
  content: string;
  originalImages: string[] | null; // Changed to array for multiple images
  summary: string | null; // Short 1-sentence description for history
  steps: ProblemStep[];
  
  // User Solution Data
  userAnswer: string | null; // Markdown Text
  solutionImages: string[] | null; // Added: User's own solution photos
  
  // Struggle Data
  struggleNote: string | null; // Added: Why did I struggle?
  struggleImages: string[] | null; // Added: Photos of where I got stuck

  knowledgePoints: string[];
  uclDifficulty: string;
  isSolved: boolean;
  isWrong: boolean;
  mastery: MasteryLevel; // Added
}

export interface ChapterSummaryItem {
  id: string;
  createdAt: number;
  subjectId: string;
  chapterId: string;
  aiSummary: string;
  isLoading: boolean;
}
