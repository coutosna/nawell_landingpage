import React, { useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, X, CheckCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EFDFile {
  name: string;
  content: string;
  size: number;
}

interface OptionalFiles {
  tabela4310?: EFDFile;
  tabela4313?: EFDFile;
  tabela4314?: EFDFile;
  selic?: EFDFile;
}

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
}

interface FileUploadPropsOld {
  efdFile: EFDFile | null;
  optionalFiles: OptionalFiles;
  onEfdFileUpload: (file: EFDFile | null) => void;
  onOptionalFileUpload: (type: keyof OptionalFiles, file: EFDFile) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect }) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = React.useState(false);

  const processFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const validos = files.filter(f => f.name.toLowerCase().endsWith('.txt'));
    const invalidos = files.filter(f => !f.name.toLowerCase().endsWith('.txt'));

    if (invalidos.length > 0) {
      toast({
        title: "Formato inválido",
        description: `Ignorado(s): ${invalidos.map(f => f.name).join(', ')}. Apenas arquivos .txt são aceitos.`,
        variant: "destructive",
      });
    }

    if (validos.length > 0) {
      onFilesSelect(validos);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  const loadExample = async () => {
    try {
      const response = await fetch('/exemplo-efd.txt');
      const text = await response.text();
      const blob = new Blob([text], { type: 'text/plain' });
      const file = new File([blob], 'exemplo-efd.txt', { type: 'text/plain' });
      onFilesSelect([file]);
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
      <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b-2 border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-xl shadow-primary/30 group-hover:shadow-2xl group-hover:shadow-primary/40 transition-all duration-300">
              <Upload className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="font-display text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Upload EFD Contribuições
              </CardTitle>
              <CardDescription className="mt-2 text-base font-medium">
                Faça upload de um ou vários arquivos .txt para análise automática e inteligente
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadExample}
            className="border-2 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 self-start sm:self-center shadow-sm hover:shadow-md"
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
              ? 'border-primary bg-gradient-to-br from-primary/15 to-accent/10 scale-[1.03] shadow-2xl shadow-primary/30'
              : 'border-border hover:border-primary/60 hover:bg-gradient-to-br hover:from-primary/8 hover:to-accent/5 hover:shadow-xl'
          }`}
        >
          {/* Animated background effects */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <input
            type="file"
            accept=".txt"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer relative z-10">
            <div className={`mx-auto mb-6 sm:mb-8 h-20 w-20 sm:h-28 sm:w-28 rounded-3xl bg-gradient-to-br from-primary/25 via-primary/15 to-accent/15 flex items-center justify-center transition-all duration-500 shadow-xl ${
              isDragging ? 'scale-125 rotate-12 shadow-2xl shadow-primary/40' : 'group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-2xl'
            }`}>
              <Upload className={`h-10 w-10 sm:h-14 sm:w-14 text-primary transition-all duration-500 ${isDragging ? 'scale-125 animate-bounce' : 'group-hover:scale-115'}`} />
            </div>
            <p className="font-display text-xl sm:text-3xl font-extrabold mb-3 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Arraste seus arquivos EFD aqui
            </p>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 font-semibold">
              ou clique para selecionar um ou vários arquivos do seu computador
            </p>
            <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs flex-wrap">
              <Badge variant="secondary" className="shadow-md hover:shadow-lg transition-shadow text-xs px-4 py-1.5 border-2">
                📄 Formato: .txt
              </Badge>
              <Badge variant="secondary" className="shadow-md hover:shadow-lg transition-shadow text-xs px-4 py-1.5 border-2">
                📦 Máx: 50MB por arquivo
              </Badge>
              <Badge variant="secondary" className="shadow-md hover:shadow-lg transition-shadow text-xs px-4 py-1.5 border-2">
                🗂️ Múltiplos arquivos
              </Badge>
              <Badge variant="secondary" className="shadow-md hover:shadow-lg transition-shadow text-xs px-4 py-1.5 border-2">
                ⚡ Análise Rápida
              </Badge>
            </div>
          </label>
        </div>

        <Alert className="mt-8 border-2 border-primary/30 bg-gradient-to-br from-primary/8 via-primary/5 to-transparent shadow-lg">
          <Info className="h-5 w-5 text-primary" />
          <AlertDescription className="text-sm font-medium">
            <span className="font-bold text-primary">🔒 Segurança garantida:</span> O arquivo é processado 100% localmente no seu navegador. Nenhum dado é enviado para servidores externos ou terceiros.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export const FileUploadOld: React.FC<FileUploadPropsOld> = ({
  efdFile,
  optionalFiles,
  onEfdFileUpload,
  onOptionalFileUpload
}) => {
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileRead = useCallback((file: File, onSuccess: (efdFile: EFDFile) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const efdFile: EFDFile = {
        name: file.name,
        content: content,
        size: file.size
      };
      onSuccess(efdFile);
      toast({
        title: "Arquivo carregado",
        description: `${file.name} foi carregado com sucesso.`,
      });
    };
    reader.onerror = () => {
      toast({
        title: "Erro no upload",
        description: "Não foi possível ler o arquivo.",
        variant: "destructive",
      });
    };
    reader.readAsText(file, 'latin1');
  }, [toast]);

  const handleEfdFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.txt')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo .TXT da EFD Contribuições.",
        variant: "destructive",
      });
      return;
    }

    handleFileRead(file, onEfdFileUpload);
  };

  const handleOptionalFileUpload = (type: keyof OptionalFiles) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo .CSV.",
        variant: "destructive",
      });
      return;
    }

    handleFileRead(file, (efdFile) => onOptionalFileUpload(type, efdFile));
  };

  const removeOptionalFile = (type: keyof OptionalFiles) => {
    onOptionalFileUpload(type, undefined as any);
  };

  const FileUploadCard = ({ 
    title, 
    description, 
    file, 
    onUpload, 
    onRemove, 
    accept = ".txt",
    required = false 
  }: {
    title: string;
    description: string;
    file?: EFDFile;
    onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove?: () => void;
    accept?: string;
    required?: boolean;
  }) => (
    <Card className={`transition-all duration-200 ${file ? 'ring-2 ring-success/20 bg-success/5' : 'hover:bg-muted/50'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
          <span className="flex items-center gap-2 min-w-0">
            {file ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" /> : <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />}
            <span className="truncate">{title}</span>
          </span>
          {required && <Badge variant="destructive" className="text-xs flex-shrink-0">Obrigatório</Badge>}
        </CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {file ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <Button variant="outline" size="sm" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Trocar Arquivo
                </Button>
                <input
                  type="file"
                  className="hidden"
                  accept={accept}
                  onChange={onUpload}
                />
              </label>
              {onRemove && (
                <Button variant="ghost" size="sm" onClick={onRemove}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-lg p-4 sm:p-6 text-center hover:border-primary transition-colors">
            <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
            <label className="cursor-pointer">
              <span className="text-xs sm:text-sm font-medium text-primary hover:text-primary-hover">
                Clique para selecionar
              </span>
              <input
                type="file"
                className="hidden"
                accept={accept}
                onChange={onUpload}
              />
            </label>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              ou arraste o arquivo aqui
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Faça upload do arquivo EFD Contribuições (.TXT) para iniciar a análise.
          O sistema analisará automaticamente os regimes tributários e detectará divergências.
        </AlertDescription>
      </Alert>

      <FileUploadCard
        title="Arquivo EFD Contribuições"
        description="Arquivo principal .TXT gerado pelo sistema contábil"
        file={efdFile}
        onUpload={handleEfdFileUpload}
        onRemove={() => onEfdFileUpload(null)}
        accept=".txt"
        required={true}
      />
    </div>
  );
};