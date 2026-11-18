import type {
  MatrixItem,
  Option,
  Question,
  ScalePoint,
  Section,
  SurveyDefinition,
  SurveyStep,
} from '../types/survey'

/* ------------------------------------------------------------------ *
 * Scales
 * ------------------------------------------------------------------ */

/** Q2: what can generative AI currently do? (1 = alone … 3 = cannot) */
export const capabilityScale: ScalePoint[] = [
  {
    value: 1,
    short: 'Alone',
    shortCn: '独立',
    label: 'It can do the task by itself',
    labelCn: 'AI 可以独立完成',
  },
  {
    value: 2,
    short: 'Assists',
    shortCn: '辅助',
    label: 'It can help a person but cannot replace them',
    labelCn: 'AI 可以辅助，但不能替代人',
  },
  {
    value: 3,
    short: "Can't",
    shortCn: '无法',
    label: 'It cannot do the task',
    labelCn: 'AI 无法完成',
  },
]

/** Q4 / Q8: agreement, 1 = strongly disagree … 5 = strongly agree */
export const agreementScale: ScalePoint[] = [
  {
    value: 1,
    short: 'Strongly disagree',
    shortCn: '完全不同意',
    label: 'Strongly disagree',
    labelCn: '完全不同意',
  },
  { value: 2, short: 'Disagree', shortCn: '不同意', label: 'Disagree', labelCn: '不同意' },
  { value: 3, short: 'Neutral', shortCn: '中立', label: 'Neutral', labelCn: '中立' },
  { value: 4, short: 'Agree', shortCn: '同意', label: 'Agree', labelCn: '同意' },
  {
    value: 5,
    short: 'Strongly agree',
    shortCn: '完全同意',
    label: 'Strongly agree',
    labelCn: '完全同意',
  },
]

/** Q10: Career Adapt-Abilities Scale, 1 = not strong … 5 = strongest */
export const caasScale: ScalePoint[] = [
  { value: 1, short: 'Not strong', shortCn: '不强', label: 'Not strong', labelCn: '不强' },
  { value: 2, short: 'Slightly', shortCn: '较弱', label: 'Slightly strong', labelCn: '较弱' },
  { value: 3, short: 'Moderate', shortCn: '一般', label: 'Moderately strong', labelCn: '一般' },
  { value: 4, short: 'Strong', shortCn: '较强', label: 'Strong', labelCn: '较强' },
  { value: 5, short: 'Strongest', shortCn: '最强', label: 'Strongest', labelCn: '最强' },
]

/* ------------------------------------------------------------------ *
 * Shared item banks
 * ------------------------------------------------------------------ */

/** The twelve tasks from Q2, reused verbatim by Q3. */
export const TASK_ITEMS: MatrixItem[] = [
  { id: 't01', label: 'Blocking out a 3D model', labelCn: '搭建 3D 模型大体块' },
  { id: 't02', label: 'Creating textures', labelCn: '制作贴图 / 材质' },
  { id: 't03', label: 'Rigging a character', labelCn: '角色绑定' },
  { id: 't04', label: 'Setting up lighting', labelCn: '布置灯光' },
  { id: 't05', label: 'Retopology', labelCn: '拓扑重建' },
  { id: 't06', label: 'Creating a first-pass concept sketch', labelCn: '绘制初版概念草图' },
  { id: 't07', label: 'Producing variations of an existing design', labelCn: '生成现有设计的变体' },
  {
    id: 't08',
    label: 'Revising work in response to client feedback',
    labelCn: '根据客户反馈修改作品',
  },
  {
    id: 't09',
    label: "Judging whether a model meets a client's brief",
    labelCn: '判断作品是否符合客户需求',
  },
  {
    id: 't10',
    label: 'Coordinating with other departments on a production schedule',
    labelCn: '与其他部门协调生产排期',
  },
  { id: 't11', label: 'Estimating how long a task will take', labelCn: '估算任务所需时间' },
  {
    id: 't12',
    label: 'Taking responsibility for the final quality of a delivered asset',
    labelCn: '对交付成果的最终质量负责',
  },
]

const taskOptions: Option[] = TASK_ITEMS.map((item, index) => ({
  id: item.id,
  label: item.label,
  labelCn: item.labelCn,
  hint: `${index + 1}`,
}))

