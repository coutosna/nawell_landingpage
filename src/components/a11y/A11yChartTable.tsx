import React from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { cn } from '@/lib/utils';

type CellValue = string | number;

interface A11yChartTableProps {
  /** Texto que descreve a tabela (áudio do leitor de tela / legenda visível) */
  caption: string;
  headers: string[];
  rows: CellValue[][];
  className?: string;
}

/**
 * Dados de um gráfico em formato tabular.
 *
 * No modo padrão, a tabela fica visualmente escondida (sr-only), mas continua
 * legível por leitores de tela. No modo acessível, ela aparece visível com alto
 * contraste para quem tem baixa visão.
 */
export function A11yChartTable({ caption, headers, rows, className }: A11yChartTableProps) {
  const { mode } = useAccessibility();
  const visible = mode === 'accessible';

  return (
    <div
      className={cn(
        visible &&
          'mt-6 rounded-xl border-2 border-border bg-background p-4 shadow-sm print:hidden',
        !visible && 'sr-only',
        className,
      )}
    >
      <table className="w-full border-collapse text-left text-sm">
        <caption className={cn('mb-2 text-left font-semibold', visible && 'text-foreground')}>
          {caption}
        </caption>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={`h-${i}`}
                scope="col"
                className={cn(
                  'border-b-2 border-border px-3 py-2 font-bold',
                  visible ? 'text-foreground' : undefined,
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={`r-${ri}`} className="border-b border-border/60">
              {row.map((cell, ci) => (
                <td key={`c-${ri}-${ci}`} className="px-3 py-2" data-label={headers[ci]}>
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