import React, { useEffect, useRef } from 'react';

interface MarkdownDisplayProps {
  content: string;
  className?: string;
}

export const MarkdownDisplay: React.FC<MarkdownDisplayProps> = ({ content, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && (window as any).MathJax) {
      const mathJax = (window as any).MathJax;
      // Reset and typeset
      if (mathJax.typesetPromise) {
        mathJax.typesetPromise([containerRef.current]).catch((err: any) => {
           console.warn('MathJax typeset failed', err);
        });
      }
    }
  }, [content]);

  // Safe Processing Pipeline:
  // 1. Strip code blocks
  // 2. Mask Math ($...$) with SAFE TOKENS (no underscores/asterisks)
  // 3. Parse Markdown
  // 4. Unmask Math
  const processContent = (text: string) => {
    if (!text) return "";
    
    // 1. Clean code blocks (remove ```latex ... ``` wrappers)
    let clean = text
        .replace(/```(?:latex|markdown|math|json)?\n?([\s\S]*?)\n?```/gi, '$1')
        .replace(/`(\$\$[\s\S]*?\$\$)`/gi, '$1')
        .replace(/`(\$[\s\S]*?\$)`/gi, '$1');

    const mathBlocks: string[] = [];
    
    // 2. Mask Math
    // We use alphanumeric tokens like 'MATHBLOCK0END' to ensure 'marked' 
    // does not interpret them as formatting (bold/italic).
    
    // Mask Block Math $$...$$
    clean = clean.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
        mathBlocks.push(match);
        return `MATHBLOCK${mathBlocks.length - 1}END`;
    });
    
    // Mask Inline Math $...$
    clean = clean.replace(/\$([\s\S]*?)\$/g, (match) => {
        mathBlocks.push(match);
        return `MATHINLINE${mathBlocks.length - 1}END`;
    });

    // 3. Parse Markdown (Convert **bold**, ## Headers, etc to HTML)
    let html = (window as any).marked ? (window as any).marked.parse(clean) : clean;

    // 4. Unmask Math
    // Replace the safe tokens back with the original LaTeX strings
    html = html.replace(/MATHBLOCK(\d+)END/g, (_, index) => mathBlocks[parseInt(index)]);
    html = html.replace(/MATHINLINE(\d+)END/g, (_, index) => mathBlocks[parseInt(index)]);

    return html;
  };

  return (
    <div 
      ref={containerRef} 
      className={`prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:font-serif prose-headings:font-bold prose-a:text-paris-500 ${className}`}
      dangerouslySetInnerHTML={{ __html: processContent(content) }}
    />
  );
};