export type Language = 'zh' | 'en' | 'ja' | 'ko'

export const languages = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어'
}

export const translations = {
  zh: {
    // Header
    brandName: 'Code Leonardo ✨',
    brandSubtitle: 'AI风格转换',
    nav: {
      home: '首页',
      features: '功能',
      pricing: '定价',
      login: '登录',
      signup: '注册'
    },
    
    // Upload State
    heroTitle: '🎨 将你的照片转换为艺术作品',
    heroSubtitle: '上传图片，选择风格，即刻生成',
    uploadArea: '📸 拖拽图片到这里或点击上传',
    uploadSupport: '支持 JPG, PNG (最大5MB)',
    buttons: {
      freeTrial: '免费试用',
      viewExamples: '查看示例',
      generate: '🚀 生成图片',
      download: '💾 下载图片',
      regenerate: '🔄 重新生成',
      share: '📤 分享',
      cancel: '取消生成',
      restart: '重新开始'
    },
    
    // Style Selection
    uploadedImage: '📷 已上传图片',
    customPrompt: '📝 自定义提示(可选)',
    customPromptPlaceholder: '在这里输入额外的描述...',
    selectStyle: '🎨 选择艺术风格',
    
    // Styles
    styles: {
      ghibli: { name: '吉卜力风格', description: '梦幻的手绘动画风格' },
      dragonball: { name: '龙珠风格', description: '经典日漫战斗风格' },
      pixel: { name: '像素风格', description: '8位复古游戏风格' },
      oil: { name: '油画风格', description: '古典艺术油画风格' },
      cartoon: { name: '卡通风格', description: '可爱的卡通插画风格' }
    },
    
    // Generating State
    generating: '🎨 AI正在创作中',
    estimatedTime: '预计剩余时间: {time}秒',
    
    // Result State
    generationComplete: '✨ 生成完成！',
    originalImage: '原图',
    generatedResult: '生成结果',
    dailyUsage: '今日剩余次数: {remaining}/{total}',
    upgradePrompt: '升级到高级版无限制',
    
    // Common
    fileSizeError: '文件大小不能超过5MB'
  },
  
  en: {
    // Header
    brandName: 'Code Leonardo ✨',
    brandSubtitle: 'AI Style Transfer',
    nav: {
      home: 'Home',
      features: 'Features',
      pricing: 'Pricing',
      login: 'Login',
      signup: 'Sign Up'
    },
    
    // Upload State
    heroTitle: '🎨 Transform Your Photos into Artworks',
    heroSubtitle: 'Upload image, select style, generate instantly',
    uploadArea: '📸 Drag image here or click to upload',
    uploadSupport: 'Supports JPG, PNG (Max 5MB)',
    buttons: {
      freeTrial: 'Free Trial',
      viewExamples: 'View Examples',
      generate: '🚀 Generate Image',
      download: '💾 Download Image',
      regenerate: '🔄 Regenerate',
      share: '📤 Share',
      cancel: 'Cancel Generation',
      restart: 'Start Over'
    },
    
    // Style Selection
    uploadedImage: '📷 Uploaded Image',
    customPrompt: '📝 Custom Prompt (Optional)',
    customPromptPlaceholder: 'Enter additional description here...',
    selectStyle: '🎨 Select Art Style',
    
    // Styles
    styles: {
      ghibli: { name: 'Studio Ghibli', description: 'Dreamy hand-drawn animation style' },
      dragonball: { name: 'Dragon Ball', description: 'Classic anime battle style' },
      pixel: { name: 'Pixel Art', description: '8-bit retro game style' },
      oil: { name: 'Oil Painting', description: 'Classical fine art style' },
      cartoon: { name: 'Cartoon', description: 'Cute cartoon illustration style' }
    },
    
    // Generating State
    generating: '🎨 AI is Creating',
    estimatedTime: 'Estimated time remaining: {time}s',
    
    // Result State
    generationComplete: '✨ Generation Complete!',
    originalImage: 'Original',
    generatedResult: 'Generated Result',
    dailyUsage: 'Daily remaining: {remaining}/{total}',
    upgradePrompt: 'Upgrade to Premium for Unlimited',
    
    // Common
    fileSizeError: 'File size cannot exceed 5MB'
  },
  
  ja: {
    // Header
    brandName: 'Code Leonardo ✨',
    brandSubtitle: 'AIスタイル変換',
    nav: {
      home: 'ホーム',
      features: '機能',
      pricing: '料金',
      login: 'ログイン',
      signup: '登録'
    },
    
    // Upload State
    heroTitle: '🎨 写真を芸術作品に変換',
    heroSubtitle: '画像をアップロード、スタイルを選択、即座に生成',
    uploadArea: '📸 画像をここにドラッグまたはクリックしてアップロード',
    uploadSupport: 'JPG、PNG対応 (最大5MB)',
    buttons: {
      freeTrial: '無料体験',
      viewExamples: '例を見る',
      generate: '🚀 画像生成',
      download: '💾 画像ダウンロード',
      regenerate: '🔄 再生成',
      share: '📤 共有',
      cancel: '生成キャンセル',
      restart: 'やり直し'
    },
    
    // Style Selection
    uploadedImage: '📷 アップロード済み画像',
    customPrompt: '📝 カスタムプロンプト（任意）',
    customPromptPlaceholder: 'ここに追加の説明を入力...',
    selectStyle: '🎨 アートスタイルを選択',
    
    // Styles
    styles: {
      ghibli: { name: 'ジブリ風', description: '夢幻的な手描きアニメ風' },
      dragonball: { name: 'ドラゴンボール風', description: '古典的なアニメバトル風' },
      pixel: { name: 'ピクセル風', description: '8ビットレトロゲーム風' },
      oil: { name: '油絵風', description: '古典的な美術油絵風' },
      cartoon: { name: 'カートゥーン風', description: 'かわいいカートゥンイラスト風' }
    },
    
    // Generating State
    generating: '🎨 AI作成中',
    estimatedTime: '推定残り時間: {time}秒',
    
    // Result State
    generationComplete: '✨ 生成完了！',
    originalImage: 'オリジナル',
    generatedResult: '生成結果',
    dailyUsage: '本日残り回数: {remaining}/{total}',
    upgradePrompt: 'プレミアムにアップグレードして無制限に',
    
    // Common
    fileSizeError: 'ファイルサイズは5MBを超えることはできません'
  },
  
  ko: {
    // Header
    brandName: 'Code Leonardo ✨',
    brandSubtitle: 'AI 스타일 변환',
    nav: {
      home: '홈',
      features: '기능',
      pricing: '가격',
      login: '로그인',
      signup: '가입'
    },
    
    // Upload State
    heroTitle: '🎨 사진을 예술 작품으로 변환',
    heroSubtitle: '이미지 업로드, 스타일 선택, 즉시 생성',
    uploadArea: '📸 이미지를 여기로 드래그하거나 클릭하여 업로드',
    uploadSupport: 'JPG, PNG 지원 (최대 5MB)',
    buttons: {
      freeTrial: '무료 체험',
      viewExamples: '예시 보기',
      generate: '🚀 이미지 생성',
      download: '💾 이미지 다운로드',
      regenerate: '🔄 재생성',
      share: '📤 공유',
      cancel: '생성 취소',
      restart: '다시 시작'
    },
    
    // Style Selection
    uploadedImage: '📷 업로드된 이미지',
    customPrompt: '📝 사용자 정의 프롬프트 (선택사항)',
    customPromptPlaceholder: '여기에 추가 설명을 입력하세요...',
    selectStyle: '🎨 아트 스타일 선택',
    
    // Styles
    styles: {
      ghibli: { name: '지브리 스타일', description: '몽환적인 수작업 애니메이션 스타일' },
      dragonball: { name: '드래곤볼 스타일', description: '클래식 애니메 배틀 스타일' },
      pixel: { name: '픽셀 스타일', description: '8비트 레트로 게임 스타일' },
      oil: { name: '유화 스타일', description: '고전적인 미술 유화 스타일' },
      cartoon: { name: '카툰 스타일', description: '귀여운 카툰 일러스트 스타일' }
    },
    
    // Generating State
    generating: '🎨 AI 창작 중',
    estimatedTime: '예상 남은 시간: {time}초',
    
    // Result State
    generationComplete: '✨ 생성 완료!',
    originalImage: '원본',
    generatedResult: '생성 결과',
    dailyUsage: '오늘 남은 횟수: {remaining}/{total}',
    upgradePrompt: '프리미엄으로 업그레이드하여 무제한 이용',
    
    // Common
    fileSizeError: '파일 크기는 5MB를 초과할 수 없습니다'
  }
}

export const useTranslation = (language: Language) => {
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    if (typeof value !== 'string') return key
    
    if (params) {
      return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
        return str.replace(`{${paramKey}}`, String(paramValue))
      }, value)
    }
    
    return value
  }
  
  return { t, language }
}