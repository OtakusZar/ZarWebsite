# 生成式 AI 与游戏 / 3D 美术调查问卷

一个全屏沉浸式、单题卡片式（Typeform 风格）的问卷前端。React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion。

**界面语言：中文为主、英文为辅。** 每处文案都是「中文大字 + 英文小字」的层级：题干、选项、量表、按钮、提示全部中文优先，英文作为第二行浅色副标题保留（方便中英混合的研究团队与受访者）。

- 15 个答题步骤，覆盖问卷文件 `Questionary.docx` 中的全部题目（单选、多选、量表矩阵、开放文本、条件分支）
- 电脑端 / 手机端深度适配，键盘快捷键，自动保存草稿，可接入任意后端
- **目前处于「模拟提交」模式**：填完后会在浏览器控制台打印完整 JSON，不会真的发送到服务器。接入真实接口的方法见上文第 4 节。

---

## 1. 本地运行（第一次需要装东西）

### 1.1 安装 Node.js（只需一次）

1. 打开 <https://nodejs.org/zh-cn>，下载 **LTS** 版本（`.msi` 安装包）。
2. 双击安装，一路「下一步」。安装时保持默认选项即可（会自动配置好 `npm`）。
3. 安装完成后，打开「开始菜单 → Windows PowerShell」，输入：

   ```powershell
   node -v
   npm -v
   ```

   能看到版本号（例如 `v20.x.x` / `10.x.x`）就说明安装成功。

### 1.2 安装项目依赖

在 PowerShell 里进入本项目文件夹，然后安装：

```powershell
cd E:\MyWebSite
npm install
```

> 只需要做一次。之后 `node_modules` 文件夹会一直存在。

### 1.3 启动开发服务器

```powershell
npm run dev
```

终端会显示：

```
➜  Local:   http://localhost:5173/
```

按住 `Ctrl` 点击这个地址（或在浏览器里输入 `http://localhost:5173/`），就能看到问卷。

- 修改代码并保存后，浏览器会**自动刷新**，不需要重启。
- 结束运行时，在终端按 `Ctrl + C`。

### 1.4 打包上线文件

```powershell
npm run build
```

会在 `dist/` 文件夹里生成可以直接部署的静态文件（HTML/CSS/JS）。预览打包结果：

```powershell
npm run preview
```

---

## 2. 项目目录结构

```
E:\MyWebSite
├─ index.html                 浏览器入口（标题、favicon 在这里）
├─ package.json               依赖清单 + 命令（npm run dev / build）
├─ tailwind.config.js         设计系统：颜色、字体栈、阴影、动画
├─ postcss.config.js          Tailwind 处理配置（一般不用改）
├─ vite.config.ts             Vite 配置（端口等）
├─ tsconfig*.json             TypeScript 配置（一般不用改）
│
├─ public/
│  └─ favicon.svg             浏览器标签页图标
│
├─ src/
│  ├─ main.tsx                React 挂载入口
│  ├─ App.tsx                 顶层路由：欢迎页 → 答题页 → 提交中 → 成功页
│  ├─ index.css               Tailwind 基础样式、纸张纹理、安全区域、动效
│  │
│  ├─ data/
│  │  └─ survey.ts            ★ 问卷内容都在这里（题目/选项/量表/跳转）
│  │
│  ├─ types/
│  │  └─ survey.ts            题目与答案的 TypeScript 类型定义
│  │
│  ├─ services/
│  │  └─ submitSurvey.ts      ★ 提交接口（要接后端就改这个文件）
│  │
│  ├─ lib/
│  │  ├─ answers.ts           校验 + 答案格式化（判空、友好提示文案）
│  │  ├─ payload.ts           把答案组装成提交 JSON（含设备、耗时等元数据）
│  │  ├─ device.ts            设备 / 浏览器 / 屏幕信息探测
│  │  ├─ storage.ts           localStorage 草稿读写（防丢失）
│  │  ├─ motion.ts            Framer Motion 动画参数集中管理
│  │  └─ cn.ts                样式类名拼接小工具
│  │
│  ├─ hooks/
│  │  ├─ useSurveyEngine.ts   答题状态机：进度、校验、计时、自动保存、提交
│  │  └─ useOptionShortcuts.ts 数字键 / 字母键选择选项
│  │
│  └─ components/
│     ├─ Background.tsx       渐变 + 网格 + 光晕背景
│     ├─ ProgressHeader.tsx   顶部进度条、章节、计数器、自动跳转开关
│     ├─ WelcomeScreen.tsx    封面页
│     ├─ SurveyScreen.tsx     答题页骨架（进度 + 卡片 + 底部导航）
│     ├─ StepCard.tsx         单步卡片（标题、量表图例、校验提示）
│     ├─ QuestionBlock.tsx    按题型分发到具体控件
│     ├─ questions/           单选 / 多选 / 矩阵量表 / 文本 四种控件
│     ├─ OptionCard.tsx       选项按钮（选中动画、按压反馈）
│     ├─ ReviewStep.tsx       提交前总览（可跳回修改）
│     ├─ NavBar.tsx           底部「上一题 / 下一题 / 提交」
│     ├─ SubmittingScreen.tsx 提交中
│     ├─ ThankYouScreen.tsx   成功页（可下载本次回答 JSON）
│     ├─ ErrorScreen.tsx      提交失败重试
│     ├─ DraftToast.tsx       草稿恢复提示
│     └─ ConfirmDialog.tsx    「重新开始」确认弹窗
│
├─ docs/
│  └─ worker-example.js       一个可用的 Cloudflare Worker 后端示例
│
└─ screenshots/               设计预览截图（可删除，不影响运行）
```