/* ------------------------------------------------------------------ *
 * Sections
 * ------------------------------------------------------------------ */

export const sections: Section[] = [
  {
    id: 'A',
    letter: 'A',
    title: 'Background',
    titleCn: '背景信息',
    blurb: 'Four quick details so we can group responses.',
  },
  {
    id: 'B',
    letter: 'B',
    title: 'Perceived task capabilities',
    titleCn: '对 AI 能力的判断',
    blurb: 'What do you think generative AI can actually do today?',
  },
  {
    id: 'C',
    letter: 'C',
    title: 'Acceptance and use of generative AI',
    titleCn: '对生成式 AI 的接受与使用',
    blurb: 'Your day-to-day relationship with AI tools.',
  },
  {
    id: 'D',
    letter: 'D',
    title: 'Skill-development strategies',
    titleCn: '技能发展策略',
    blurb: 'How you are investing in your own skills.',
  },
  {
    id: 'E',
    letter: 'E',
    title: 'Career adaptability',
    titleCn: '职业适应力',
    blurb: 'Twenty-four short statements from the Career Adapt-Abilities Scale.',
  },
  {
    id: 'F',
    letter: 'F',
    title: 'Open response',
    titleCn: '开放式回答',
    blurb: 'One question in your own words.',
  },
  {
    id: 'review',
    letter: '✓',
    title: 'Review & submit',
    titleCn: '核对并提交',
    blurb: 'Check your answers before sending.',
  },
]

/* ------------------------------------------------------------------ *
 * Questions
 * ------------------------------------------------------------------ */

