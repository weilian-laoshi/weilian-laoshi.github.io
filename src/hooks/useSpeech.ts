import { useState, useEffect, useCallback, useRef } from 'react';

// Language code normalizer
export function normalizeLanguageCode(lang?: string): string {
  if (!lang) return 'en-US';
  const l = lang.toLowerCase();
  if (l === 'chinese' || l.startsWith('zh')) return 'zh-CN';
  if (l === 'spanish' || l.startsWith('es')) return 'es-ES';
  if (l === 'german' || l.startsWith('de')) return 'de-DE';
  if (l === 'english' || l.startsWith('en')) return 'en-US';
  return lang;
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(true);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const watchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-load and sync voices on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadVoices = () => {
      try {
        if ('speechSynthesis' in window) {
          const v = window.speechSynthesis.getVoices();
          if (v && v.length > 0) {
            voicesRef.current = v;
          }
        }
      } catch {
        // ignore
      }
    };

    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Mobile audio context unlock on first touch
    const handleFirstTouch = () => {
      try {
        if ('speechSynthesis' in window && window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('touchstart', handleFirstTouch, { once: true, passive: true });
    window.addEventListener('click', handleFirstTouch, { once: true, passive: true });

    return () => {
      window.removeEventListener('touchstart', handleFirstTouch);
      window.removeEventListener('click', handleFirstTouch);
    };
  }, []);

  const cleanTextForSpeech = (raw: string, langCode: string): string => {
    let text = raw
      // Remove math formulas
      .replace(/\$\$[\s\S]*?\$\$/g, ' ')
      .replace(/\$[^$]+?\$/g, ' ')
      // Remove markdown bold, italic, code
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/•/g, '')
      .replace(/^-\s+/gm, '')
      .trim();

    // If Chinese, remove parenthesized Latin Pinyin so Chinese TTS speaks characters naturally
    if (langCode.startsWith('zh') || /[\u4e00-\u9fa5]/.test(text)) {
      text = text.replace(/\([A-Za-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s]+\)/g, '');
      text = text.replace(/（[A-Za-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s]+）/g, '');
    }

    return text.trim();
  };

  const stop = useCallback(() => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch {
        // ignore
      }
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
      } catch {
        // ignore
      }
    }
    activeUtteranceRef.current = null;
    setIsSpeaking(false);
  }, []);

  // HTML5 Audio playback via Google TTS
  const playHtml5Audio = useCallback((cleanedText: string, langCode: string) => {
    try {
      const isDev = import.meta.env.DEV;
      const ttsBase = isDev ? '/api/tts' : 'https://translate.google.com/translate_tts';
      const audioUrl = `${ttsBase}?ie=UTF-8&tl=${encodeURIComponent(
        langCode
      )}&client=tw-ob&q=${encodeURIComponent(cleanedText)}`;

      // Use a clean audio element
      const audio = new Audio();
      audio.setAttribute('playsinline', 'true');
      audio.preload = 'auto';
      audio.volume = 1.0;
      audio.src = audioUrl;
      currentAudioRef.current = audio;

      audio.onplay = () => {
        setIsSpeaking(true);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        currentAudioRef.current = null;
      };

      audio.onerror = (e) => {
        console.warn('HTML5 Audio playback error:', e);
        setIsSpeaking(false);
        currentAudioRef.current = null;
      };

      setIsSpeaking(true);
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio play() catch:', err);
          setIsSpeaking(false);
          currentAudioRef.current = null;
        });
      }
    } catch (err) {
      console.warn('HTML5 Audio execution failed:', err);
      setIsSpeaking(false);
      currentAudioRef.current = null;
    }
  }, []);

  const speak = useCallback(
    (text: string, rawLangCode: string = 'en-US') => {
      const langCode = normalizeLanguageCode(rawLangCode);
      const cleaned = cleanTextForSpeech(text, langCode);
      if (!cleaned) return;

      stop();

      const hasSpeechApi = typeof window !== 'undefined' && 'speechSynthesis' in window;
      const currentVoices = voicesRef.current.length > 0
        ? voicesRef.current
        : (hasSpeechApi ? window.speechSynthesis.getVoices() : []);

      const prefix = langCode.split('-')[0].toLowerCase();
      const matchingVoice = currentVoices.find(v => {
        const vl = v.lang.toLowerCase().replace('_', '-');
        return vl === langCode.toLowerCase() || vl.startsWith(prefix);
      });

      // If native SpeechSynthesis is available AND has a matching voice for the target language:
      if (hasSpeechApi && matchingVoice) {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }

          const utterance = new SpeechSynthesisUtterance(cleaned);
          utterance.lang = langCode;
          utterance.voice = matchingVoice;
          utterance.rate = 0.88; // Comfortable pace for learners
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          let didStartSpeaking = false;

          utterance.onstart = () => {
            didStartSpeaking = true;
            if (watchdogTimerRef.current) {
              clearTimeout(watchdogTimerRef.current);
              watchdogTimerRef.current = null;
            }
            setIsSpeaking(true);
          };

          utterance.onend = () => {
            setIsSpeaking(false);
            activeUtteranceRef.current = null;
          };

          utterance.onerror = (e) => {
            console.warn('SpeechSynthesis error, falling back to Audio:', e);
            if (watchdogTimerRef.current) {
              clearTimeout(watchdogTimerRef.current);
              watchdogTimerRef.current = null;
            }
            activeUtteranceRef.current = null;
            // Seamless fallback to HTML5 Audio
            playHtml5Audio(cleaned, langCode);
          };

          // Watchdog timer: If synthesis does not actually start within 700ms, fall back to Audio
          watchdogTimerRef.current = setTimeout(() => {
            if (!didStartSpeaking) {
              console.warn('SpeechSynthesis watchdog triggered: fallback to Audio');
              try {
                window.speechSynthesis.cancel();
              } catch {
                // ignore
              }
              activeUtteranceRef.current = null;
              playHtml5Audio(cleaned, langCode);
            }
          }, 700);

          // Prevent garbage collection mid-speech (WebKit/Chrome bug)
          activeUtteranceRef.current = utterance;
          // @ts-expect-error keep active utterance in global window
          window.__activeUtterance = utterance;

          window.speechSynthesis.speak(utterance);
          return;
        } catch (err) {
          console.warn('SpeechSynthesis invocation failed, falling back:', err);
        }
      }

      // DIRECT FALLBACK: No matching voice (e.g. Linux desktop PC, or devices lacking voice pack)
      playHtml5Audio(cleaned, langCode);
    },
    [stop, playHtml5Audio]
  );

  return {
    isSupported,
    isSpeaking,
    speak,
    stop,
  };
}