---

## 3. 修改问卷内容

**只改 `src/data/survey.ts` 这一个文件即可**，页面、进度条、校验、提交数据都会自动跟着变。

### 3.1 改一道单选题

在 `questions` 对象里找到题目（例如 `Q9`）：

```ts
Q9: {
  id: 'Q9',
  code: 'Q9',                 // 卡片左上角的小标签
  sectionId: 'D',             // 属于哪个章节
  kind: 'single',             // 题型：single / multi / matrix / text
  required: true,             // 是否必填
  title: 'Have you ever chosen not to tell others that you used AI in your work?',
  titleCn: '你是否曾选择不告诉别人你在工作中使用了 AI？',
  layout: 'grid',             // grid = 两列（手机上是一列）；list = 竖排
  autoAdvance: true,          // 选中后自动进入下一题
  options: [
    { id: 'yes', label: 'Yes', labelCn: '是' },
    { id: 'no',  label: 'No',  labelCn: '否' },
  ],
},
```

选项的 `id` 是最终写进数据的值（尽量别改，改了以后历史数据就对不上了）。

### 3.1.1 中英文怎么对应

每道题、每个选项都有两个字段：

| 字段 | 语言 | 显示位置 |
| --- | --- | --- |
| `titleCn`（题干）、`labelCn`（选项 / 矩阵条目） | 中文 | **主标题，大字号** |
| `title` / `label` | 英文 | 副标题，小字号灰色 |

也就是说：`titleCn` 是给受访者看的主体，`title` 是辅助说明。只写英文不写中文也能跑（会自动回退成英文），但推荐两条都填。界面的按钮、提示等固定文案已经全部中文化（按钮上带一个小号英文），写在各个组件里。

### 3.2 加一道多选题

```ts
Q12: {
  id: 'Q12',
  code: 'Q12',
  sectionId: 'F',
  kind: 'multi',
  required: true,
  minSelections: 1,
  title: 'Which tools do you use?',
  titleCn: '你会用哪些工具？',
  options: [
    { id: 'tool-a', label: 'Tool A', labelCn: '工具 A' },
    { id: 'tool-b', label: 'Tool B', labelCn: '工具 B' },
    // exclusive: true 表示「以上都没有」这类互斥选项
    { id: 'none', label: 'None', labelCn: '都没有', exclusive: true },
  ],
},
```

### 3.3 加一道量表矩阵（例如 1–5 打分）

