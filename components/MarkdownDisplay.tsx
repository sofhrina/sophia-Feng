import React, { useEffect, useRef } from 'react';

interface MarkdownDisplayProps {
  content: string;
  className?: string;
}

export const MarkdownDisplay: React.FC<MarkdownDisplayProps> = ({ content, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && (window as any).MathJax) {
      // Clear previous content render queue if needed
      // Trigger typeset
      const mathJax = (window as any).MathJax;
      if (mathJax.typesetPromise) {
        mathJax.typesetPromise([containerRef.current]).catch((err: any) => {
           // console.warn('MathJax typeset failed', err);
        });
      }
    }
  }, [content]);

  // Pre-process content to fix common AI math formatting issues
  const prepareContent = (text: string) => {
    if (!text) return "";
    
    // 1. Remove markdown code blocks wrapping math (e.g. ```latex ... ```)
    // We replace them with just the content inside, ensuring `$$` delimiters are present if it looks like a block
    let cleaned = text.replace(/```latex\s*([\s\S]*?)\s*```/gi, '$$$1$$');
    cleaned = cleaned.replace(/```\s*([\s\S]*?)\s*```/gi, (match, p1) => {
        // If the content inside backticks contains backslashes or equals, assume it's math
        if (p1.includes('\\') || p1.includes('=')) {
            return `$$${p1}$$`;
        }
        // Otherwise keep as code
        return match;
    });

    // 2. Ensure display math \[ \] becomes $$ $$ for consistency
    cleaned = cleaned.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
    
    // 3. Ensure inline math \( \) becomes $ $
    cleaned = cleaned.replace(/\\\(/g, '$').replace(/\\\)/g, '$');

    return cleaned;
  };

  const formatText = (text: string) => {
    const prepared = prepareContent(text);
    
    let formatted = prepared
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-paris-500 mt-4 mb-2 font-serif">$1</h3>') // Royal Blue H3
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-paris-700 mt-5 mb-3 border-b border-mist-200 pb-1 font-serif">$1</h2>') // Navy H2
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-paris-900 mt-6 mb-4 font-serif">$1</h1>') // Dark Navy H1
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-paris-900 font-bold">$1</strong>')
      // Italics
      .replace(/\*(.*?)\*/g, '<em class="text-paris-600 italic">$1</em>')
      // Lists
      .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-paris-800 mb-1">$1</li>')
      // Blockquotes / Callouts -> Cyan background
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-peach-400 bg-peach-100 p-3 italic text-paris-800 my-2 rounded-r shadow-sm">$1</blockquote>')
      // Newlines
      .replace(/\n/g, '<br />');
      
    return { __html: formatted };
  };

  return (
    <div 
      ref={containerRef}
      className={`prose prose-slate max-w-none leading-relaxed text-paris-800 ${className}`}
      dangerouslySetInnerHTML={formatText(content)}
    />
  );
};