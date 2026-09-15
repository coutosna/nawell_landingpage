import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface A11yReadPageButtonProps {
  /** 'icon' para o cabeçalho; 'floating' para telas sem cabeçalho (login, 404). */
  variant?: 'icon' | 'floating';
  className?: string;
}

export function A11yReadPageButton({ variant = 'icon', className }: A11yReadPageButtonProps) {
  const { speaking, readPageAloud } = useAccessibility();
  const label = speaking ? 'Parar a narração da tela. Atalho Alt e V.' : 'Ouvir a tela em voz alta. Atalho Alt e V.';
  const Icone = speaking ? VolumeX : Volume2;

  if (variant === 'floating') {
    return (
      <Button
        type="button"
        onClick={readPageAloud}
        aria-pressed={speaking}
        aria-label={label}
        title="Ouvir a tela — atalho Alt+V (Option+V no Mac)"
        className={cn('fixed bottom-6 right-6 z-50 gap-2 rounded-full shadow-lg', className)}
      >
        <Icone className="h-5 w-5" />
        <span>{speaking ? 'Parar' : 'Ouvir tela'}</span>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={readPageAloud}
      aria-pressed={speaking}
      aria-label={label}
      title="Ouvir a tela — atalho Alt+V (Option+V no Mac)"
      className={cn('rounded-xl hover:bg-muted/60 transition-colors', speaking && 'bg-primary/15 text-primary', className)}
    >
      <Icone className="h-5 w-5" />
    </Button>
  );
}