```ts
Q13: {
  id: 'Q13',
  code: 'Q13',
  sectionId: 'E',
  kind: 'matrix',
  required: true,
  title: 'Please rate the following.',
  titleCn: '请为以下项目打分。',
  items: [
    { id: 'x1', label: 'Statement one', labelCn: '陈述一' },
    { id: 'x2', label: 'Statement two', labelCn: '陈述二' },
  ],
  scale: agreementScale,      // 复用已定义好的 1–5 量表（见文件顶部）
},
```

`scale` 可以复用文件顶部的 `agreementScale` / `caasScale` / `capabilityScale`，也可以自己写：

```ts
scale: [
  { value: 1, short: 'Low',  label: 'Low',  labelCn: '低' },
  { value: 2, short: 'Mid',  label: 'Mid',  labelCn: '中' },
  { value: 3, short: 'High', label: 'High', labelCn: '高' },
],
```

### 3.4 让新题出现在流程里（重要！）

题目定义了还不够，必须把它加进 `steps` 数组，否则不会显示：

```ts
const steps: SurveyStep[] = [
  // ...
  { id: 'step-q11', sectionId: 'F', questions: ['Q11'] },
  { id: 'step-q12', sectionId: 'F', questions: ['Q12'] },   // ← 新增
  { id: 'step-review', sectionId: 'review', title: '...', questions: [] },
]
```

- 一个 step = 一张卡片。一个卡片里放多道题（像 Q1 那样）就写成 `questions: ['Q1a', 'Q1b', 'Q1c']`。
- 最后那个 `step-review` 是「总览页」，不要删。
- 顶部进度「3 / 15」里的 15 会自动等于 `steps.length`。

### 3.5 条件分支（根据前面的答案显示后面的题）

任何题目都可以加 `visibleWhen`：

```ts
Q1b_other: {
  // ...
  visibleWhen: (answers) => answers.Q1b === 'other',
},
```

现有的例子：Q1 选「Other」时，才会出现「具体是哪种职能？」的输入框。
显示条件变化时，进度条、校验、提交数据都会自动重算。

---

## 4. 接入后端（把数据真正存起来）

现在 `src/services/submitSurvey.ts` 是**模拟模式**：等 1.2 秒 → 控制台打印 JSON → 返回成功。

### 4.1 先确认「模拟模式」能看到什么

1. 填完问卷 → 点 Submit。
2. 按 `F12` 打开开发者工具 → 切到 **Console** 标签。
3. 会看到一段 `survey submission ...` 和完整 JSON。里面包含：
   - `answers[]`：每题 `questionId` / 题目标题 / 答案原文 / 可读答案 / 矩阵逐项分值 / 该题停留毫秒数
     - `answerLabel`：**中文**可读答案（例如「每月」「12 / 12 项已评分」）
     - `answerLabelEn`：英文可读答案
     - `answerDetail`：补充信息（如矩阵的分值分布 `1×3 · 2×6`）
   - `durationMs`、`startedAt`、`submittedAt`、`submissionId`
   - `device`：设备类型（mobile/tablet/desktop）、系统、浏览器、屏幕尺寸、语言、时区
   - `meta`：完成率、访问过的步骤、界面语言等

### 4.2 三种后端，按难度排序

#### 方案 A：Web3Forms（最简单，5 分钟，数据发到邮箱）

1. 打开 <https://web3forms.com>，输入你的邮箱，收到一个 `access_key`。
2. 新建文件 `E:\MyWebSite\.env`（注意文件名前面有个点，没有扩展名），写入：

   ```
   VITE_SURVEY_ENDPOINT=https://api.web3forms.com/submit
   ```

3. 打开 `src/services/submitSurvey.ts`，把 `if (ENDPOINT) { ... }` 里的 `fetch` 改成：

   ```ts
   const response = await fetch(ENDPOINT, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
     body: JSON.stringify({
       access_key: 'YOUR_ACCESS_KEY',       // 换成你自己的 key
       subject: 'New survey response',
       // 把每条答案压成一行，方便在邮件里阅读
       answers: payload.answers
         .map((a) => `${a.questionCode} ${a.questionTitle}\n  → ${a.answerLabel}`)
         .join('\n\n'),
       durationMs: payload.durationMs,
       device: payload.device.type,
       raw: JSON.stringify(payload),        // 完整原始数据也带上
     }),
   })
   ```

