import { useState } from 'react';
import { ReformaTributariaUpload } from './ReformaTributariaUpload';
import { ReformaTributariaSummary } from './ReformaTributariaSummary';
import { ReformaTributariaCharts } from './ReformaTributariaCharts';
import { ReformaTributariaTable } from './ReformaTributariaTable';
import { parsearEfdParaReformaConsumo } from '@/utils/reformaTributariaParser';
import { simularTransicaoReformaConsumo, ResumoAno } from '@/utils/reformaTributariaCalculations';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ReformaTributariaAnalyzer() {
  const [processando, setProcessando] = useState(false);
  const [resultados, setResultados] = useState<ResumoAno[] | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState<string>("");

  const handleFileUpload = async (conteudo: string, nome: string) => {
    setProcessando(true);
    setNomeArquivo(nome);
    
    try {
      toast.info('Processando EFD...', { description: 'Aguarde enquanto analisamos o arquivo' });

      // Simula um pequeno delay para mostrar o loading
      await new Promise(resolve => setTimeout(resolve, 500));

      const { itens } = parsearEfdParaReformaConsumo(conteudo);
      
      if (itens.length === 0) {
        toast.error('Nenhum item encontrado', { 
          description: 'Não foram encontrados itens de saída válidos na EFD' 
        });
        setProcessando(false);
        return;
      }

      const resumo = simularTransicaoReformaConsumo(itens);
      
      setResultados(resumo);
      
      toast.success('Análise concluída!', { 
        description: `${itens.length} itens processados com sucesso` 
      });
    } catch (error) {
      console.error('Erro ao processar EFD:', error);
      toast.error('Erro ao processar arquivo', { 
        description: 'Verifique se o arquivo está no formato correto' 
      });
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="space-y-6">
      <ReformaTributariaUpload onFileUpload={handleFileUpload} />

      {processando && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-reforma-primary" />
            <p className="text-lg font-medium">Processando EFD...</p>
            <p className="text-sm text-muted-foreground">Analisando itens e simulando transição</p>
          </div>
        </div>
      )}

      {resultados && resultados.length > 0 && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-reforma-primary to-reforma-primary bg-clip-text text-transparent">
                Resultados da Simulação
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Arquivo: {nomeArquivo} | Transição 2026-2033
              </p>
            </div>
          </div>

          <ReformaTributariaSummary dados={resultados} />
          <ReformaTributariaCharts dados={resultados} />
          <ReformaTributariaTable dados={resultados} />
        </div>
      )}
    </div>
  );
}