const questions: Record<string, Question> = {
  /* ---------------- Section A ---------------- */
  Q1a: {
    id: 'Q1a',
    code: 'Q1 · a',
    sectionId: 'A',
    kind: 'single',
    required: true,
    title: 'Years of professional experience in game or 3D art',
    titleCn: '在游戏或 3D 美术领域的从业年限',
    layout: 'grid',
    options: [
      { id: '0-3', label: '0–3 years', labelCn: '0–3 年' },
      { id: '4+', label: '4 or more years', labelCn: '4 年及以上' },
    ],
  },
  Q1b: {
    id: 'Q1b',
    code: 'Q1 · b',
    sectionId: 'A',
    kind: 'single',
    required: true,
    title: 'Primary role',
    titleCn: '主要职能',
    layout: 'grid',
    options: [
      { id: 'modelling', label: '3D modelling', labelCn: '3D 建模' },
      { id: 'texturing', label: 'Texturing', labelCn: '贴图 / 材质' },
      { id: 'rigging', label: 'Rigging', labelCn: '绑定' },
      { id: 'lighting', label: 'Lighting', labelCn: '灯光' },
      { id: 'concept', label: 'Concept art', labelCn: '概念设计' },
      { id: 'other', label: 'Other', labelCn: '其他' },
    ],
  },
  Q1b_other: {
    id: 'Q1b_other',
    code: 'Q1 · b',
    sectionId: 'A',
    kind: 'text',
    required: true,
    title: 'Which role is that?',
    titleCn: '具体是哪种职能？',
    maxLength: 80,
    minLength: 2,
    placeholder: 'e.g. technical art, environment art, VFX…',
    placeholderCn: '例如：技术美术、场景美术、特效…',
    visibleWhen: (answers) => answers.Q1b === 'other',
  },
  Q1c: {
    id: 'Q1c',
    code: 'Q1 · c',
    sectionId: 'A',
    kind: 'single',
    required: true,
    title: 'Current situation',
    titleCn: '目前状态',
    layout: 'grid',
    options: [
      { id: 'studio', label: 'Employed in a studio', labelCn: '任职于工作室 / 公司' },
      { id: 'freelance', label: 'Freelance', labelCn: '自由职业' },
      { id: 'studying', label: 'Studying', labelCn: '在校学习' },
      { id: 'other', label: 'Other', labelCn: '其他' },
    ],
  },
  Q1c_other: {
    id: 'Q1c_other',
    code: 'Q1 · c',
    sectionId: 'A',
    kind: 'text',
    required: true,
    title: 'Tell us a little more',
    titleCn: '请简单补充',
    maxLength: 80,
    minLength: 2,
    placeholder: 'e.g. between contracts, teaching, indie project…',
    placeholderCn: '例如：项目间隙、教学、独立项目…',
    visibleWhen: (answers) => answers.Q1c === 'other',
  },
  Q1d: {
    id: 'Q1d',
    code: 'Q1 · d',
    sectionId: 'A',
    kind: 'text',
    required: true,
    title: 'City',
    titleCn: '所在城市',
    maxLength: 60,
    minLength: 1,
    placeholder: 'Shanghai, Berlin, remote…',
    placeholderCn: '例如：上海、柏林、远程…',
  },

  /* ---------------- Section B ---------------- */
  Q2: {
    id: 'Q2',
    code: 'Q2',
    sectionId: 'B',
    kind: 'matrix',
    required: true,
    title: 'For each task, what do you think generative AI can currently do?',
    titleCn: '对下面每一项任务，你认为生成式 AI 目前能做到什么程度？',
    description:
      '1 = it can do the task by itself   ·   2 = it can help a person but cannot replace them   ·   3 = it cannot do the task',
    descriptionCn: '1 = 可以独立完成　·　2 = 可以辅助人，但无法替代人　·　3 = 无法完成',
    items: TASK_ITEMS,
    scale: capabilityScale,
  },
  Q3: {
    id: 'Q3',
    code: 'Q3',
    sectionId: 'B',
    kind: 'single',
    required: true,
    title: 'Which of the tasks in Q2 is most important in your own work?',
    titleCn: 'Q2 中的哪一项任务在你的工作中最重要？',
    description: 'Pick the single task you rely on most.',
    descriptionCn: '请只选择一项你最为依赖的任务。',
    layout: 'list',
    options: taskOptions,
  },

  /* ---------------- Section C ---------------- */
  Q4: {
    id: 'Q4',
    code: 'Q4',
    sectionId: 'C',
    kind: 'matrix',
    required: true,
    title: 'Please indicate how much you agree with each statement.',
    titleCn: '请说明你对以下每个陈述的认同程度。',
    description: '1 = strongly disagree   ·   2 = disagree   ·   3 = neutral   ·   4 = agree   ·   5 = strongly agree',
    descriptionCn: '1 = 完全不同意　·　2 = 不同意　·　3 = 中立　·　4 = 同意　·　5 = 完全同意',
    items: [
      {
        id: 'a1',
        label: 'Using generative AI helps me complete my work more quickly.',
        labelCn: '使用生成式 AI 能帮助我更快速地完成工作。',
      },
      {
        id: 'a2',
        label: 'Learning to use generative AI tools is easy for me.',
        labelCn: '学习使用生成式 AI 工具对我来说很容易。',
      },
      {
        id: 'a3',
        label: 'People whose opinions I value think I should use generative AI in my work.',
        labelCn: '我看重其意见的人认为，我应该在工作中使用生成式 AI。',
      },
      {
        id: 'a4',
        label: 'I have the resources and knowledge I need to use generative AI.',
        labelCn: '我拥有使用生成式 AI 所需的资源与知识。',
      },
      {
        id: 'a5',
        label: 'I intend to use generative AI in my future work.',
        labelCn: '我打算在未来的工作中使用生成式 AI。',
      },
    ],
    scale: agreementScale,
  },
  Q5: {
    id: 'Q5',
    code: 'Q5',
    sectionId: 'C',
    kind: 'single',
    required: true,
    title: 'How often do you currently use generative AI tools in your work?',
    titleCn: '你在工作中目前多久使用一次生成式 AI 工具？',
    layout: 'list',
    autoAdvance: true,
    options: [
      { id: 'never', label: 'Never', labelCn: '从不' },
      { id: 'rarely', label: 'Rarely', labelCn: '很少' },
      { id: 'monthly', label: 'Monthly', labelCn: '每月' },
      { id: 'weekly', label: 'Weekly', labelCn: '每周' },
      { id: 'daily', label: 'Daily', labelCn: '每天' },
    ],
  },

  /* ---------------- Section D ---------------- */
  Q6: {
    id: 'Q6',
    code: 'Q6',
    sectionId: 'D',
    kind: 'single',
    required: true,
    title: 'In the past year, how much time have you spent learning to use AI tools?',
    titleCn: '过去一年中，你在学习使用 AI 工具上投入了多少时间？',
    layout: 'list',
    autoAdvance: true,
    options: [
      { id: 'none', label: 'None', labelCn: '没有' },
      { id: 'a-little', label: 'A little', labelCn: '少量' },
      { id: 'moderate', label: 'A moderate amount', labelCn: '适中' },
      { id: 'a-lot', label: 'A lot', labelCn: '很多' },
    ],
  },
  Q7: {
    id: 'Q7',
    code: 'Q7',
    sectionId: 'D',
    kind: 'multi',
    required: true,
    title: 'Which of the following have you deliberately tried to improve?',
    titleCn: '以下哪些方面是你有意去提升的？',
    description: 'Check all that apply.',
    descriptionCn: '可多选。',
    minSelections: 1,
    layout: 'list',
    options: [
      { id: 'technical', label: 'Technical skills in my main role', labelCn: '主职能的技术能力' },
      { id: 'ai-tools', label: 'Using AI tools effectively', labelCn: '高效使用 AI 工具' },
      {
        id: 'irreplaceable',
        label:
          'Skills I think AI cannot replace (for example client communication, creative judgement, problem framing)',
        labelCn: '我认为 AI 无法替代的能力（如客户沟通、创作判断、问题界定）',
      },
      { id: 'domain', label: 'Broader domain knowledge', labelCn: '更广的领域知识' },
      {
        id: 'none',
        label: 'None of these',
        labelCn: '以上都没有',
        exclusive: true,
      },
    ],
  },
  Q8: {
    id: 'Q8',
    code: 'Q8',
    sectionId: 'D',
    kind: 'matrix',
    required: true,
    title: 'Please indicate how much you agree with each statement.',
    titleCn: '请说明你对以下每个陈述的认同程度。',
    description: '1 = strongly disagree   ·   2 = disagree   ·   3 = neutral   ·   4 = agree   ·   5 = strongly agree',
    descriptionCn: '1 = 完全不同意　·　2 = 不同意　·　3 = 中立　·　4 = 同意　·　5 = 完全同意',
    items: [
      {
        id: 'b1',
        label: 'I intend to specialise in work that generative AI cannot do well.',
        labelCn: '我打算专精于生成式 AI 做不好的工作。',
      },
      {
        id: 'b2',
        label: 'I limit my use of AI so that I keep developing my own skills.',
        labelCn: '我会限制 AI 的使用，以保持自身能力的持续成长。',
      },
      {
        id: 'b3',
        label: 'I am confident that my skills will remain valuable in five years.',
        labelCn: '我相信我的能力在五年后依然有价值。',
      },
    ],
    scale: agreementScale,
  },
  Q9: {
    id: 'Q9',
    code: 'Q9',
    sectionId: 'D',
    kind: 'single',
    required: true,
    title: 'Have you ever chosen not to tell others that you used AI in your work?',
    titleCn: '你是否曾选择不告诉别人你在工作中使用了 AI？',
    layout: 'grid',
    autoAdvance: true,
    options: [
      { id: 'yes', label: 'Yes', labelCn: '是' },
      { id: 'no', label: 'No', labelCn: '否' },
    ],
  },

  /* ---------------- Section E: CAAS (Savickas & Porfeli, 2012) ---------------- */
  Q10a: {
    id: 'Q10a',
    code: 'Q10',
    sectionId: 'E',
    kind: 'matrix',
    required: true,
    groupLabel: 'Concern',
    groupLabelCn: '关注',
    title: 'How strongly have you developed each ability?',
    titleCn: '你在多大程度上发展出了以下能力？',
    description: '1 = not strong   ·   2 = slightly strong   ·   3 = moderately strong   ·   4 = strong   ·   5 = strongest',
    descriptionCn: '1 = 不强　·　2 = 较弱　·　3 = 一般　·　4 = 较强　·　5 = 最强',
    items: [
      { id: 'c1', label: 'Thinking about what my future will be like', labelCn: '思考我的未来会是什么样' },
      {
        id: 'c2',
        label: "Realizing that today's choices shape my future",
        labelCn: '意识到今天的选择会塑造我的未来',
      },
      { id: 'c3', label: 'Preparing for the future', labelCn: '为未来做准备' },
      {
        id: 'c4',
        label: 'Becoming aware of the educational and career choices that I must make',
        labelCn: '意识到我必须做出的教育与职业选择',
      },
      { id: 'c5', label: 'Planning how to achieve my goals', labelCn: '计划如何实现我的目标' },
      { id: 'c6', label: 'Concerned about my career', labelCn: '关心我的职业生涯' },
    ],
    scale: caasScale,
  },
  Q10b: {
    id: 'Q10b',
    code: 'Q10',
    sectionId: 'E',
    kind: 'matrix',
    required: true,
    groupLabel: 'Control',
    groupLabelCn: '控制',
    title: 'How strongly have you developed each ability?',
    titleCn: '你在多大程度上发展出了以下能力？',
    description: '1 = not strong   ·   2 = slightly strong   ·   3 = moderately strong   ·   4 = strong   ·   5 = strongest',
    descriptionCn: '1 = 不强　·　2 = 较弱　·　3 = 一般　·　4 = 较强　·　5 = 最强',
    items: [
      { id: 'k1', label: 'Keeping upbeat', labelCn: '保持乐观' },
      { id: 'k2', label: 'Making decisions by myself', labelCn: '自己做决定' },
      { id: 'k3', label: 'Taking responsibility for my actions', labelCn: '为自己的行为负责' },
      { id: 'k4', label: 'Sticking up for my beliefs', labelCn: '坚持自己的信念' },
      { id: 'k5', label: 'Counting on myself', labelCn: '依靠自己' },
      { id: 'k6', label: "Doing what's right for me", labelCn: '做适合自己的事' },
    ],
    scale: caasScale,
  },
  Q10c: {
    id: 'Q10c',
    code: 'Q10',
    sectionId: 'E',
    kind: 'matrix',
    required: true,
    groupLabel: 'Curiosity',
    groupLabelCn: '好奇',
    title: 'How strongly have you developed each ability?',
    titleCn: '你在多大程度上发展出了以下能力？',
    description: '1 = not strong   ·   2 = slightly strong   ·   3 = moderately strong   ·   4 = strong   ·   5 = strongest',
    descriptionCn: '1 = 不强　·　2 = 较弱　·　3 = 一般　·　4 = 较强　·　5 = 最强',
    items: [
      { id: 'q1', label: 'Exploring my surroundings', labelCn: '探索周围的环境' },
      { id: 'q2', label: 'Looking for opportunities to grow as a person', labelCn: '寻找个人成长的机会' },
      { id: 'q3', label: 'Investigating options before making a choice', labelCn: '在做选择前了解各种选项' },
      { id: 'q4', label: 'Observing different ways of doing things', labelCn: '观察不同的做事方式' },
      { id: 'q5', label: 'Probing deeply into questions I have', labelCn: '深入探究自己的疑问' },
      { id: 'q6', label: 'Becoming curious about new opportunities', labelCn: '对新机会保持好奇' },
    ],
    scale: caasScale,
  },
  Q10d: {
    id: 'Q10d',
    code: 'Q10',
    sectionId: 'E',
    kind: 'matrix',
    required: true,
    groupLabel: 'Confidence',
    groupLabelCn: '自信',
    title: 'How strongly have you developed each ability?',
    titleCn: '你在多大程度上发展出了以下能力？',
    description: '1 = not strong   ·   2 = slightly strong   ·   3 = moderately strong   ·   4 = strong   ·   5 = strongest',
    descriptionCn: '1 = 不强　·　2 = 较弱　·　3 = 一般　·　4 = 较强　·　5 = 最强',
    items: [
      { id: 'f1', label: 'Performing tasks efficiently', labelCn: '高效地完成任务' },
      { id: 'f2', label: 'Taking care to do things well', labelCn: '认真把事情做好' },
      { id: 'f3', label: 'Learning new skills', labelCn: '学习新技能' },
      { id: 'f4', label: 'Working up to my ability', labelCn: '发挥自己的能力' },
      { id: 'f5', label: 'Overcoming obstacles', labelCn: '克服障碍' },
      { id: 'f6', label: 'Solving problems', labelCn: '解决问题' },
    ],
    scale: caasScale,
  },

  /* ---------------- Section F ---------------- */
  Q11: {
    id: 'Q11',
    code: 'Q11',
    sectionId: 'F',
    kind: 'text',
    required: false,
    multiline: true,
    title: 'What do you think you should learn so that generative AI does not replace you?',
    titleCn: '你认为自己应该学习什么，才能不被生成式 AI 取代？',
    description: 'Answer in any language you like. A few sentences is plenty.',
    descriptionCn: '可以用任何语言作答，两三句话即可。',
    maxLength: 2000,
    placeholder:
      'For example: the judgement calls that never fit a brief, the parts of the pipeline that need a human to say "yes, this is right"…',
    placeholderCn: '例如：永远无法写进需求文档的判断、流程中必须由人确认「这样对了」的环节……',
    note: 'Optional',
  },
}

