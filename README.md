# 🌟 微联老师 · 莱特纳英语学习 (Weilian Laoshi Leitner English)

> 专为母语为中文者打造的极简主义**莱特纳五盒间隔重复记忆（Leitner 5-Box Spaced Repetition System）英语卡片学习系统**。
> 纯客户端运行 &bull; 离线 IndexedDB 本地持久化 &bull; 原生 Web Speech 语音朗读 &bull; 星标重点收藏 &bull; 语法语境考点与笔记 &bull; 专为 GitHub Pages 部署优化。
> 线上体验: **[https://weilian-laoshi.github.io/](https://weilian-laoshi.github.io/)**

---

## 🚀 核心特色与功能设计 (Core Features)

### 🗃️ 1. 莱特纳五盒间隔重复记忆法 (Leitner 5-Box SRS)
- **第 1 盒 (每日复习)**: 新学习或未完全掌握的生词句式。
- **第 2 盒 (每 3 天)**: 记忆初步巩固阶段。
- **第 3 盒 (每 7 天 / 每周)**: 熟练掌握，开始转化为长期记忆。
- **第 4 盒 (每 14 天 / 两周)**: 长期记忆稳固阶段。
- **第 5 盒 (每 30 天 / 每月)**: 深度掌握，母语级自动化脱口而出。
- **科学进阶逻辑**: 答对进阶晋升到下一个盒子，答错即刻退回第 1 盒强化巩固；支持单盒筛选或全局复习。

### 🎴 2. 深度语境与双向记忆卡片
- **地道例句与中文对照**: 每张卡片均配有英美地道真实生活例句及中文翻译对照。
- **国际音标 (IPA)**: 标注准确发音，辅助听口音准。
- **语法重点与文化语境 (Context & Notes)**: 详细解析词根、常用搭配、时态语态、文化潜台词以及北美职场高频惯用法。
- **双向学习模式 (Standard & Reverse)**:
  - **顺向**: 英文原句 &rarr; 思考并检验中文释义
  - **逆向**: 中文释义 &rarr; 练习主动英译输出

### ⭐ 3. 星标重点收藏 (Star Favourites)
- 在学习会话中或在卡片管理列表中一键点击星标（★）。
- 独立的**星标收藏夹 (Starred View)**，支持单独进行 10 题专练冲刺。

### 🔊 4. 原生语音朗读 (Web Speech API + TTS)
- 点击卡片发音按钮即可朗读英式/美式发音。
- 学习会话支持键盘快捷键 `S` 即刻发音，支持语境例句一键朗读。

### 💾 5. 本地 IndexedDB 离线存储与多学员档案
- 使用 Dexie.js (IndexedDB) 完全存储于用户本地浏览器，无需登录、零后端依赖、零数据泄露风险。
- 支持切换不同学员档案，支持全量 JSON 数据备份与一键恢复。

### 🎯 6. 模块化主题课程覆盖 (CEFR A1–C2)
- **日常出行与生活 (Daily & Travel)**: 餐饮咖啡、交通换乘、机场酒店、生活问答。
- **社交礼仪与地道表达 (Etiquette & Social)**: 礼貌求助、正式与非正式称谓、餐桌礼仪、委婉拒绝。
- **职场商务与沟通 (Business & Work)**: 邮件往来、会议发言、任务交付、商务谈判。
- **习惯用语与成语谚语 (Idioms & Wisdom)**: 常见俗语、典故、暗喻隐喻、西方经典智慧。
- **文化背景与社会生活 (Culture & Heritage)**: 节日文化、历史传统、多元文化概念。
- **科技前沿与自然科普 (Science & Tech)**: 人工智能、生物生态、可再生能源等。

---

## 🛠️ 本地启动与调试 (Local Development)

```bash
# 1. 安装项目依赖
npm install

# 2. 启动本地开发服务
npm run dev
```

浏览器访问 `http://localhost:5173/` 即可体验。

---

## 📦 打包构建与部署 (Build & Deploy)

```bash
# 编译并生成生产静态资源
npm run build
```

本项目配置了自动化 GitHub Actions 工作流（[`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml)），每次推送到 `main` 分支均会自动构建并部署到 **[https://weilian-laoshi.github.io/](https://weilian-laoshi.github.io/)**。
