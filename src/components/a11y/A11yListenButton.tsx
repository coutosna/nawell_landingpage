import React from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface A11yListenButtonProps {
  /** Texto a ser narrado em voz alta (pt-BR). */
  text: string;
  label?: string;
  className?: string;
}

/**
 * Botão "Ouvir em voz alta" que usa o sintetizador de voz do navegador (Web
 * Speech API) para ler um resumo em português. Complementa o leitor de tela —
 * útil também na demonstração para um investidor.
 */
export function A11yListenButton({ text, label = 'Ouvir resumo', className }: A11yListenButtonProps) {
  const { speaking, speak, stopSpeaking } = useAccessibility();

  if (!text.trim()) return null;

  const active = speaking;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => (speaking ? stopSpeaking() : speak(text))}
      aria-pressed={active}
      aria-label={active ? 'Parar a narração' : 'Ouvir em voz alta'}
      className={cn('gap-2 shadow-sm', active && 'border-primary/50 bg-primary/10 text-primary', className)}
    >
      {active ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      <span>{active ? 'Parar' : label}</span>
    </Button>
  );
}