import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAccessibility } from '@/contexts/AccessibilityContext';

const ATRASO_NARRACAO_MS = 700;
const TECLAS_DE_ABA = new Set(['Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

/** No modo acessível, narra a tela sozinho ao trocar de página ou de aba. */
export function A11yAutoNarrator() {
  const { mode, narratePage } = useAccessibility();
  const { pathname } = useLocation();
  const ativo = mode === 'accessible';

  useEffect(() => {
    if (!ativo) return;
    const timer = window.setTimeout(narratePage, ATRASO_NARRACAO_MS);
    return () => window.clearTimeout(timer);
  }, [ativo, pathname, narratePage]);

  useEffect(() => {
    if (!ativo) return;
    let timer: number | undefined;
    const aoInteragir = (event: Event) => {
      const alvo = event.target as HTMLElement | null;
      if (!alvo?.closest('[role="tab"]')) return;
      if (event instanceof KeyboardEvent && !TECLAS_DE_ABA.has(event.key)) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(narratePage, ATRASO_NARRACAO_MS);
    };
    document.addEventListener('click', aoInteragir);
    document.addEventListener('keyup', aoInteragir);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('click', aoInteragir);
      document.removeEventListener('keyup', aoInteragir);
    };
  }, [ativo, narratePage]);

  return null;
}
