import React from 'react';
import { Volume2 } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { getChinesePinyin } from '../utils/pinyin';

interface DialogueCardContentProps {
  front: string;
  back?: string;
  phonetic?: string;
  targetLangCode?: string;
  isFlipped?: boolean;
  compact?: boolean;
}

interface DialogueTurn {
  speaker: 'A' | 'B' | string;
  text: string;
  translation?: string;
  phonetic?: string;
}

export const DialogueCardContent: React.FC<DialogueCardContentProps> = ({
  front,
  back,
  phonetic,
  targetLangCode = 'en-US',
  isFlipped = false,
  compact = false,
}) => {
  const { speak, isSpeaking } = useSpeech();

  // Parse turns from text formatted like:
  // A: Hello!
  // B: Hi, how are you?
  const parseTurns = (frontText: string, backText?: string, phoneticText?: string): DialogueTurn[] => {
    const frontLines = frontText.split('\n').map((l) => l.trim()).filter(Boolean);
    const backLines = (backText || '').split('\n').map((l) => l.trim()).filter(Boolean);
    const phoneticLines = (phoneticText || '').split('\n').map((l) => l.trim()).filter(Boolean);

    // Map by speaker prefix or by index
    const turns: DialogueTurn[] = [];

    frontLines.forEach((fLine, idx) => {
      let speaker = 'A';
      let text = fLine;

      const speakerMatch = fLine.match(/^([A-Za-z0-9_\u4e00-\u9fa5]+)\s*[:：]\s*(.*)$/);
      if (speakerMatch) {
        speaker = speakerMatch[1].toUpperCase();
        text = speakerMatch[2];
      } else {
        speaker = idx % 2 === 0 ? 'A' : 'B';
      }

      let translation = '';
      if (backLines[idx]) {
        const transMatch = backLines[idx].match(/^([A-Za-z0-9_\u4e00-\u9fa5]+)\s*[:：]\s*(.*)$/);
        translation = transMatch ? transMatch[2] : backLines[idx];
      }

      let pText = '';
      if (phoneticLines[idx]) {
        const pMatch = phoneticLines[idx].match(/^([A-Za-z0-9_\u4e00-\u9fa5]+)\s*[:：]\s*(.*)$/);
        pText = pMatch ? pMatch[2] : phoneticLines[idx];
      }

      turns.push({
        speaker,
        text,
        translation: translation || undefined,
        phonetic: pText || undefined,
      });
    });

    return turns;
  };

  const turns = parseTurns(front, back, phonetic);

  const handlePlayLine = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    speak(text, targetLangCode);
  };

  if (compact) {
    return (
      <div className="space-y-1.5 text-left w-full text-xs">
        {turns.slice(0, 3).map((turn, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <span
              className={`px-1.5 py-0.5 rounded font-mono font-semibold text-[10px] shrink-0 ${
                turn.speaker === 'A'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
              }`}
            >
              {turn.speaker}
            </span>
            <span className="text-stone-700 dark:text-stone-300 truncate">{turn.text}</span>
          </div>
        ))}
        {turns.length > 3 && (
          <p className="text-[10px] text-stone-400 italic">+{turns.length - 3} more lines...</p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-3.5 my-2 text-left">
      {turns.map((turn, index) => {
        const isSpeakerA = turn.speaker === 'A';
        return (
          <div
            key={index}
            className={`flex flex-col sm:flex-row sm:items-start gap-2.5 p-3 rounded-xl transition-colors ${
              isSpeakerA
                ? 'bg-indigo-50/70 border border-indigo-100/80 dark:bg-indigo-950/20 dark:border-indigo-900/40'
                : 'bg-emerald-50/70 border border-emerald-100/80 dark:bg-emerald-950/20 dark:border-emerald-900/40'
            }`}
          >
            {/* Speaker avatar / badge */}
            <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs ${
                  isSpeakerA
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                    : 'bg-emerald-600 text-white dark:bg-emerald-500'
                }`}
              >
                {turn.speaker}
              </span>
              <button
                type="button"
                onClick={(e) => handlePlayLine(e, turn.text)}
                aria-label={`Pronounce line ${index + 1}`}
                className="sm:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Turn Content */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-base font-medium text-stone-900 dark:text-white leading-relaxed">
                  {turn.text}
                </p>
                <button
                  type="button"
                  onClick={(e) => handlePlayLine(e, turn.text)}
                  title="Listen to this line"
                  className="hidden sm:inline-flex p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5 shrink-0 transition-colors"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
                </button>
              </div>

              {/* Phonetic if provided */}
              {turn.phonetic && (
                <p className="text-xs font-mono text-stone-400 dark:text-stone-500 tracking-wide">
                  {turn.phonetic}
                </p>
              )}

              {/* Translation & Pinyin revealed on flip */}
              {isFlipped && turn.translation && (
                <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800/60 mt-2 space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-medium tracking-wide">
                      {getChinesePinyin(turn.translation)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(turn.translation!, 'zh-CN');
                      }}
                      title="Pronounce Chinese (中文朗读)"
                      className="p-1 rounded text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
                    {turn.translation}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
