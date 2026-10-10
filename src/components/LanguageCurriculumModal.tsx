import React, { useState } from 'react';
import type { LanguageId, DifficultyLevel } from '../types';
import {
  LANGUAGE_TOPICS,
  DIFFICULTY_LEVELS,
  normalizeDifficulty,
  getIncludedLevels,
  LANGUAGE_CURRICULUM_SEEDS,
} from '../data/languages';
import {
  Check,
  X,
  Plane,
  HeartHandshake,
  Landmark,
  Atom,
  Briefcase,
  Sparkles,
  BookOpen,
  Layers,
  Compass,
  Utensils,
  ShoppingBag,
} from 'lucide-react';

interface LanguageCurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLanguages?: LanguageId[];
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
  Compass,
  Utensils,
  ShoppingBag,
};

export const LanguageCurriculumModal: React.FC<LanguageCurriculumModalProps> = ({
  isOpen,
  onClose,
  initialTopics,
  initialDifficulty = 'A1',
  initialLanguageDifficulties,
  onSaveCurriculum,
  isFirstTime = false,
}) => {
  const currentInitialDiff = initialLanguageDifficulties?.english || initialDifficulty;
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(
    normalizeDifficulty(currentInitialDiff)
  );
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    initialTopics.length > 0 ? initialTopics : LANGUAGE_TOPICS.map(t => t.id)
  );
  const [activeTab, setActiveTab] = useState<'level' | 'topics'>('level');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const toggleTopic = (id: string) => {
    if (selectedTopics.includes(id)) {
      if (selectedTopics.length > 1) {
        setSelectedTopics(selectedTopics.filter(t => t !== id));
      } else {
        alert('请至少保留一个学习主题');
      }
    } else {
      setSelectedTopics([...selectedTopics, id]);
    }
  };

  const handleSelectAllTopics = () => {
    setSelectedTopics(LANGUAGE_TOPICS.map(t => t.id));
  };

  const includedLevels = getIncludedLevels(selectedDifficulty);

  // Compute available card counts for selected filters
  const totalMatchingCards = LANGUAGE_CURRICULUM_SEEDS.filter(
    s => selectedTopics.includes(s.topicId) && includedLevels.includes(normalizeDifficulty(s.difficulty))
  ).length;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveCurriculum(['english'], selectedTopics, {
        english: selectedDifficulty,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 mb-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>英语学习课程设置</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              设置英语学习级别与主题
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              按照欧标 CEFR 等级循序渐进，系统将自动汇聚所选等级及以下的基础与进阶词句。
            </p>
          </div>

          {!isFirstTime && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('level')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'level'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>目标等级 ({selectedDifficulty})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('topics')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'topics'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>学习主题 ({selectedTopics.length}/{LANGUAGE_TOPICS.length})</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            已涵盖 <span className="font-semibold text-zinc-900 dark:text-zinc-100">{totalMatchingCards}</span> 条核心短语
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'level' ? (
            /* CEFR Levels Grid */
            <div>
              <div className="mb-3">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  选择您的目标英语能力级别
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  系统采用循序渐进法：选择高阶级别时，前置基础级别的句型将一并加入，确保温故知新。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DIFFICULTY_LEVELS.map(diff => {
                  const isSelected = selectedDifficulty === diff.id;
                  const isIncluded = includedLevels.includes(diff.id);

                  return (
                    <div
                      key={diff.id}
                      onClick={() => setSelectedDifficulty(diff.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20'
                          : isIncluded
                          ? 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-850/40'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}>
                            {diff.id}
                          </span>
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {diff.chineseTitle}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-2">
                        {diff.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                        <span>CEFR: {diff.cefr}</span>
                        {isIncluded && (
                          <span className="text-indigo-600 dark:text-indigo-400 font-sans font-medium">
                            {isSelected ? '★ 当前目标' : '✓ 包含复习'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Topics Selection */
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    选择您感兴趣的英语学习主题
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    勾选希望强化的语境场景，系统将为您生成对应的莱特纳专属主题记忆盒子。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSelectAllTopics}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer shrink-0"
                >
                  全选所有主题
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {LANGUAGE_TOPICS.map(topic => {
                  const isSelected = selectedTopics.includes(topic.id);
                  const IconComponent = TOPIC_ICONS[topic.icon] || Sparkles;
                  const matchingCount = LANGUAGE_CURRICULUM_SEEDS.filter(
                    s => s.topicId === topic.id && includedLevels.includes(normalizeDifficulty(s.difficulty))
                  ).length;

                  return (
                    <div
                      key={topic.id}
                      onClick={() => toggleTopic(topic.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 opacity-65'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                        }`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                              {topic.chineseName}
                            </h4>
                          </div>
                          <span className="text-[11px] text-zinc-400 font-mono block mb-1">
                            {topic.name}
                          </span>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                            {topic.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-zinc-300 dark:border-zinc-700'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 mt-2">
                          {matchingCount} 句
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 flex items-center justify-between">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            <span>当前配置：</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {selectedDifficulty} 级别
            </span>
            <span className="mx-1">&bull;</span>
            <span>{selectedTopics.length} 个主题</span>
          </div>

          <div className="flex items-center gap-2">
            {!isFirstTime && (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
              >
                取消
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving ? '正在同步词库...' : '保存并同步英语词库'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
