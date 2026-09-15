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
}

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

  // Ao deixar a página, interrompe a narração.
  useEffect(() => {
    return () => {
      if (speechSupported()) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{ mode, setMode, toggleAccessibility, speaking, speak, stopSpeaking }}
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