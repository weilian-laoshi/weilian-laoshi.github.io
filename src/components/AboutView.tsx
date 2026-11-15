import React, { useState } from 'react';
import {
  ArrowLeft,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
  Heart,
  BookOpen,
  Copy,
  Check,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface AboutViewProps {
  onBack: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onBack }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1.5 cursor-pointer font-medium py-1 px-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回学习主页 (Back to Home)</span>
        </button>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
          Weilian Laoshi &bull; English Learning
        </span>
      </div>

      {/* Hero Profile Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/10 via-sky-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar / Portrait */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-zinc-100 dark:border-zinc-800">
              <span className="tracking-tight text-white select-none">威联</span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-sm" title="Certified Educator">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          {/* Core Info */}
          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Guilherme Viegas
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                English Teacher
              </span>
            </div>

            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
              威联老师 &bull; 专注母语为中文学员与少儿的实用英语启蒙与进阶教学
            </p>

            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl mb-5">
              致力于为学习者搭建高效、科学的英语习得路径。结合莱特纳五盒记忆法（Leitner 5-Box Spaced Repetition）、地道生活情境、游戏化互动与趣味发音，帮助孩子与成人轻松告别死记硬背，自然自信开口说英语。
            </p>

            {/* Quick Contact Chips */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              {/* Phone */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 text-xs">
                <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">+86 13389899327</span>
                <button
                  type="button"
                  onClick={() => handleCopy('+86 13389899327', 'phone')}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer p-0.5 ml-1 transition-colors"
                  title="复制手机号码"
                >
                  {copiedField === 'phone' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Email */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 text-xs">
                <Mail className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                <a
                  href="mailto:guilhermeviegas1993@gmail.com"
                  className="font-semibold text-zinc-800 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  guilhermeviegas1993@gmail.com
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy('guilhermeviegas1993@gmail.com', 'email')}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer p-0.5 ml-1 transition-colors"
                  title="复制电子邮箱"
                >
                  {copiedField === 'email' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Teaching Pillars / Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <BookOpen className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
            情境式与生活化教学
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            从电子游戏、室外玩耍、结识新朋友到家庭礼貌，所有课程内容紧密围绕孩子真实生活与兴趣场景展开。
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
            莱特纳科学记忆算法
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            基于艾宾浩斯遗忘曲线与 5 盒间隔重复（SRS），每天精准推送该复习的内容，省时高效，告别遗忘。
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
            <Heart className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
            关怀、品格与礼貌培养
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            注重在语言教学中渗透友善、分享、礼貌、感恩父母等良好品格，培养懂事有礼貌的阳光少年。
          </p>
        </div>
      </div>

      {/* Teaching Contact & Consultation Section */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 text-white rounded-2xl p-6 sm:p-7 shadow-md border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-zinc-200">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>课程咨询与教学合作 (Contact & Inquiries)</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            想为孩子定制个性化英语学习方案？
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl">
            欢迎直接通过电话或邮件与威廉老师取得联系，探讨少儿英语启蒙、口语纠音、日常会话及等级进阶学习方案。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <a
            href="tel:+8613389899327"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>拨打电话 (Call)</span>
          </a>
          <a
            href="mailto:guilhermeviegas1993@gmail.com"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-zinc-700/80 transition-all"
          >
            <Mail className="w-3.5 h-3.5 text-sky-400" />
            <span>发送邮件 (Email)</span>
          </a>
        </div>
      </div>
    </div>
  );
};