/* ------------------------------------------------------------------ *
 * Steps — one card at a time (15 in total)
 * ------------------------------------------------------------------ */

const steps: SurveyStep[] = [
  {
    id: 'step-q1',
    sectionId: 'A',
    title: 'Please provide the following background information.',
    titleCn: '请提供以下背景信息。',
    questions: ['Q1a', 'Q1b', 'Q1b_other', 'Q1c', 'Q1c_other', 'Q1d'],
  },
  { id: 'step-q2', sectionId: 'B', questions: ['Q2'] },
  { id: 'step-q3', sectionId: 'B', questions: ['Q3'] },
  { id: 'step-q4', sectionId: 'C', questions: ['Q4'] },
  { id: 'step-q5', sectionId: 'C', questions: ['Q5'] },
  { id: 'step-q6', sectionId: 'D', questions: ['Q6'] },
  { id: 'step-q7', sectionId: 'D', questions: ['Q7'] },
  { id: 'step-q8', sectionId: 'D', questions: ['Q8'] },
  { id: 'step-q9', sectionId: 'D', questions: ['Q9'] },
  {
    id: 'step-q10a',
    sectionId: 'E',
    questions: ['Q10a'],
    eyebrow: 'Part 1 of 4',
    eyebrowCn: '第 1 部分 / 共 4 部分',
  },
  {
    id: 'step-q10b',
    sectionId: 'E',
    questions: ['Q10b'],
    eyebrow: 'Part 2 of 4',
    eyebrowCn: '第 2 部分 / 共 4 部分',
  },
  {
    id: 'step-q10c',
    sectionId: 'E',
    questions: ['Q10c'],
    eyebrow: 'Part 3 of 4',
    eyebrowCn: '第 3 部分 / 共 4 部分',
  },
  {
    id: 'step-q10d',
    sectionId: 'E',
    questions: ['Q10d'],
    eyebrow: 'Part 4 of 4',
    eyebrowCn: '第 4 部分 / 共 4 部分',
  },
  { id: 'step-q11', sectionId: 'F', questions: ['Q11'] },
  {
    id: 'step-review',
    sectionId: 'review',
    title: 'One last look before you send it.',
    titleCn: '发送前最后核对一次。',
    questions: [],
  },
]

