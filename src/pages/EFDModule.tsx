import { AppLayout } from '@/components/layout/AppLayout';
import { EFDAnalyzer } from '@/components/efd/EFDAnalyzer';
import { NaWellLogo } from '@/components/ecf/NaWellBrand';
import { useSearchParams } from 'react-router-dom';
import { FileBarChart } from 'lucide-react';

export default function EFDModule() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'upload';

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in font-manrope">
        <div className="space-y-6">
          <NaWellLogo />
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-sidebar shadow-sm flex items-center justify-center ring-1 ring-border">
              <FileBarChart className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl sm:text-5xl font-manrope font-extrabold text-foreground tracking-tight">
                EFD
              </h1>
              <p className="text-base text-muted-foreground font-medium mt-1.5">
                Análise completa de Escrituração Fiscal Digital
              </p>
            </div>
          </div>
        </div>

        <EFDAnalyzer initialTab={tab} />
      </div>
    </AppLayout>
  );
}