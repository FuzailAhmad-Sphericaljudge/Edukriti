'use client';

import React, { useState } from 'react';
import katex from 'katex';
import { Check, Copy } from 'lucide-react';
import type { Citation } from '@edukriti/contracts';

interface MarkdownMathProps {
  content: string;
  citations?: Citation[];
  onCitationClick?: (citation: Citation) => void;
  className?: string;
}

function renderKaTeX(math: string, displayMode: boolean): string {
  try {
    return katex.renderToString(math.trim(), {
      displayMode,
      throwOnError: false,
    });
  } catch {
    return math;
  }
}

function MathBlock({ math }: { math: string }) {
  const [copied, setCopied] = useState(false);
  const html = renderKaTeX(math, true);

  const handleCopy = () => {
    void navigator.clipboard.writeText(math.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-3 rounded-xl border border-white/5 bg-slate-900/60 p-3 text-center">
      <div
        className="overflow-x-auto font-serif text-base text-sky-200"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <button
        type="button"
        onClick={handleCopy}
        title="Copy LaTeX formula"
        className="absolute right-2 top-2 hidden items-center gap-1 rounded-md border border-white/10 bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300 opacity-0 transition group-hover:inline-flex group-hover:opacity-100 hover:text-white hover:bg-slate-700"
      >
        {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
        <span>{copied ? 'Copied' : 'LaTeX'}</span>
      </button>
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-white/10 bg-slate-950 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-3 py-1.5 text-slate-400">
        <span className="font-semibold uppercase tracking-wider">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-slate-300 hover:text-white"
        >
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-3 leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MarkdownTable({ rows }: { rows: string[] }) {
  if (rows.length < 2) return null;

  const parseRow = (row: string) =>
    row
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());

  const headerCells = parseRow(rows[0]!);
  // row 1 is the separator: | --- | --- |
  const bodyRows = rows.slice(2).map(parseRow);

  return (
    <div className="my-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/40">
      <table className="w-full text-left text-xs text-slate-200">
        <thead className="border-b border-white/10 bg-white/5 font-semibold text-sky-200">
          <tr>
            {headerCells.map((header, i) => (
              <th key={`header-${i}-${header}`} className="px-3 py-2">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {bodyRows.map((cells, rowIdx) => (
            <tr key={`row-${rowIdx}`} className="hover:bg-white/5">
              {cells.map((cell, colIdx) => (
                <td key={`cell-${rowIdx}-${colIdx}`} className="px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MarkdownMath({
  content,
  citations = [],
  onCitationClick,
  className = '',
}: MarkdownMathProps) {
  // 1. Process Code Blocks first
  const blocks = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`space-y-2.5 text-sm leading-relaxed text-slate-100 ${className}`}>
      {blocks.map((block, blockIndex) => {
        if (block.startsWith('```')) {
          const match = block.match(/```(\w+)?\n([\s\S]*?)```/);
          const lang = match?.[1] || '';
          const code = match?.[2] || block.slice(3, -3);
          return <CodeBlock key={`code-${blockIndex}`} language={lang} code={code} />;
        }

        // Process line-by-line for headings, lists, tables, and block math
        const lines = block.split('\n');
        const elements: React.ReactNode[] = [];
        let tableBuffer: string[] = [];

        const flushTable = (keyPrefix: string) => {
          if (tableBuffer.length > 0) {
            elements.push(<MarkdownTable key={`${keyPrefix}-tbl`} rows={[...tableBuffer]} />);
            tableBuffer = [];
          }
        };

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]!;

          // Check if line is part of a markdown table
          if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            tableBuffer.push(line.trim());
            continue;
          } else {
            flushTable(`tbl-${blockIndex}-${i}`);
          }

          // Empty line
          if (!line.trim()) {
            continue;
          }

          // Block Math: $$ ... $$ or multi-line $$
          if (line.trim().startsWith('$$')) {
            if (line.trim().endsWith('$$') && line.trim().length > 4) {
              const math = line.trim().slice(2, -2);
              elements.push(<MathBlock key={`blockmath-${blockIndex}-${i}`} math={math} />);
              continue;
            }
            // Multi-line math block
            const mathLines: string[] = [];
            i++;
            while (i < lines.length && lines[i]!.trim() !== '$$') {
              mathLines.push(lines[i]!);
              i++;
            }
            elements.push(
              <MathBlock
                key={`blockmath-${blockIndex}-${i}`}
                math={mathLines.join('\n')}
              />,
            );
            continue;
          }

          // Headings
          if (line.startsWith('### ')) {
            elements.push(
              <h3 key={`h3-${blockIndex}-${i}`} className="mt-3 font-semibold text-sky-300">
                {renderInlineFormatted(line.slice(4), citations, onCitationClick)}
              </h3>,
            );
            continue;
          }
          if (line.startsWith('## ')) {
            elements.push(
              <h2 key={`h2-${blockIndex}-${i}`} className="mt-4 text-base font-bold text-sky-200">
                {renderInlineFormatted(line.slice(3), citations, onCitationClick)}
              </h2>,
            );
            continue;
          }
          if (line.startsWith('# ')) {
            elements.push(
              <h1 key={`h1-${blockIndex}-${i}`} className="mt-5 text-lg font-bold text-white">
                {renderInlineFormatted(line.slice(2), citations, onCitationClick)}
              </h1>,
            );
            continue;
          }

          // Blockquote
          if (line.startsWith('> ')) {
            elements.push(
              <blockquote
                key={`quote-${blockIndex}-${i}`}
                className="my-2 border-l-2 border-sky-400 bg-white/5 pl-3 py-1 italic text-slate-300"
              >
                {renderInlineFormatted(line.slice(2), citations, onCitationClick)}
              </blockquote>,
            );
            continue;
          }

          // Bullet List
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            elements.push(
              <li key={`li-${blockIndex}-${i}`} className="ml-4 list-disc text-slate-200">
                {renderInlineFormatted(line.trim().slice(2), citations, onCitationClick)}
              </li>,
            );
            continue;
          }

          // Numbered List
          const numMatch = line.trim().match(/^([0-9]+)\.\s+(.*)/);
          if (numMatch) {
            elements.push(
              <li key={`num-${blockIndex}-${i}`} className="ml-4 list-decimal text-slate-200">
                {renderInlineFormatted(numMatch[2]!, citations, onCitationClick)}
              </li>,
            );
            continue;
          }

          // Normal Paragraph
          elements.push(
            <p key={`p-${blockIndex}-${i}`} className="leading-relaxed">
              {renderInlineFormatted(line, citations, onCitationClick)}
            </p>,
          );
        }

        flushTable(`tbl-end-${blockIndex}`);
        return <div key={`fragment-${blockIndex}`}>{elements}</div>;
      })}
    </div>
  );
}

/**
 * Parses inline math ($...$), citations ([1]), bold (**...**), and inline code (`...`)
 */
function renderInlineFormatted(
  text: string,
  citations: Citation[],
  onCitationClick?: (citation: Citation) => void,
): React.ReactNode {
  // Regex to split by:
  // 1. Math: \$([^$]+)\$
  // 2. Inline Code: `([^`]+)`
  // 3. Bold: \*\*([^*]+)\*\*
  // 4. Citation: \[(?:cite:)?([0-9]+)\]
  const parts = text.split(/(\$[^$]+\$|`[^`]+`|\*\*[^*]+\*\*|\[[0-9]+\])/g);

  return parts.map((part, index) => {
    if (!part) return null;

    // Inline Math: $...$
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const math = part.slice(1, -1);
      const html = renderKaTeX(math, false);
      return (
        <span
          key={`math-${index}`}
          className="inline-math mx-0.5 text-sky-200"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    // Inline Code: `...`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={`code-${index}`}
          className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-amber-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold: **...**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={`bold-${index}`} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Citation marker: [1], [2], etc.
    const citeMatch = part.match(/^\[([0-9]+)\]$/);
    if (citeMatch) {
      const num = parseInt(citeMatch[1]!, 10);
      const citation = citations[num - 1];

      return (
        <button
          key={`cite-${index}`}
          type="button"
          onClick={() => citation && onCitationClick?.(citation)}
          title={citation ? `${citation.title || citation.chunkId} (p. ${citation.page || 1})` : `Citation [${num}]`}
          className="mx-0.5 inline-flex items-center rounded bg-sky-500/20 px-1.5 py-0.2 text-[11px] font-mono font-medium text-sky-300 hover:bg-sky-500/35 transition"
        >
          [{num}]
        </button>
      );
    }

    return <React.Fragment key={`text-${index}`}>{part}</React.Fragment>;
  });
}