export const survey: SurveyDefinition = {
  id: 'gai-3d-artist-2026',
  version: '1.0.0',
  title: 'Generative AI and the work of game & 3D artists',
  titleCn: '生成式 AI 与游戏 / 3D 美术的工作',
  intro:
    'A short research survey on how generative AI is changing the daily work, skills and career outlook of game and 3D artists.',
  introCn: '一份关于生成式 AI 如何改变游戏与 3D 美术从业者日常工作、技能与职业前景的简短研究问卷。',
  estimatedMinutes: 7,
  sections,
  questions,
  steps,
}

/* ------------------------------------------------------------------ *
 * Selectors
 * ------------------------------------------------------------------ */

export const stepCount = steps.length

export const totalItemCount = Object.values(questions).reduce((sum, question) => {
  if (question.kind === 'matrix') return sum + question.items.length
  return sum + 1
}, 0)

export function getSection(id: Section['id']): Section {
  return sections.find((section) => section.id === id) ?? sections[0]
}

/** Questions of a step that are currently visible for the given answers. */
export function visibleQuestionsOf(
  step: SurveyStep,
  answers: Record<string, unknown>,
): Question[] {
  return step.questions
    .map((id) => questions[id])
    .filter((question): question is Question => Boolean(question))
    .filter((question) => !question.visibleWhen || question.visibleWhen(answers as never))
}