4. 重启 `npm run dev`（`.env` 修改后必须重启）。

> 适合：初步收几十份数据、想要邮件通知。缺点：不适合做统计分析。

#### 方案 B：Cloudflare Worker + KV / D1（免费、稳定，推荐长期用）

用 `docs/worker-example.js` 作为起点：它是完整的可部署代码，会把每次提交存进 Workers KV，并返回成功。

部署步骤：

1. 注册 <https://dash.cloudflare.com>（免费）。
2. 安装 `wrangler`：`npm install -g wrangler`，然后 `wrangler login`。
3. 按 `docs/worker-example.js` 顶部注释创建 KV 命名空间并 `wrangler deploy`。
4. 拿到地址（形如 `https://survey-collect.your-name.workers.dev`）后，写进 `.env`：

   ```
   VITE_SURVEY_ENDPOINT=https://survey-collect.your-name.workers.dev
   ```

5. 重启开发服务器。**不需要改任何前端代码** —— `submitSurvey.ts` 里的 `fetch` 分支已经写好了。

> 适合：正式投放，几百到上万份数据，可导出 CSV。

#### 方案 C：Supabase（带后台表格界面，最直观）

1. 注册 <https://supabase.com>，新建项目。
2. 在 SQL Editor 建表：

   ```sql
   create table responses (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz default now(),
     submission_id text unique,
     payload jsonb not null
   );
   alter table responses enable row level security;
   create policy "anon can insert" on responses for insert to anon with check (true);
   ```

3. 在 `.env` 写入 REST 地址：

   ```
   VITE_SURVEY_ENDPOINT=https://<你的项目>.supabase.co/rest/v1/responses
   ```

4. 在 `submitSurvey.ts` 的 `fetch` 里加上 Supabase 需要的两个请求头：

   ```ts
   headers: {
     'Content-Type': 'application/json',
     apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
     Prefer: 'return=minimal',
   },
   body: JSON.stringify({ submission_id: payload.submissionId, payload }),
   ```

   > `anon key` 放在 `.env` 里（`VITE_SUPABASE_ANON_KEY=...`）。它本来就是公开可用的低权限 key，但仍不建议把 `service_role` key 写进前端。

> 适合：边收数据边在网页表格里查看、导出 Excel。

### 4.3 要改的位置一览

| 你想做的事 | 改哪个文件 |
| --- | --- |
| 换接收数据的地址 | `.env` 里的 `VITE_SURVEY_ENDPOINT` |
| 改请求方法 / 请求头 / 请求体格式 | `src/services/submitSurvey.ts` 的 `fetch` 分支 |
| 改提交数据的字段结构 | `src/services/submitSurvey.ts` 的 `SurveySubmissionPayload` + `src/lib/payload.ts` |
| 关掉模拟延迟 / 改成真实请求 | `src/services/submitSurvey.ts` 底部的 `if (ENDPOINT)` 判断（配好 `.env` 后会自动走真实请求） |
| 改提交成功的文案 / 页面 | `src/components/ThankYouScreen.tsx` |

> 安全提醒：前端代码是公开的，**任何密钥都会被用户看到**。真正的密钥（如 Web3Forms 之外的私有 key、数据库管理员权限）必须放在服务器 / Worker 里，前端只能使用公开的低权限 key。

---

## 5. 部署上线

打包后 `dist/` 是纯静态文件，可以放在任何静态托管上：

- **Vercel**：<https://vercel.com> → New Project → 导入 Git 仓库（或直接 `npm i -g vercel` 后运行 `vercel`）→ 框架选 Vite → Deploy。
- **Netlify**：<https://app.netlify.com/drop> → 把 `dist` 文件夹直接拖进去，立刻得到网址。
- **Cloudflare Pages**：<https://pages.cloudflare.com> → 上传 `dist` 文件夹。

如果部署平台需要手动填：Build command = `npm run build`，Output directory = `dist`。

---

## 6. 交互与功能清单

