import { AppLayout } from '@/components/layout/AppLayout';
import { NaWellLogo } from '@/components/ecf/NaWellBrand';
import { ESocialUpload } from '@/components/esocial/ESocialUpload';
import { Users2 } from 'lucide-react';
import { usePageSummary } from '@/contexts/AccessibilityContext';

export default function ESocialModule() {
  usePageSummary('Módulo eSocial. Gestão e validação de obrigações trabalhistas — envie o evento S-1299 do eSocial para começar.');

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in font-manrope">
        <div className="space-y-6">
          <NaWellLogo />
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-sidebar shadow-sm flex items-center justify-center ring-1 ring-border">
              <Users2 className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl sm:text-5xl font-manrope font-extrabold text-foreground tracking-tight">
                eSocial
              </h1>
              <p className="text-base text-muted-foreground font-medium mt-1.5">
                Gestão e validação de obrigações trabalhistas
              </p>
            </div>
          </div>
        </div>

        <ESocialUpload />
      </div>
    </AppLayout>
  );
}