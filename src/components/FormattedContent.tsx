import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface FormattedContentProps {
  content: string;
  className?: string;
}

export const FormattedContent: React.FC<FormattedContentProps> = ({ content, className = '' }) => {
  // Parse content for LaTeX math blocks: $$...$$ and inline: $...$
  // Also parse basic markdown formatting: **bold**, *italic*, `code`, and line breaks.

  const renderMathAndText = (text: string) => {
    // Split by block math $$...$$ first
    const blockParts = text.split(/(\$\$[\s\S]*?\$\$)/g);

    return blockParts.map((part, blockIdx) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const mathExpr = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(mathExpr, {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <div
              key={`block-math-${blockIdx}`}
              className="my-3 py-1 overflow-x-auto text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <pre key={`err-${blockIdx}`} className="text-red-500 font-mono text-sm">{mathExpr}</pre>;
        }
      }

      // Inside normal text, split by inline math $...$
      const inlineParts = part.split(/(\$[^$\n]+?\$)/g);

      return (
        <span key={`inline-wrapper-${blockIdx}`}>
          {inlineParts.map((inlinePart, inlineIdx) => {
            if (inlinePart.startsWith('$') && inlinePart.endsWith('$')) {
              const mathExpr = inlinePart.slice(1, -1).trim();
              try {
                const html = katex.renderToString(mathExpr, {
                  displayMode: false,
                  throwOnError: false,
                });
                return (
                  <span
                    key={`inline-math-${inlineIdx}`}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
              } catch {
                return <code key={`err-inline-${inlineIdx}`} className="text-red-500 font-mono text-xs">{mathExpr}</code>;
              }
            }

            // Parse simple formatting: newlines, bold, bullets
            const lines = inlinePart.split('\n');
            return lines.map((line, lineIdx) => {
              // Parse **bold**
              const boldSegments = line.split(/(\*\*[^*]+?\*\*)/g).map((seg, sIdx) => {
                if (seg.startsWith('**') && seg.endsWith('**')) {
                  return <strong key={sIdx} className="font-semibold text-zinc-900 dark:text-zinc-100">{seg.slice(2, -2)}</strong>;
                }
                return seg;
              });

              const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('• ');
              const lineContent = isBullet ? boldSegments.slice(1) : boldSegments;

              return (
                <React.Fragment key={`line-${lineIdx}`}>
                  {isBullet ? (
                    <span className="flex items-start gap-2 my-1">
                      <span className="text-zinc-400 select-none">•</span>
                      <span>{lineContent}</span>
                    </span>
                  ) : (
                    <span>{lineContent}</span>
                  )}
                  {lineIdx < lines.length - 1 && <br />}
                </React.Fragment>
              );
            });
          })}
        </span>
      );
    });
  };

  return (
    <div className={`leading-relaxed text-zinc-800 dark:text-zinc-200 select-text ${className}`}>
      {renderMathAndText(content)}
    </div>
  );
};
