import { useState } from 'react';
import { Upload, FileText, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ReformaTributariaUploadProps {
  onFileUpload: (conteudo: string, nomeArquivo: string) => void;
}

export function ReformaTributariaUpload({ onFileUpload }: ReformaTributariaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.txt')) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo .txt da EFD",
          variant: "destructive",
        });
        return;
      }
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const conteudo = e.target?.result as string;
      if (conteudo) {
        onFileUpload(conteudo, file.name);
      }
    };
    reader.onerror = () => {
      toast({
        title: "Erro ao ler arquivo",
        description: "Não foi possível ler o arquivo. Tente novamente.",
        variant: "destructive",
      });
    };
    reader.readAsText(file, 'ISO-8859-1');
  };

  const loadExample = async () => {
    try {
      const response = await fetch('/teste-efd.txt');
      const text = await response.text();
      const blob = new Blob([text], { type: 'text/plain' });
      const file = new File([blob], 'teste-efd.txt', { type: 'text/plain' });
      processFile(file);
      toast({
        title: "Arquivo de exemplo carregado",
        description: "Analisando dados fiscais de demonstração",
      });
    } catch (error) {
      toast({
        title: "Erro ao carregar exemplo",
        description: "Não foi possível carregar o arquivo de exemplo",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-2 shadow-2xl animate-fade-in overflow-hidden group">
      <CardHeader className="bg-gradient-to-br from-reforma-primary/10 via-reforma-primary/5 to-transparent border-b-2 border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-reforma-primary via-reforma-primary to-reforma-primary/80 shadow-xl shadow-reforma-primary/30 group-hover:shadow-2xl group-hover:shadow-reforma-primary/40 transition-all duration-300">
              <Upload className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="font-display text-2xl font-bold bg-gradient-to-r from-reforma-primary to-reforma-primary/80 bg-clip-text text-transparent">
                Upload EFD para Reforma Tributária
              </CardTitle>
              <CardDescription className="mt-2 text-base font-medium">
                Faça upload do arquivo .txt para simulação CBS/IBS (2026-2033)
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadExample}
            className="border-2 hover:bg-reforma-primary/10 hover:border-reforma-primary/50 transition-all duration-300 self-start sm:self-center shadow-sm hover:shadow-md"
          >
            <FileText className="h-4 w-4 mr-2" />
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
          className={`relative border-3 border-dashed rounded-3xl p-8 sm:p-16 text-center transition-all duration-500 cursor-pointer group ${
            isDragging
              ? 'border-reforma-primary bg-gradient-to-br from-reforma-primary/15 to-reforma-primary/10 scale-[1.03] shadow-2xl shadow-reforma-primary/30'
              : 'border-border hover:border-reforma-primary/60 hover:bg-gradient-to-br hover:from-reforma-primary/8 hover:to-reforma-primary/5 hover:shadow-xl'
          }`}
        >
          {/* Animated background effects */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-reforma-primary/10 via-transparent to-reforma-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-reforma-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-reforma-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <input
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="hidden"
            id="reforma-file-upload"
          />
          <label htmlFor="reforma-file-upload" className="cursor-pointer relative z-10">
            <div className={`mx-auto mb-6 sm:mb-8 h-20 w-20 sm:h-28 sm:w-28 rounded-3xl bg-gradient-to-br from-reforma-primary/25 via-reforma-primary/15 to-reforma-primary/15 flex items-center justify-center transition-all duration-500 shadow-xl ${
              isDragging ? 'scale-125 rotate-12 shadow-2xl shadow-reforma-primary/40' : 'group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-2xl'
            }`}>
              <Upload className={`h-10 w-10 sm:h-14 sm:w-14 text-reforma-primary transition-all duration-500 ${isDragging ? 'scale-125 animate-bounce' : 'group-hover:scale-115'}`} />
            </div>
            <p className="font-display text-xl sm:text-3xl font-extrabold mb-3 bg-gradient-to-r from-reforma-primary via-reforma-primary to-reforma-primary bg-clip-text text-transparent">
              Arraste seu arquivo EFD aqui
            </p>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 font-semibold">
              ou clique para selecionar do seu computador
            </p>
            <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs flex-wrap">
              <Badge variant="secondary" className="shadow-md hover:shadow-lg transition-shadow text-xs px-4 py-1.5 border-2">
                📄 Formato: .txt
              </Badge>
              <Badge variant="secondary" className="shadow-md hover:shadow-lg transition-shadow text-xs px-4 py-1.5 border-2">
                📦 Máx: 50MB
              </Badge>
              <Badge variant="secondary" className="shadow-md hover:shadow-lg transition-shadow text-xs px-4 py-1.5 border-2">
                ⚡ Análise Rápida
              </Badge>
            </div>
          </label>
        </div>

        <Alert className="mt-8 border-2 border-reforma-primary/30 bg-gradient-to-br from-reforma-primary/8 via-reforma-primary/5 to-transparent shadow-lg">
          <Info className="h-5 w-5 text-reforma-primary" />
          <AlertDescription className="text-sm font-medium">
            <span className="font-bold text-reforma-primary">🔒 Segurança garantida:</span> O arquivo é processado 100% localmente no seu navegador. Nenhum dado é enviado para servidores externos ou terceiros.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
