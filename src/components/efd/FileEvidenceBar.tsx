import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FileStack, CalendarClock, FileText } from 'lucide-react';
import { EFDData } from '@/utils/efdParser';

/** Estrutura mínima de evidência — serve para EFD-Contribuições e SPED Fiscal. */
interface EvidenciaDeArquivo {
  fontes?: { arquivos?: string[]; quantidade?: number };
  cadastro: { periodoInicialDisplay?: string; periodoFinalDisplay?: string };
}

interface FileEvidenceBarProps {
  efdData: EvidenciaDeArquivo | EFDData;
  className?: string;
}

/**
 * Barra de evidência documental: identifica quais arquivos EFD
 * originaram a análise exibida na página.
 */
export const FileEvidenceBar: React.FC<FileEvidenceBarProps> = ({ efdData, className = '' }) => {
  const arquivos = efdData.fontes?.arquivos ?? [];
  const qtd = arquivos.length || efdData.fontes?.quantidade || 1;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/8 via-primary/4 to-transparent px-4 py-3 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <FileStack className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">
            {qtd} arquivo{qtd > 1 ? 's' : ''} EFD analisado{qtd > 1 ? 's' : ''}
          </p>
          <p className="text-xs text-muted-foreground">Base documental desta análise</p>
        </div>
      </div>

      {arquivos.length > 0 && (
        <TooltipProvider delayDuration={200}>
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {arquivos.slice(0, 3).map(nome => (
              <Badge
                key={nome}
                variant="secondary"
                className="font-mono text-[11px] max-w-[220px] truncate"
              >
                <FileText className="w-3 h-3 mr-1 shrink-0" />
                {nome}
              </Badge>
            ))}
            {arquivos.length > 3 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-[11px] cursor-default">
                    +{arquivos.length - 3} outro{arquivos.length - 3 > 1 ? 's' : ''}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-semibold mb-1">Todos os arquivos:</p>
                  <ul className="font-mono text-xs space-y-0.5">
                    {arquivos.map(nome => (
                      <li key={nome}>· {nome}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      )}

      <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
        <CalendarClock className="w-3.5 h-3.5" />
        Período: {efdData.cadastro.periodoInicialDisplay || '—'} a{' '}
        {efdData.cadastro.periodoFinalDisplay || '—'}
      </div>
    </div>
  );
};
