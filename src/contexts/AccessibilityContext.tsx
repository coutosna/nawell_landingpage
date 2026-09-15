import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';

export type AccessibilityMode = 'standard' | 'accessible';

interface AccessibilityContextType {
  /** 'standard' = visual padrão; 'accessible' = otimizado para pessoas com deficiência visual */
  mode: AccessibilityMode;
  setMode: (mode: AccessibilityMode) => void;
  toggleAccessibility: () => void;
  /** true enquanto o sintetizador de voz estiver falando */
  speaking: boolean;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  /** Registra o resumo narrado de um componente; prefira o hook usePageSummary. */
  registerPageSummary: (order: number, text: string) => () => void;
  /** Lê em voz alta o resumo registrado da página (ou o conteúdo principal). */
  readPageAloud: () => void;
}

/** Atalhos de teclado globais para acessibilidade:
 *  - Alt + A: liga/desliga o modo "deficiência visual" (anuncia a mudança por voz)
 *  - Alt + V: lê em voz alta a página atual (resumo narrado quando disponível) */
const KEY_TOGGLE_MODE = 'KeyA';
const KEY_READ_PAGE = 'KeyV';

let summaryOrderCounter = 0;

const STORAGE_KEY = 'nawell-a11y-mode';

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const speechSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<AccessibilityMode>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'accessible' ? 'accessible' : 'standard';
    } catch {
      return 'standard';
    }
  });
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const pageSummariesRef = useRef<Map<number, string>>(new Map());
  const prevModeRef = useRef(mode);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('a11y-accessible', mode === 'accessible');
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* storage indisponível — segue sem persistir */
    }
  }, [mode]);

  // Carrega a voz em português o quanto antes (a lista chega de forma assíncrona).
  useEffect(() => {
    if (!speechSupported()) return;
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find(v => v.lang.toLowerCase().startsWith('pt-br')) ??
        voices.find(v => v.lang.toLowerCase().startsWith('pt')) ??
        null;
    };
    pickVoice();
    window.speechSynthesis.addEventListener('voiceschanged', pickVoice);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pickVoice);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (!speechSupported()) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!speechSupported() || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1;
    if (voiceRef.current) utterance.voice = voiceRef.current;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const toggleAccessibility = useCallback(() => {
    setMode(prev => (prev === 'accessible' ? 'standard' : 'accessible'));
  }, []);

  const registerPageSummary = useCallback((order: number, text: string) => {
    pageSummariesRef.current.set(order, text);
    return () => {
      pageSummariesRef.current.delete(order);
    };
  }, []);

  const readPageAloud = useCallback(() => {
    if (speaking) {
      stopSpeaking();
      return;
    }
    const ordens = [...pageSummariesRef.current.keys()];
    let texto = ordens.length > 0 ? pageSummariesRef.current.get(Math.max(...ordens)) ?? '' : '';
    if (!texto) {
      const main = document.querySelector('main');
      const corpo = main?.innerText?.replace(/\s+/g, ' ').trim() ?? '';
      texto = corpo.length > 0
        ? `${document.title}. ${corpo.slice(0, 1400)}`
        : `${document.title}. Nenhum conteúdo para narrar nesta página.`;
    }
    speak(texto);
  }, [speak, speaking, stopSpeaking]);

  // Anuncia por voz quando o modo muda (inclusive pelo atalho Alt+A).
  useEffect(() => {
    if (prevModeRef.current === mode) return;
    prevModeRef.current = mode;
    speak(
      mode === 'accessible'
        ? 'Modo de acessibilidade para deficiência visual ativado.'
        : 'Modo de acessibilidade padrão ativado.',
    );
  }, [mode, speak]);

  // Atalhos globais de teclado (Alt+A / Alt+V).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      // event.code porque no macOS Option+A gera "å" em event.key.
      if (event.code === KEY_TOGGLE_MODE) {
        event.preventDefault();
        toggleAccessibility();
      } else if (event.code === KEY_READ_PAGE) {
        event.preventDefault();
        readPageAloud();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleAccessibility, readPageAloud]);

  // Ao deixar a página, interrompe a narração.
  useEffect(() => {
    return () => {
      if (speechSupported()) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{ mode, setMode, toggleAccessibility, speaking, speak, stopSpeaking, registerPageSummary, readPageAloud }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility deve ser usado dentro de AccessibilityProvider');
  }
  return context;
};

/** Registra o resumo lido pelo Alt+V enquanto o componente estiver montado; o mais aninhado prevalece. */
export const usePageSummary = (text: string) => {
  const { registerPageSummary } = useAccessibility();
  const [order] = useState(() => ++summaryOrderCounter);
  useEffect(() => registerPageSummary(order, text), [registerPageSummary, order, text]);
};
