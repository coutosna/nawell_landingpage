import { useState } from 'react';
import { Upload, FileText, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export function ESocialUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.xml')) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo .xml do eSocial",
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
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O upload de eventos eSocial estará disponível em breve",
    });
  };

  const loadExample = async () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Arquivo de exemplo estará disponível em breve",
    });
  };

  return (
    <Card className="border-2 shadow-2xl animate-fade-in overflow-hidden group">
      <CardHeader className="bg-gradient-to-br from-esocial-primary/10 via-esocial-primary/5 to-transparent border-b-2 border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-esocial-primary via-esocial-primary to-esocial-primary/80 shadow-xl shadow-esocial-primary/30 group-hover:shadow-2xl group-hover:shadow-esocial-primary/40 transition-all duration-300">
              <Upload className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="font-display text-2xl font-bold bg-gradient-to-r from-esocial-primary to-esocial-primary/80 bg-clip-text text-transparent">
                Upload Eventos eSocial
              </CardTitle>
              <CardDescription className="mt-2 text-base font-medium">
                Faça upload dos arquivos .xml para análise trabalhista
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadExample}
            className="border-2 hover:bg-esocial-primary/10 hover:border-esocial-primary/50 transition-all duration-300 self-start sm:self-center shadow-sm hover:shadow-md"
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
              ? 'border-esocial-primary bg-gradient-to-br from-esocial-primary/15 to-esocial-primary/10 scale-[1.03] shadow-2xl shadow-esocial-primary/30'
              : 'border-border hover:border-esocial-primary/60 hover:bg-gradient-to-br hover:from-esocial-primary/8 hover:to-esocial-primary/5 hover:shadow-xl'
          }`}
        >
          {/* Animated background effects */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-esocial-primary/10 via-transparent to-esocial-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-esocial-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-esocial-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <input
            type="file"
            accept=".xml"
            onChange={handleFileChange}
            className="hidden"
            id="esocial-file-upload"
          />
          <label htmlFor="esocial-file-upload" className="cursor-pointer relative z-10">
            <div className={`mx-auto mb-6 sm:mb-8 h-20 w-20 sm:h-28 sm:w-28 rounded-3xl bg-gradient-to-br from-esocial-primary/25 via-esocial-primary/15 to-esocial-primary/15 flex items-center justify-center transition-all duration-500 shadow-xl ${
              isDragging ? 'scale-125 rotate-12 shadow-2xl shadow-esocial-primary/40' : 'group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-2xl'
            }`}>
              <Upload className={`h-10 w-10 sm:h-14 sm:w-14 text-esocial-primary transition-all duration-500 ${isDragging ? 'scale-125 animate-bounce' : 'group-hover:scale-115'}`} />
            </div>
            <p className="font-display text-xl sm:text-3xl font-extrabold mb-3 bg-gradient-to-r from-esocial-primary via-esocial-primary to-esocial-primary bg-clip-text text-transparent">
              Arraste seus arquivos XML aqui
            </p>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 font-semibold">
              ou clique para selecionar do seu computador
            </p>
            <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs flex-wrap">
              <Badge variant="secondary" className="shadow-md hover:shadow-lg transition-shadow text-xs px-4 py-1.5 border-2">
                📄 Formato: .xml
              </Badge>
              <Badge variant="secondary" className="shadow-md hover:shadow-lg transition-shadow text-xs px-4 py-1.5 border-2">
                📦 Múltiplos arquivos
              </Badge>
              <Badge variant="secondary" className="shadow-md hover:shadow-lg transition-shadow text-xs px-4 py-1.5 border-2">
                ⚡ Em breve
              </Badge>
            </div>
          </label>
        </div>

        <Alert className="mt-8 border-2 border-esocial-primary/30 bg-gradient-to-br from-esocial-primary/8 via-esocial-primary/5 to-transparent shadow-lg">
          <Info className="h-5 w-5 text-esocial-primary" />
          <AlertDescription className="text-sm font-medium">
            <span className="font-bold text-esocial-primary">⏳ Módulo em desenvolvimento:</span> Em breve você poderá fazer upload de eventos eSocial (S-1000, S-2200, S-1200, etc.) e visualizar análises completas.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
