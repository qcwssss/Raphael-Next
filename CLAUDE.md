# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev          # Starts Next.js dev server on http://localhost:3000

# Build and production
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Package management
npm install          # Install dependencies
```

## Project Architecture

### Tech Stack
- **Framework**: Next.js 14 (Pages Router) with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks (useState, useRef)
- **Internationalization**: Custom i18n system supporting 4 languages (zh, en, ja, ko)

### Key Files Structure
```
├── pages/
│   ├── _app.tsx              # App configuration and global providers
│   └── index.tsx             # Main application (single-page app with 4 states)
├── lib/
│   └── translations.ts       # Internationalization system with Language type and translations
├── styles/
│   └── globals.css           # Global CSS with dark theme and glassmorphism
└── tailwind.config.js        # Extensive custom Tailwind config
```

### Application States
The main application (`pages/index.tsx`) uses a state machine with 4 distinct steps:
1. **upload** - File drag/drop upload interface
2. **styleSelect** - Art style selection with custom prompt option
3. **generating** - Progress animation with simulated AI generation
4. **result** - Side-by-side comparison with download/regenerate actions

### Internationalization System
- Type: `Language = 'zh' | 'en' | 'ja' | 'ko'`
- Hook: `useTranslation(language)` returns `{ t, language }`
- Usage: `t('key.path')` or `t('key', { param: 'value' })`
- Located in: `lib/translations.ts`

### Design System
The project uses a sophisticated dark theme with:
- **Custom Tailwind gradients**: 9 predefined gradients (gradient-primary, gradient-hero, etc.)
- **Extended color palette**: dark, primary, accent, purple color scales
- **Glassmorphism effects**: backdrop-blur with semi-transparent overlays
- **Custom animations**: gradient, float, pulse-glow with keyframe definitions
- **Typography**: Inter + Cal Sans font stack

### Style Management
Art style options are defined in `getStyleOptions()` function with structure:
```typescript
interface StyleOption {
  id: string       // matches translations key
  name: string     // from translations
  emoji: string    // display emoji
  description: string  // from translations
  thumbnail: string    // placeholder image
}
```

### Current Limitations
- Uses mock data and simulated delays (no real AI API integration)
- File upload creates data URLs only (no server upload)
- Result images are placeholder endpoints (/api/placeholder/*)

## Code Conventions
- TypeScript strict mode enabled
- React functional components with hooks
- Tailwind utility-first CSS approach
- State managed through React hooks (no external state library)
- Responsive design mobile-first approach