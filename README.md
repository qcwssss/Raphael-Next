# Code Leonardo ✨

AI图像风格转换工具 - 将你的照片转换为艺术作品

## 📖 项目简介

Code Leonardo 是一个现代化的AI图像风格转换工具，用户可以上传图片并选择不同的艺术风格（如吉卜力、龙珠、像素风等），AI会生成相应风格的图片供用户下载。

## ✨ 主要功能

- 📸 **拖拽上传** - 支持拖拽和点击上传图片
- 🎨 **多种风格** - 吉卜力、龙珠、像素、油画、卡通等风格
- 📱 **响应式设计** - 完美适配桌面端和移动端
- ⚡ **实时进度** - 生成过程可视化进度条
- 🔄 **重新生成** - 支持重新生成和风格调整
- 💾 **一键下载** - 生成结果可直接下载

## 🛠 技术栈

- **框架**: Next.js 14
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: React Hooks
- **字体**: Inter (Google Fonts)

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
│   ├── _app.tsx          # 应用入口
│   └── index.tsx         # 主页面组件
├── styles/
│   └── globals.css       # 全局样式
├── components/           # 组件目录（预留）
├── public/              # 静态资源
├── .env.local          # 环境变量（本地）
├── .env.example        # 环境变量示例
├── tailwind.config.js  # Tailwind 配置
├── next.config.js      # Next.js 配置
├── tsconfig.json       # TypeScript 配置
└── package.json        # 项目配置
```

## 🎨 设计系统

### 色彩方案
- **主色**: 紫色到蓝色渐变 (#8B5CF6 → #3B82F6)
- **强调色**: 橙色/金色 (#f59e0b)
- **背景**: 白色和浅灰渐变
- **文字**: 深灰色 (#1e293b, #64748b)

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

### Tailwind CSS
项目使用自定义的 Tailwind 配置，包括：
- 自定义渐变背景
- 扩展的色彩主题
- 响应式断点

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

### 添加新的风格选项

在 `pages/index.tsx` 中的 `styleOptions` 数组添加新选项：

```typescript
const styleOptions: StyleOption[] = [
  // 现有选项...
  { 
    id: 'newStyle', 
    name: '新风格', 
    emoji: '🎭', 
    description: '新的艺术风格描述',
    thumbnail: '/api/placeholder/120/120' 
  },
]
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

---

**Code Leonardo** - 让每张照片都成为艺术品 🎨✨