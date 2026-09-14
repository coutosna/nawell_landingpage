import { Upload, FileText, Info, CheckCircle2, FileCode } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { parseECF } from "@/utils/ecfParser";
import { analisarECF } from "@/utils/ecfCalculations";
import { ECFAnaliseCompleta } from "@/utils/ecfCalculations";
import { toast } from "@/hooks/use-toast";

interface ECFUploadProps {
  onAnaliseCompleta: (analise: ECFAnaliseCompleta) => void;
}

export function ECFUpload({ onAnaliseCompleta }: ECFUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const processarArquivo = async (file: File) => {
    setIsProcessing(true);
    setSucesso(false);

    try {
      const conteudo = await file.text();
      const doc = parseECF(conteudo);
      const analise = analisarECF(doc);
      
      toast({
        title: "✅ Upload concluído!",
        description: "Gerando resumo da análise...",
        duration: 2000,
      });
      
      setSucesso(true);
      onAnaliseCompleta(analise);
      setTimeout(() => setSucesso(false), 3000);
    } catch (error) {
      toast({
        title: "❌ Erro ao processar ECF",
        description: error instanceof Error ? error.message : "Verifique o formato do arquivo",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const carregarArquivoTeste = async () => {
    setIsProcessing(true);
    setSucesso(false);

    try {
      const response = await fetch('/ecf-teste.txt');
      if (!response.ok) throw new Error("Arquivo de teste não encontrado");
      
      const conteudo = await response.text();
      const doc = parseECF(conteudo);
      const analise = analisarECF(doc);
      
      toast({
        title: "✅ Arquivo de exemplo carregado",
        description: "Analisando dados fiscais de demonstração",
        duration: 2000,
      });
      
      setSucesso(true);
      onAnaliseCompleta(analise);
      setTimeout(() => setSucesso(false), 3000);
    } catch (error) {
      toast({
        title: "❌ Erro ao carregar teste",
        description: "Não foi possível carregar o arquivo de exemplo",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.txt')) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo .txt da ECF",
          variant: "destructive",
        });
        return;
      }
      processarArquivo(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processarArquivo(file);
  };

  return (
    <Card className="border border-border/70 shadow-sm animate-fade-in overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-ecf-primary/10 border border-ecf-primary/20">
              <Upload className="h-7 w-7 text-ecf-primary" />
            </div>
            <div>
              <CardTitle className="font-manrope text-2xl font-bold text-ecf-secondary">
                Upload ECF x ECD
              </CardTitle>
              <CardDescription className="mt-2 text-base font-medium">
                Faça upload do arquivo .txt para análise contábil fiscal
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={carregarArquivoTeste}
            disabled={isProcessing}
            className="self-start sm:self-center transition-all duration-300 hover:bg-ecf-primary/10 hover:border-ecf-primary/40"
          >
            <FileCode className="h-4 w-4 mr-2" />
            Carregar Exemplo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-16 text-center transition-all duration-300 cursor-pointer group ${
            isDragging
              ? 'border-ecf-primary bg-ecf-primary/5'
              : 'border-border hover:border-ecf-primary/50 hover:bg-ecf-primary/[0.03]'
          }`}
        >
          <input
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="hidden"
            id="ecf-file-upload"
            disabled={isProcessing}
          />
          <label htmlFor="ecf-file-upload" className="cursor-pointer relative z-10 block">
            <div className={`mx-auto mb-6 sm:mb-8 h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-ecf-primary/10 border border-ecf-primary/20 flex items-center justify-center transition-all duration-300 ${
              isDragging ? 'scale-110' : 'group-hover:scale-105'
            }`}>
              {isProcessing ? (
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-ecf-primary animate-pulse" />
              ) : (
                <Upload className={`h-10 w-10 sm:h-12 sm:w-12 text-ecf-primary transition-all duration-300 ${isDragging ? 'scale-110' : ''}`} />
              )}
            </div>
            <p className="font-manrope text-xl sm:text-2xl font-bold text-ecf-secondary">
              {isProcessing ? "Processando arquivo..." : "Arraste seu arquivo ECF aqui"}
            </p>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 font-medium">
              ou clique para selecionar do seu computador
            </p>
            <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs flex-wrap">
              <Badge variant="secondary" className="text-xs px-4 py-1.5">
                📄 Formato: .txt
              </Badge>
              <Badge variant="secondary" className="text-xs px-4 py-1.5">
                📦 Máx: 50MB
              </Badge>
              <Badge variant="secondary" className="text-xs px-4 py-1.5">
                ⚡ Análise Rápida
              </Badge>
            </div>
          </label>
        </div>

        {sucesso && (
          <Alert className="mt-8 border border-ecf-primary/30 bg-ecf-primary/5 animate-scale-in">
            <CheckCircle2 className="h-5 w-5 text-ecf-primary" />
            <AlertDescription className="text-sm font-medium text-ecf-primary">
              <span className="font-bold">✅ Upload concluído!</span> Gerando resumo da análise...
            </AlertDescription>
          </Alert>
        )}

        <Alert className="mt-8 border border-border/70 bg-muted/30">
          <Info className="h-5 w-5 text-ecf-primary" />
          <AlertDescription className="text-sm font-medium">
            <span className="font-bold text-ecf-secondary">🔒 Segurança garantida:</span> O arquivo é processado 100% localmente no seu navegador. Nenhum dado é enviado para servidores externos ou terceiros.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
