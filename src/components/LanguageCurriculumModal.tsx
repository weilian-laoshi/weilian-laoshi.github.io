import React, { useState } from 'react';
import type { LanguageId, DifficultyLevel } from '../types';
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_TOPICS,
  DIFFICULTY_LEVELS,
  normalizeDifficulty,
  getIncludedLevels,
} from '../data/languages';
import {
  Globe2,
  Check,
  X,
  Plane,
  HeartHandshake,
  Landmark,
  Atom,
  Briefcase,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';

interface LanguageCurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLanguages: LanguageId[];
  initialTopics: string[];
  initialDifficulty?: DifficultyLevel;
  initialLanguageDifficulties?: Partial<Record<LanguageId, DifficultyLevel>>;
  onSaveCurriculum: (
    languages: LanguageId[],
    topics: string[],
    difficulties: Partial<Record<LanguageId, DifficultyLevel>>
  ) => Promise<void>;
  isFirstTime?: boolean;
}

const TOPIC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Plane,
  HeartHandshake,
  Landmark,
  Atom,
  Briefcase,
  Sparkles,
};

export const LanguageCurriculumModal: React.FC<LanguageCurriculumModalProps> = ({
  isOpen,
  onClose,
  initialLanguages,
  initialTopics,
  initialDifficulty = 'A1',
  initialLanguageDifficulties = {},
  onSaveCurriculum,
  isFirstTime = false,
}) => {
  const [selectedLangs, setSelectedLangs] = useState<LanguageId[]>(
    initialLanguages.length > 0 ? initialLanguages : ['english']
  );
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    initialTopics.length > 0 ? initialTopics : ['daily-travel', 'manners-etiquette', 'business-work', 'idioms-expressions']
  );
  const [languageDifficulties, setLanguageDifficulties] = useState<Record<LanguageId, DifficultyLevel>>(() => {
    return {
      spanish: normalizeDifficulty(initialLanguageDifficulties?.spanish || initialDifficulty || 'A1'),
      english: normalizeDifficulty(initialLanguageDifficulties?.english || initialDifficulty || 'A1'),
      german: normalizeDifficulty(initialLanguageDifficulties?.german || initialDifficulty || 'A1'),
      chinese: normalizeDifficulty(initialLanguageDifficulties?.chinese || initialDifficulty || 'A1'),
    };
  });
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const toggleLanguage = (id: LanguageId) => {
    if (selectedLangs.includes(id)) {
      if (selectedLangs.length > 1) {
        setSelectedLangs(selectedLangs.filter(l => l !== id));
      } else {
        alert('Please choose at least one language.');
      }
    } else {
      setSelectedLangs([...selectedLangs, id]);
    }
  };

  const toggleTopic = (id: string) => {
    if (selectedTopics.includes(id)) {
      if (selectedTopics.length > 1) {
        setSelectedTopics(selectedTopics.filter(t => t !== id));
      } else {
        alert('Please choose at least one subject topic.');
      }
    } else {
      setSelectedTopics([...selectedTopics, id]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveCurriculum(selectedLangs, selectedTopics, languageDifficulties);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 mb-1.5 sm:mb-2">
              <Globe2 className="w-3.5 h-3.5" />
              <span>Language Curriculum Builder</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Customize Your Learning Journey
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Choose target languages, subjects of interest, and your target difficulty level.
            </p>
          </div>

          {!isFirstTime && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Steps Navigation */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 text-xs">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 font-medium transition-colors ${
                step === 1 ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 1 ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600'
              }`}>1</span>
              <span>Languages ({selectedLangs.length})</span>
            </button>

            <span className="text-zinc-300 dark:text-zinc-700">&rarr;</span>

            <button
              type="button"
              onClick={() => setStep(2)}
              className={`flex items-center gap-1.5 font-medium transition-colors ${
                step === 2 ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 2 ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600'
              }`}>2</span>
              <span>Subjects ({selectedTopics.length})</span>
            </button>

            <span className="text-zinc-300 dark:text-zinc-700">&rarr;</span>

            <button
              type="button"
              onClick={() => setStep(3)}
              className={`flex items-center gap-1.5 font-medium transition-colors ${
                step === 3 ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 3 ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600'
              }`}>3</span>
              <span className="capitalize">
                Proficiency ({Array.from(new Set(selectedLangs.map(l => languageDifficulties[l] || 'beginner'))).length === 1
                  ? (DIFFICULTY_LEVELS.find(d => d.id === (languageDifficulties[selectedLangs[0]] || 'beginner'))?.name || 'Beginner')
                  : 'Custom'})
              </span>
            </button>
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: LANGUAGES */}
          {step === 1 && (
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Step 1: Select Your Target Languages
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Pick one or more languages you want to master using spaced repetition.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SUPPORTED_LANGUAGES.map(lang => {
                  const isSelected = selectedLangs.includes(lang.id);

                  return (
                    <div
                      key={lang.id}
                      onClick={() => toggleLanguage(lang.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 relative ${
                        isSelected
                          ? 'bg-zinc-900/5 dark:bg-zinc-100/10 border-zinc-900/40 dark:border-zinc-100/40 ring-1 ring-zinc-900/20 dark:ring-zinc-100/20'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-3xl select-none shrink-0">{lang.flag}</span>
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                            {lang.name}
                          </span>
                          <span className="text-xs text-zinc-400 font-medium">
                            {lang.nativeName}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                          {lang.description}
                        </p>
                      </div>

                      <div
                        className={`absolute top-4 right-4 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                            : 'border border-zinc-300 dark:border-zinc-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: TOPICS / SUBJECTS */}
          {step === 2 && (
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Step 2: Choose Learning Subjects & Topics
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Learn your chosen languages through themes that genuinely interest you.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LANGUAGE_TOPICS.map(topic => {
                  const isSelected = selectedTopics.includes(topic.id);
                  const IconComp = TOPIC_ICONS[topic.icon] || Sparkles;

                  return (
                    <div
                      key={topic.id}
                      onClick={() => toggleTopic(topic.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 relative ${
                        isSelected
                          ? 'bg-zinc-900/5 dark:bg-zinc-100/10 border-zinc-900/40 dark:border-zinc-100/40 ring-1 ring-zinc-900/20 dark:ring-zinc-100/20'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}>
                        <IconComp className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 block">
                          {topic.name}
                        </span>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                          {topic.description}
                        </p>
                      </div>

                      <div
                        className={`absolute top-4 right-4 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                            : 'border border-zinc-300 dark:border-zinc-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: DIFFICULTY PER LANGUAGE */}
          {step === 3 && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Step 3: Starting Proficiency by Language
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Select the starting difficulty level independently for each target language.
                  </p>
                </div>

                {selectedLangs.length > 1 && (
                  <div className="flex items-center gap-1.5 self-start sm:self-auto bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg">
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 px-1 font-medium">Quick set all:</span>
                    {DIFFICULTY_LEVELS.map(d => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setLanguageDifficulties(prev => {
                            const updated = { ...prev };
                            selectedLangs.forEach(l => { updated[l] = d.id; });
                            return updated;
                          });
                        }}
                        className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-900 transition-colors shadow-2xs cursor-pointer"
                        title={`Set all selected languages to ${d.name} (${d.cefr})`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3.5">
                {selectedLangs.map(langId => {
                  const langDef = SUPPORTED_LANGUAGES.find(l => l.id === langId);
                  if (!langDef) return null;
                  const currentDiff = normalizeDifficulty(languageDifficulties[langId] || 'A1');
                  const activeDiffDef = DIFFICULTY_LEVELS.find(d => d.id === currentDiff);
                  const includedLevels = getIncludedLevels(currentDiff);

                  return (
                    <div
                      key={langId}
                      className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs"
                    >
                      {/* Language Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl select-none">{langDef.flag}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                {langDef.name}
                              </span>
                              <span className="text-xs text-zinc-400 font-medium">
                                {langDef.nativeName}
                              </span>
                            </div>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {langDef.description}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shrink-0">
                          {activeDiffDef?.name} ({activeDiffDef?.cefr})
                        </span>
                      </div>

                      {/* Segmented Level Buttons: A1, A2, B1, B2, C1, C2 */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                        {DIFFICULTY_LEVELS.map(diff => {
                          const isTarget = currentDiff === diff.id;
                          const isIncluded = includedLevels.includes(diff.id);

                          return (
                            <button
                              key={diff.id}
                              type="button"
                              onClick={() =>
                                setLanguageDifficulties(prev => ({ ...prev, [langId]: diff.id }))
                              }
                              className={`p-2 rounded-lg border text-left transition-all cursor-pointer relative ${
                                isTarget
                                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-xs ring-2 ring-zinc-900/30'
                                  : isIncluded
                                  ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200'
                                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30 text-zinc-500 dark:text-zinc-400 opacity-60 hover:opacity-90'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="text-xs font-bold leading-none">{diff.name}</span>
                                {isIncluded && (
                                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-semibold ${
                                    isTarget
                                      ? 'bg-white/20 dark:bg-zinc-900/20 text-white dark:text-zinc-900'
                                      : 'bg-emerald-200 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-100'
                                  }`}>
                                    {isTarget ? 'Target' : '✓ Incl.'}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] opacity-80 block truncate">
                                {diff.cefr}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Auto-included Levels Visualizer */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 p-2.5 rounded-lg mb-2">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">Included tiers:</span>
                        <div className="flex items-center gap-1">
                          {includedLevels.map(lvl => (
                            <span
                              key={lvl}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                lvl === currentDiff
                                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 ring-1 ring-zinc-400'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                              }`}
                            >
                              {lvl}
                            </span>
                          ))}
                        </div>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 ml-auto">
                          Selecting <strong>{currentDiff}</strong> automatically includes all sentences from {includedLevels.join(' + ')}
                        </span>
                      </div>

                      {/* Level Description */}
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed bg-zinc-50/70 dark:bg-zinc-800/40 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{activeDiffDef?.name} ({activeDiffDef?.cefr}): </span>
                        {activeDiffDef?.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-3.5 sm:p-4 px-4 sm:px-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>
              {selectedLangs.length} Language{selectedLangs.length > 1 ? 's' : ''} &bull;{' '}
              {selectedTopics.length} Subject{selectedTopics.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(prev => (prev - 1) as 1 | 2 | 3)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(prev => (prev + 1) as 1 | 2 | 3)}
                className="ml-auto sm:ml-0 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="ml-auto sm:ml-0 px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 cursor-pointer disabled:opacity-50 shadow-xs active:scale-95"
              >
                {isSaving ? 'Configuring Decks...' : 'Apply & Build Decks'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
