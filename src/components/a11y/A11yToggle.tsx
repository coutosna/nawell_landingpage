import React from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Button } from '@/components/ui/button';
import { Accessibility } from 'lucide-react';
import { cn } from '@/lib/utils';

interface A11yToggleProps {
  variant?: 'icon' | 'full';
  className?: string;
}

/**
 * Botão que alterna entre o modo padrão e o modo otimizado para pessoas com
 * deficiência visual (alto contraste, foco mais visível, tabelas de dados
 * visíveis sob os gráficos e narração por voz).
 */
export function A11yToggle({ variant = 'icon', className }: A11yToggleProps) {
  const { mode, toggleAccessibility } = useAccessibility();
  const isOn = mode === 'accessible';

  if (variant === 'icon') {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggleAccessibility}
        aria-pressed={isOn}
        aria-label={
          isOn
            ? 'Modo de acessibilidade ativado. Clique para desativar.'
            : 'Ativar modo de acessibilidade para pessoas com deficiência visual.'
        }
        title={`Acessibilidade (${isOn ? 'ativada' : 'desativada'})`}
        className={cn(
          'rounded-xl hover:bg-muted/60 transition-colors',
          isOn && 'bg-primary/15 text-primary hover:bg-primary/20',
          className,
        )}
      >
        <Accessibility className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={isOn ? 'default' : 'outline'}
      onClick={toggleAccessibility}
      aria-pressed={isOn}
      className={cn('gap-2', className)}
    >
      <Accessibility className="h-4 w-4" />
      <span>Acessibilidade para deficiência visual</span>
      <span className={cn('font-semibold', isOn ? 'text-primary-foreground' : 'text-muted-foreground')}>
        {isOn ? '— Ativada' : '— Desativada'}
      </span>
    </Button>
  );
}