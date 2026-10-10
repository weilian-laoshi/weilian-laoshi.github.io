import React, { useState } from 'react';
import type { Profile, DifficultyLevel } from '../types';
import {
  createProfile,
  deleteProfile,
  exportProfileBackup,
  importProfileBackup,
  type BackupData,
} from '../db/database';
import {
  DIFFICULTY_LEVELS,
  LANGUAGE_TOPICS,
  normalizeDifficulty,
} from '../data/languages';
import {
  Users,
  Plus,
  Trash2,
  Download,
  Upload,
  X,
  ShieldCheck,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: Profile[];
  activeProfile: Profile;
  onSelectProfile: (profile: Profile) => void;
  onRefreshProfiles: () => Promise<void>;
  onOpenCurriculumModal: () => void;
}

const AVATAR_OPTIONS = ['🌱', '🦉', '🚀', '🧠', '⚡', '☕', '📚', '🎯', '✨', '🌊'];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfile,
  onSelectProfile,
  onRefreshProfiles,
  onOpenCurriculumModal,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🌱');
  const [newDifficulty, setNewDifficulty] = useState<DifficultyLevel>('A1');
  const [newAccent, setNewAccent] = useState<'en-US' | 'en-GB'>('en-US');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    const created = await createProfile(
      newProfileName.trim(),
      selectedAvatar,
      ['english'],
      LANGUAGE_TOPICS.map(t => t.id),
      newDifficulty,
      newAccent
    );

    await onRefreshProfiles();
    onSelectProfile(created);
    setIsCreating(false);
    setNewProfileName('');
    onClose();
    onOpenCurriculumModal();
  };

  const handleDelete = async (profileId: string) => {
    if (profiles.length <= 1) {
      alert('无法删除仅存的最后一个学习档案。');
      return;
    }
    if (confirm('确认删除此学员档案及所有对应的本地卡片进度？此操作不可撤销。')) {
      await deleteProfile(profileId);
      await onRefreshProfiles();
      const remaining = profiles.filter(p => p.id !== profileId);
      if (remaining.length > 0) {
        onSelectProfile(remaining[0]);
      }
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const backup = await exportProfileBackup(activeProfile.id);
      if (!backup) return;

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weilian_english_backup_${activeProfile.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed: BackupData = JSON.parse(text);

      if (!parsed.profile || !parsed.decks || !parsed.cards) {
        throw new Error('无效的备份文件格式');
      }

      const imported = await importProfileBackup(parsed);
      await onRefreshProfiles();
      onSelectProfile(imported);
      alert(`已成功恢复学员档案「${imported.name}」，共导入 ${parsed.decks.length} 个词库和 ${parsed.cards.length} 张记忆卡片。`);
      onClose();
    } catch (err) {
      alert('恢复备份失败: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                学员档案与数据备份
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                本地 IndexedDB 存储，零服务器依赖，数据全量离线加密。
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer shrink-0"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Profiles List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                当前学员
              </span>
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="text-xs font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新建学员档案</span>
              </button>
            </div>

            <div className="space-y-2">
              {profiles.map(p => {
                const isActive = p.id === activeProfile.id;
                const diff = normalizeDifficulty(p.selectedDifficulty || 'A1');
                const diffDef = DIFFICULTY_LEVELS.find(d => d.id === diff);

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProfile(p);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isActive
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-2xs'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl select-none">{p.avatar}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {p.name}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                              进行中
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                            {diffDef?.chineseTitle || diff}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {p.accent === 'en-GB' ? '🇬🇧 英音' : '🇺🇸 美音'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {profiles.length > 1 && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleDelete(p.id);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                          title="删除档案"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create Profile Sub-form */}
          {isCreating && (
            <form onSubmit={handleCreate} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-3">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                创建新学员档案
              </span>

              <div className="flex gap-1.5 flex-wrap">
                {AVATAR_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedAvatar(emoji)}
                    className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                      selectedAvatar === emoji
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 ring-2 ring-zinc-400'
                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="学员称呼（如：小王、威廉、Amy）"
                value={newProfileName}
                onChange={e => setNewProfileName(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    初始英语级别
                  </label>
                  <select
                    value={newDifficulty}
                    onChange={e => setNewDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  >
                    {DIFFICULTY_LEVELS.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.chineseTitle} ({d.cefr})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    偏好朗读口音
                  </label>
                  <select
                    value={newAccent}
                    onChange={e => setNewAccent(e.target.value as 'en-US' | 'en-GB')}
                    className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="en-US">🇺🇸 美式发音 (US)</option>
                    <option value="en-GB">🇬🇧 英式发音 (UK)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer"
                >
                  确认创建
                </button>
              </div>
            </form>
          )}

          {/* Backup & Data Portability */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
              全量数据备份与恢复 (JSON)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center justify-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>导出备份数据</span>
              </button>

              <label className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 flex items-center justify-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5" />
                <span>恢复备份数据</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-[11px] text-zinc-500 dark:text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>所有数据均保存在本地浏览器中，无需网络注册账号，保护您的个人学习隐私。</span>
          </div>
        </div>
      </div>
    </div>
  );
};
