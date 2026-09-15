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
  /** Lê a tela atual em voz alta; se já estiver falando, interrompe. */
  readPageAloud: () => void;
  /** Lê a tela atual em voz alta (sem alternar), usado na narração automática. */
  narratePage: () => void;
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

const LIMITE_TEXTO_TELA = 4000;

const dividirEmBlocos = (texto: string, max = 220): string[] => {
  const frases = texto.replace(/\s+/g, ' ').trim().split(/(?<=[.!?;:])\s+/);
  const blocos: string[] = [];
  let atual = '';
  for (const frase of frases) {
    if (atual && (atual + ' ' + frase).length > max) {
      blocos.push(atual);
      atual = frase;
    } else {
      atual = atual ? `${atual} ${frase}` : frase;
    }
  }
  if (atual) blocos.push(atual);
  return blocos;
};

const limparTexto = (el: HTMLElement | null) => el?.innerText?.replace(/\s+/g, ' ').trim() ?? '';

/** Sem resumo registrado, lê a aba ativa mais interna (ou o conteúdo principal) da tela. */
const textoVisivelDaTela = (): string => {
  const paineis = document.querySelectorAll<HTMLElement>('[role="tabpanel"][data-state="active"]');
  const painel = paineis.length > 0 ? paineis[paineis.length - 1] : null;
  if (painel) {
    const aba = document.querySelector<HTMLElement>(`[role="tab"][aria-controls="${painel.id}"]`);
    const nomeAba = limparTexto(aba).replace(/^[^\p{L}\p{N}]+/u, '');
    const corpo = limparTexto(painel);
    if (corpo) return `${nomeAba ? `Aba ${nomeAba}. ` : ''}${corpo.slice(0, LIMITE_TEXTO_TELA)}`;
  }
  const corpo = limparTexto(document.querySelector('main')) || limparTexto(document.body);
  return corpo ? `${document.title}. ${corpo.slice(0, LIMITE_TEXTO_TELA)}` : `${document.title}. Nenhum conteúdo para narrar nesta tela.`;
};

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
    // Chrome corta falas longas (~15s), então o texto vai em blocos por frase.
    const blocos = dividirEmBlocos(text);
    blocos.forEach((bloco, i) => {
      const utterance = new SpeechSynthesisUtterance(bloco);
      utterance.lang = 'pt-BR';
      utterance.rate = 1;
      if (voiceRef.current) utterance.voice = voiceRef.current;
      if (i === 0) utterance.onstart = () => setSpeaking(true);
      if (i === blocos.length - 1) utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    });
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

  const narratePage = useCallback(() => {
    const ordens = [...pageSummariesRef.current.keys()];
    const resumo = ordens.length > 0 ? pageSummariesRef.current.get(Math.max(...ordens)) ?? '' : '';
    speak(resumo || textoVisivelDaTela());
  }, [speak]);

  const readPageAloud = useCallback(() => {
    if (speaking) stopSpeaking();
    else narratePage();
  }, [speaking, stopSpeaking, narratePage]);

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
      value={{ mode, setMode, toggleAccessibility, speaking, speak, stopSpeaking, registerPageSummary, readPageAloud, narratePage }}
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
  useEffect(() => (text ? registerPageSummary(order, text) : undefined), [registerPageSummary, order, text]);
};