- **中文优先的排版层级**：题干、选项、量表、按钮均为中文大字，英文以小号浅灰副标题呈现；字体栈同时覆盖中英文，Windows / macOS / iOS / Android 都有合理的回退字体。
- **卡片式单题流程**：共 15 步，方向感知的左右滑动 + 淡入淡出（前进/后退方向不同）。
- **顶部进度**：常驻细进度条（弹簧动画）、`03 / 15` 计数、章节名、百分比。
- **电脑端快捷键**：`1`–`9` / `A`–`D` 选择选项、`Enter` 下一题（总览页为提交）、`Esc` 返回上一题（输入框内则先失焦）；矩阵题用 `↑` `↓` 切换行、数字键打分。
- **手机端**：选项高度 ≥ 48px、底部导航避开安全区域（`safe-area-inset-bottom`）、输入框 16px 字号避免 iOS 自动缩放。
- **单选自动前进**：选中后约 0.6 秒自动进入下一题，右上角「自动 / 手动」可随时切换；返回后仍可修改。
- **必填校验**：不弹浏览器 alert，而是卡片轻震 + 卡片顶部出现温和提示 + 缺失项高亮（矩阵中未评分的行会标红）。
- **草稿防丢失**：答题时每 0.35 秒写入一次 `localStorage`，刷新/关闭页面后自动恢复到原来的步骤，并提示「Draft restored」。
- **提交生命周期**：欢迎页 → 答题 → 总览核对 → 提交中 → 成功页；成功页可下载本次回答的 JSON、可「New response」重新开始。
- **失败重试**：接真实接口后若请求失败，会显示错误页，答案不丢，可直接重试。
- **可访问性**：语义化 `role="radiogroup"` / `aria-checked`、焦点可见、`prefers-reduced-motion` 下关闭位移动画。

---

## 7. 常见问题

**Q：端口 5173 被占用怎么办？**
`vite.config.ts` 里改 `server.port`（例如 5174），或关掉占用端口的程序。

**Q：改了 `.env` 没生效？**
`.env` 只在启动时读取。按 `Ctrl + C` 停掉，再 `npm run dev`。

**Q：怎么清空测试时留下的草稿？**
浏览器 `F12` → Application → Local Storage → 删除 `gai-survey:...` 开头的项；或用页面右上角的「重新开始」按钮（会先弹确认框）。

**Q：想改主题色 / 字体？**
`tailwind.config.js` 里的 `colors`（`ink` / `accent` / `sand`）和 `fontFamily`。改完自动生效。

**Q：想加英文以外的语言？**
现在的结构是「一个中文主字段 + 一个英文副字段」。要加第三种语言（例如日文），最省事的做法是给题目加 `titleJa`、给选项加 `labelJa`，然后在 `StepCard.tsx` / `OptionCard.tsx` / `MatrixQuestion.tsx` 里多渲染一行小字即可。如果要真正做到多语言切换，建议引入 `i18next` 之类的方案，把 `src/data/survey.ts` 的文字换成语言键。

**Q：手机上怎么预览？**
开发服务器启动时会打印 `Network: http://192.168.x.x:5173`，手机和电脑连同一个 Wi-Fi，在手机浏览器打开这个地址即可。

---

## 8. 问卷内容来源

`Questionary.docx`（研究问卷原文）：
A 背景信息（Q1）· B 对 AI 能力的判断（Q2 十二项任务 × 3 分制，Q3 最重要任务）· C 对生成式 AI 的接受与使用（Q4 五点李克特 × 5 项，Q5 使用频率）· D 技能发展策略（Q6 学习投入，Q7 多选，Q8 三点陈述，Q9 隐瞒使用）· E 职业适应力（Q10，Career Adapt-Abilities Scale, Savickas & Porfeli, 2012，24 题按 concern / control / curiosity / confidence 四个维度分成 4 张卡片）· F 开放题（Q11）。

原文 `Questionary.docx` 里的 Q10 只写了「使用已发表的 24 题版本」，因此代码中按该量表的公开条目补齐了 24 条中英文对照；如果研究设计有指定译本，请在 `src/data/survey.ts` 的 `Q10a`–`Q10d` 里替换条目文字即可（`items` 的 `id` 建议保持不变，方便数据对接）。
