# Code Leonardo ✨

**现代化AI图像风格转换工具** - 将你的照片转换为令人惊艳的艺术作品

![Modern Dark UI](https://img.shields.io/badge/UI-Modern%20Dark%20Theme-blueviolet?style=for-the-badge)
![Multi-Language](https://img.shields.io/badge/i18n-4%20Languages-green?style=for-the-badge)
![Responsive](https://img.shields.io/badge/Design-Responsive-orange?style=for-the-badge)

## 🌟 项目亮点

Code Leonardo 是一个**高颜值、现代化**的AI图像风格转换工具，采用**暗色主题**和**玻璃拟态设计**，为用户提供极致的视觉体验。支持多种艺术风格转换，让每张普通照片都能成为独特的艺术作品。

## ✨ 核心功能

### 🎨 **视觉设计**
- 🌙 **现代暗色主题** - 优雅的深色界面设计
- ✨ **玻璃拟态效果** - 时尚的毛玻璃质感
- 🌈 **动态渐变** - 多彩渐变动画效果
- 💫 **发光特效** - 互动元素光效反馈
- 🎯 **悬浮动画** - 流畅的交互动画

### 🚀 **用户体验**
- 📸 **智能拖拽上传** - 支持拖拽和点击上传，实时预览
- 🎨 **5种艺术风格** - 吉卜力、龙珠、像素、油画、卡通风格
- ⚡ **实时进度展示** - 炫酷的进度条和状态动画
- 🔄 **一键重新生成** - 快速调整和重新生成
- 💾 **高质量下载** - 支持多格式图片导出

### 🌍 **国际化支持**
- 🇨🇳 **中文** - 简体中文界面
- 🇺🇸 **English** - 完整英文本地化
- 🇯🇵 **日本語** - 日语界面支持
- 🇰🇷 **한국어** - 韩语本地化

### 📱 **响应式设计**
- 💻 **桌面端优化** - 大屏幕完美展示
- 📱 **移动端适配** - 手机平板无缝体验
- 🔄 **自适应布局** - 智能响应不同分辨率

## 🛠 技术栈

### 前端技术
- **框架**: Next.js 14 - React全栈框架
- **语言**: TypeScript - 类型安全的JavaScript
- **样式**: Tailwind CSS - 现代化CSS框架
- **状态管理**: React Hooks - 轻量级状态管理
- **国际化**: 自定义i18n系统 - 4语言支持

### 设计技术
- **字体**: Inter & Cal Sans - 现代无衬线字体
- **动画**: CSS Animations - 流畅交互动画
- **特效**: 玻璃拟态、发光效果、渐变动画
- **图标**: Emoji + 自定义图标
- **主题**: 自定义暗色主题系统

## 🚀 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- npm 或 yarn

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
npm start
# 或
yarn build
yarn start
```

## 📁 项目结构

```
code-leonardo/
├── pages/
│   ├── _app.tsx              # 应用入口配置
│   └── index.tsx             # 主页面组件（包含所有UI状态）
├── lib/
│   └── translations.ts       # 国际化翻译系统
├── styles/
│   └── globals.css           # 全局样式（暗色主题 + 玻璃效果）
├── components/               # 组件目录（预留扩展）
├── public/                   # 静态资源
├── .env.local               # 环境变量（本地开发）
├── .env.example             # 环境变量模板
├── tailwind.config.js       # Tailwind自定义配置（渐变+动画）
├── next.config.js           # Next.js配置
├── tsconfig.json            # TypeScript配置
├── postcss.config.js        # PostCSS配置
├── leonardo_ui_prompt.md    # 原始UI设计需求
├── package.json             # 项目依赖配置
└── README.md                # 项目文档
```

## 🎨 设计系统

### 🌈 色彩方案
- **主渐变**: `gradient-primary` - 蓝紫渐变 (#667eea → #764ba2)
- **次要渐变**: `gradient-secondary` - 粉红渐变 (#f093fb → #f5576c)
- **强调渐变**: `gradient-accent` - 蓝青渐变 (#4facfe → #00f2fe)
- **暖色调**: `gradient-warm` - 粉黄渐变 (#fa709a → #fee140)
- **英雄渐变**: `gradient-hero` - 三色渐变 (#667eea → #764ba2 → #f093fb)

### 🎯 暗色主题
- **背景**: 深色渐变 (#0f172a → #1e293b → #334155)
- **玻璃效果**: 半透明白色/黑色叠加
- **边框**: 半透明白色边框 (rgba(255,255,255,0.1-0.3))
- **文字**: 白色主色，浅灰副色

### ✨ 视觉效果
- **玻璃拟态**: `backdrop-blur` + 半透明背景
- **发光效果**: `box-shadow` 光晕效果
- **动画**: 渐变动画、悬浮动画、脉冲发光
- **圆角**: 大圆角设计 (rounded-2xl, rounded-3xl)

### 组件状态
应用包含4个主要状态：
1. **upload** - 文件上传状态
2. **styleSelect** - 风格选择状态
3. **generating** - 生成进度状态
4. **result** - 结果展示状态

## 🔧 配置说明

### 环境变量
复制 `.env.example` 到 `.env.local` 并配置相应的环境变量：

```bash
cp .env.example .env.local
```

### Tailwind CSS 配置
项目使用高度自定义的 Tailwind 配置：

- **🌈 多种渐变背景** - 8+ 预设渐变组合
- **🎨 扩展色彩系统** - dark、primary、accent、purple 色彩体系
- **✨ 自定义动画** - gradient、float、pulse-glow 动画
- **💫 特效样式** - 发光、阴影、玻璃效果
- **📱 响应式断点** - 移动优先的响应式设计
- **🔤 字体系统** - Inter + Cal Sans 字体栈

## 🚧 开发说明

当前版本使用模拟数据和延时来模拟AI生成过程，不包含真实的文件上传和AI API调用功能。

### 主要状态管理

```typescript
const [currentStep, setCurrentStep] = useState<Step>('upload')
const [uploadedFile, setUploadedFile] = useState<File | null>(null)
const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
const [generationProgress, setGenerationProgress] = useState<number>(0)
// ... 其他状态
```

### 🎨 添加新的风格选项

在 `lib/translations.ts` 中添加多语言支持，然后在 `pages/index.tsx` 中的 `getStyleOptions` 函数添加新选项：

```typescript
// 1. 在 translations.ts 中添加翻译
styles: {
  newStyle: { 
    name: '新风格', 
    description: '新的艺术风格描述' 
  }
}

// 2. 在 index.tsx 中添加风格选项
const getStyleOptions = (t: any): StyleOption[] => [
  // 现有选项...
  { 
    id: 'newStyle', 
    name: t('styles.newStyle.name'), 
    emoji: '🎭', 
    description: t('styles.newStyle.description'),
    thumbnail: '/api/placeholder/120/120' 
  },
]
```

### 🌍 添加新语言支持

在 `lib/translations.ts` 中扩展语言支持：

```typescript
// 1. 添加语言类型
export type Language = 'zh' | 'en' | 'ja' | 'ko' | 'fr' // 新增法语

// 2. 添加语言名称
export const languages = {
  // 现有语言...
  fr: 'Français' // 新增
}

// 3. 添加翻译内容
export const translations = {
  // 现有翻译...
  fr: {
    brandName: 'Code Leonardo ✨',
    // ... 完整的法语翻译
  }
}
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 📞 联系我们

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件
- 创建 Discussion

## 🖼️ 界面预览

### 🌙 暗色主题设计
- 优雅的深色背景渐变
- 现代玻璃拟态卡片设计
- 炫酷的发光和动画效果

### 📱 响应式适配
- 桌面端：大屏幕优雅布局
- 移动端：触摸友好的交互设计
- 平板端：完美适配中等屏幕

### 🎨 交互体验
- 流畅的状态切换动画
- 悬浮和点击反馈效果
- 智能的进度展示系统

## 🚀 部署说明

### Vercel 部署（推荐）
```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 部署项目
vercel

# 3. 设置环境变量（在 Vercel 仪表板中）
```

### 其他平台
- **Netlify**: 支持静态部署
- **Docker**: 容器化部署
- **自托管**: Node.js 服务器部署

## 🔮 未来规划

### 🎯 功能增强
- [ ] 真实AI API集成
- [ ] 用户账号系统
- [ ] 图片历史记录
- [ ] 社交分享功能
- [ ] 批量处理支持

### 🎨 视觉升级
- [ ] 更多艺术风格
- [ ] 3D视觉效果
- [ ] 自定义主题
- [ ] 动态壁纸模式

### 🌍 体验优化
- [ ] PWA支持
- [ ] 离线使用
- [ ] 更多语言支持
- [ ] 无障碍访问优化

---

<div align="center">

**Code Leonardo** ✨

*让每张照片都成为令人惊艳的艺术作品*

[![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

</div>