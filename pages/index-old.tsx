import { useState, useRef, useCallback } from "react";
import Head from "next/head";
import { Language, languages, useTranslation } from "../lib/translations";

type Step = "upload" | "styleSelect" | "generating" | "result";

interface StyleOption {
  id: string;
  name: string;
  emoji: string;
  description: string;
  thumbnail: string;
}

const getStyleOptions = (t: any): StyleOption[] => [
  {
    id: "ghibli",
    name: t("styles.ghibli.name"),
    emoji: "🌟",
    description: t("styles.ghibli.description"),
    thumbnail: "/api/placeholder/120/120",
  },
  {
    id: "dragonball",
    name: t("styles.dragonball.name"),
    emoji: "🐉",
    description: t("styles.dragonball.description"),
    thumbnail: "/api/placeholder/120/120",
  },
  {
    id: "pixel",
    name: t("styles.pixel.name"),
    emoji: "🎮",
    description: t("styles.pixel.description"),
    thumbnail: "/api/placeholder/120/120",
  },
  {
    id: "oil",
    name: t("styles.oil.name"),
    emoji: "🎨",
    description: t("styles.oil.description"),
    thumbnail: "/api/placeholder/120/120",
  },
  {
    id: "cartoon",
    name: t("styles.cartoon.name"),
    emoji: "🎪",
    description: t("styles.cartoon.description"),
    thumbnail: "/api/placeholder/120/120",
  },
];

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [dailyUsage, setDailyUsage] = useState<number>(2);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>("zh");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationProvider, setGenerationProvider] = useState<string | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation(currentLanguage);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        handleFileUpload(file);
      }
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert(t("fileSizeError"));
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append("file", file);

      console.log("🚀 Uploading file to R2:", file.name);

      const response = await fetch("/api/upload-simple", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Upload successful:", data);

        // Set the uploaded file info
        setUploadedFile(file);
        setSessionId(data.data.sessionId);
        setUploadedImageUrl(data.data.fileUrl); // Use R2 URL instead of data URL
        setCurrentStep("styleSelect");

        // Update usage if available
        if (data.data.usage) {
          setDailyUsage(data.data.usage.remaining_generations || 5);
        }
      } else {
        console.error("❌ Upload failed:", data.error);
        setUploadError(data.error);
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error("❌ Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setUploadError(errorMessage);
      alert(`Upload error: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
  };

  const handleGenerate = async () => {
    if (!selectedStyle || !sessionId) return;

    setCurrentStep("generating");
    setGenerationProgress(0);
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationProvider(null);

    try {
      console.log(`🎨 Starting AI generation for style: ${selectedStyle}`);

      // Show initial progress
      setGenerationProgress(10);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          style: selectedStyle,
          customPrompt: customPrompt || undefined,
        }),
      });

      const data = await response.json();

      // Update progress during request
      setGenerationProgress(70);

      if (data.success) {
        console.log("✅ AI generation successful:", data.data);

        // Complete progress
        setGenerationProgress(100);

        // Set the result image URL and provider info
        setResultImageUrl(data.data.generatedImageUrl);
        setGenerationProvider(data.data.provider);
        setCurrentStep("result");

        // Update usage count (assuming successful generation)
        setDailyUsage((prev) => prev + 1);

        console.log(
          `🎉 Generation completed with ${data.data.provider} in ${data.data.processingTimeMs}ms`
        );
      } else {
        console.error("❌ AI generation failed:", data.error);
        setGenerationError(data.error);

        // Reset to style selection if generation fails
        setCurrentStep("styleSelect");
        setGenerationProgress(0);
      }
    } catch (error) {
      console.error("❌ Generation error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Generation failed";
      setGenerationError(errorMessage);

      // Reset to style selection on error
      setCurrentStep("styleSelect");
      setGenerationProgress(0);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setCurrentStep("upload");
    setUploadedFile(null);
    setUploadedImageUrl(null);
    setSelectedStyle(null);
    setCustomPrompt("");
    setGenerationProgress(0);
    setResultImageUrl(null);
    setSessionId(null);
    setIsUploading(false);
    setUploadError(null);
    setIsGenerating(false);
    setGenerationError(null);
    setGenerationProvider(null);
  };

  const remainingTime = Math.max(
    0,
    Math.ceil((100 - generationProgress) * 0.3)
  );
  const styleOptions = getStyleOptions(t);

  return (
    <>
      <Head>
        <title>
          {t("brandName")} - {t("brandSubtitle")}
        </title>
        <meta name="description" content={t("heroSubtitle")} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 text-white">
        {/* Header */}
        <header className="glass-dark sticky top-0 z-50 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent font-display">
                  {t("brandName")}
                </h1>
                <span className="ml-3 text-sm text-slate-300 hidden sm:inline font-medium">
                  {t("brandSubtitle")}
                </span>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex space-x-8">
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-lg"
                >
                  {t("nav.home")}
                </a>
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-lg"
                >
                  {t("nav.features")}
                </a>
                <a
                  href="#"
                  className="text-slate-300 hover:text-white transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-lg"
                >
                  {t("nav.pricing")}
                </a>
              </nav>

              {/* Language Selector & Auth Buttons */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="relative">
                  <select
                    value={currentLanguage}
                    onChange={(e) =>
                      setCurrentLanguage(e.target.value as Language)
                    }
                    className="appearance-none glass-dark border border-white/20 rounded-lg px-3 py-2 text-sm text-white hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
                  >
                    {Object.entries(languages).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                <button className="text-slate-300 hover:text-white transition-all duration-300 hover:bg-white/10 px-4 py-2 rounded-lg">
                  {t("nav.login")}
                </button>
                <button className="bg-gradient-primary text-white px-6 py-2.5 rounded-lg hover:shadow-glow transition-all duration-300 font-semibold">
                  {t("nav.signup")}
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
              <div className="md:hidden py-6 border-t border-white/10 glass-dark">
                <div className="flex flex-col space-y-4">
                  <a
                    href="#"
                    className="text-slate-300 hover:text-white transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-lg"
                  >
                    {t("nav.home")}
                  </a>
                  <a
                    href="#"
                    className="text-slate-300 hover:text-white transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-lg"
                  >
                    {t("nav.features")}
                  </a>
                  <a
                    href="#"
                    className="text-slate-300 hover:text-white transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-lg"
                  >
                    {t("nav.pricing")}
                  </a>
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex space-x-3">
                      <button className="text-slate-300 hover:text-white transition-all duration-300">
                        {t("nav.login")}
                      </button>
                      <button className="bg-gradient-primary text-white px-4 py-2 rounded-lg hover:shadow-glow transition-all duration-300">
                        {t("nav.signup")}
                      </button>
                    </div>
                    <select
                      value={currentLanguage}
                      onChange={(e) =>
                        setCurrentLanguage(e.target.value as Language)
                      }
                      className="appearance-none glass-dark border border-white/20 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {Object.entries(languages).map(([code, name]) => (
                        <option key={code} value={code}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Upload State */}
          {currentStep === "upload" && (
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-16">
                <h2 className="text-5xl md:text-7xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-8 font-display animate-gradient bg-[length:200%_200%]">
                  {t("heroTitle")}
                </h2>
                <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                  {t("heroSubtitle")}
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  <span className="px-4 py-2 glass-dark rounded-full text-sm font-medium text-white border border-white/20">
                    ✨ {t("nav.features")}
                  </span>
                  <span className="px-4 py-2 glass-dark rounded-full text-sm font-medium text-white border border-white/20">
                    🎨 AI {t("brandSubtitle")}
                  </span>
                  <span className="px-4 py-2 glass-dark rounded-full text-sm font-medium text-white border border-white/20">
                    🚀 {t("buttons.freeTrial")}
                  </span>
                </div>
              </div>

              <div
                className={`glass-dark border-2 border-dashed rounded-3xl p-16 mb-12 transition-all duration-500 group relative overflow-hidden ${
                  isUploading
                    ? "border-blue-400 bg-blue-500/20 cursor-wait"
                    : isDragging
                    ? "border-purple-400 bg-purple-500/20 shadow-glow cursor-pointer"
                    : "border-white/30 hover:border-purple-400 hover:bg-white/5 hover:shadow-glow-sm cursor-pointer"
                }`}
                onDragOver={isUploading ? undefined : handleDragOver}
                onDragLeave={isUploading ? undefined : handleDragLeave}
                onDrop={isUploading ? undefined : handleDrop}
                onClick={
                  isUploading ? undefined : () => fileInputRef.current?.click()
                }
              >
                <div className="absolute inset-0 bg-gradient-primary opacity-5 group-hover:opacity-10 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  {isUploading ? (
                    <>
                      <div className="text-8xl mb-6 animate-pulse">⏳</div>
                      <h3 className="text-2xl font-bold text-white mb-4 font-display">
                        Uploading to R2...
                      </h3>
                      <p className="text-slate-300 text-lg">
                        Please wait while we save your image
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-8xl mb-6 animate-float">📸</div>
                      <h3 className="text-2xl font-bold text-white mb-4 font-display">
                        {t("uploadArea")}
                      </h3>
                      <p className="text-slate-300 text-lg">
                        {t("uploadSupport")}
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>

              {/* Upload Error Display */}
              {uploadError && (
                <div className="bg-red-500/20 border border-red-400 rounded-2xl p-6 mb-8 text-center">
                  <h3 className="text-red-400 font-bold text-lg mb-2">
                    ❌ Upload Failed
                  </h3>
                  <p className="text-red-300">{uploadError}</p>
                  <button
                    onClick={() => setUploadError(null)}
                    className="mt-4 text-red-400 hover:text-red-300 underline font-semibold"
                  >
                    Try Again
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button className="bg-gradient-primary text-white px-10 py-4 rounded-2xl font-bold text-lg hover:shadow-glow transition-all duration-300 transform hover:scale-105 group">
                  <span className="flex items-center justify-center gap-3">
                    <span>{t("buttons.freeTrial")}</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      ✨
                    </span>
                  </span>
                </button>
                <button className="glass-dark border border-white/30 text-white px-10 py-4 rounded-2xl font-semibold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300">
                  {t("buttons.viewExamples")}
                </button>
              </div>
            </div>
          )}

          {/* Style Selection State */}
          {currentStep === "styleSelect" && (
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-16">
                {/* Left: Uploaded Image */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center font-display">
                      {t("uploadedImage")}
                    </h3>
                    {uploadedImageUrl && (
                      <div className="rounded-3xl overflow-hidden glass-dark border border-white/20 shadow-card group">
                        <img
                          src={uploadedImageUrl}
                          alt={t("uploadedImage")}
                          className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-white mb-4 flex items-center">
                      {t("customPrompt")}
                    </label>
                    <textarea
                      className="w-full p-6 glass-dark border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 resize-none text-white placeholder-slate-400 bg-transparent"
                      rows={4}
                      placeholder={t("customPromptPlaceholder")}
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                    />
                  </div>
                </div>

                {/* Right: Style Selection */}
                <div className="space-y-8">
                  <h3 className="text-2xl font-bold text-white flex items-center font-display">
                    {t("selectStyle")}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {styleOptions.map((style) => (
                      <div
                        key={style.id}
                        className={`style-card p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 group relative overflow-hidden ${
                          selectedStyle === style.id
                            ? "border-purple-400 bg-purple-500/20 shadow-glow ring-2 ring-purple-400 ring-offset-2 ring-offset-dark-800"
                            : "glass-dark border-white/20 hover:border-white/40 hover:bg-white/5"
                        }`}
                        onClick={() => handleStyleSelect(style.id)}
                      >
                        <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                            {style.emoji}
                          </div>
                          <h4 className="font-bold text-white mb-2 text-lg">
                            {style.name}
                          </h4>
                          <p className="text-sm text-slate-300">
                            {style.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className={`w-full py-5 rounded-2xl font-bold text-xl transition-all duration-300 relative overflow-hidden group ${
                      selectedStyle
                        ? "bg-gradient-primary text-white hover:shadow-glow transform hover:scale-105"
                        : "glass-dark border border-white/20 text-slate-400 cursor-not-allowed"
                    }`}
                    onClick={handleGenerate}
                    disabled={!selectedStyle}
                  >
                    <span className="flex items-center justify-center gap-3">
                      <span>{t("buttons.generate")}</span>
                      {selectedStyle && (
                        <span className="group-hover:translate-x-1 transition-transform duration-300">
                          🚀
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generating State */}
          {currentStep === "generating" && (
            <div className="max-w-3xl mx-auto text-center">
              <div className="mb-12">
                <h2 className="text-4xl font-bold text-white mb-8 font-display">
                  {t("generating")}
                  <span className="loading-dots ml-3">
                    <span className="animate-pulse">.</span>
                    <span
                      className="animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    >
                      .
                    </span>
                    <span
                      className="animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    >
                      .
                    </span>
                  </span>
                </h2>

                <div className="glass-dark rounded-3xl p-10 border border-white/20 shadow-card">
                  <div className="relative mb-8">
                    <div className="w-full bg-white/10 rounded-full h-6 overflow-hidden">
                      <div
                        className="progress-bar bg-gradient-primary h-6 rounded-full transition-all duration-500 shadow-glow-sm"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                    <div className="mt-4 text-xl font-bold text-white">
                      {Math.round(generationProgress)}%
                    </div>
                  </div>

                  <p className="text-slate-300 mb-8 text-lg">
                    {t("estimatedTime", { time: remainingTime })}
                  </p>

                  <button
                    className="px-8 py-3 glass-dark border border-white/30 text-white rounded-xl hover:bg-white/10 hover:border-white/50 transition-all duration-300 font-semibold"
                    onClick={handleReset}
                  >
                    {t("buttons.cancel")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Result State */}
          {currentStep === "result" && (
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-6 font-display">
                  {t("generationComplete")}
                </h2>
                <p className="text-xl text-slate-300">Your artwork is ready!</p>
              </div>

              <div className="grid lg:grid-cols-3 gap-12 items-center mb-12">
                {/* Original Image */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-white text-center font-display">
                    {t("originalImage")}
                  </h3>
                  {uploadedImageUrl && (
                    <div className="rounded-3xl overflow-hidden glass-dark border border-white/20 shadow-card group">
                      <img
                        src={uploadedImageUrl}
                        alt={t("originalImage")}
                        className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="text-center">
                  <div className="text-6xl bg-gradient-primary bg-clip-text text-transparent animate-pulse">
                    →
                  </div>
                </div>

                {/* Result Image */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-white text-center font-display">
                    {t("generatedResult")}
                  </h3>
                  {resultImageUrl && (
                    <div className="rounded-3xl overflow-hidden glass-dark border border-purple-400/50 shadow-glow group">
                      <img
                        src={resultImageUrl}
                        alt={t("generatedResult")}
                        className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-6 mb-12">
                <button className="flex items-center gap-3 bg-gradient-primary text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-glow transition-all duration-300 transform hover:scale-105 group">
                  <span>{t("buttons.download")}</span>
                  <span className="group-hover:translate-y-[-2px] transition-transform duration-300">
                    💾
                  </span>
                </button>
                <button
                  className="flex items-center gap-3 glass-dark border border-white/30 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300"
                  onClick={() => {
                    setCurrentStep("styleSelect");
                    setGenerationProgress(0);
                    setResultImageUrl(null);
                  }}
                >
                  <span>{t("buttons.regenerate")}</span>
                  <span>🔄</span>
                </button>
                <button className="flex items-center gap-3 glass-dark border border-white/30 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300">
                  <span>{t("buttons.share")}</span>
                  <span>📤</span>
                </button>
              </div>

              {/* Usage Status */}
              <div className="glass-dark rounded-3xl p-8 border border-white/20 text-center shadow-card">
                <p className="text-slate-300 mb-6 text-lg">
                  {t("dailyUsage", { remaining: 5 - dailyUsage, total: 5 })}
                </p>
                <button className="bg-gradient-warm text-white px-8 py-3 rounded-xl font-bold hover:shadow-glow transition-all duration-300 transform hover:scale-105">
                  {t("upgradePrompt")}
                </button>
              </div>

              <div className="text-center mt-10">
                <button
                  className="text-purple-400 hover:text-purple-300 font-semibold text-lg transition-colors duration-300 hover:underline"
                  onClick={handleReset}
                >
                  {t("buttons.restart")}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
