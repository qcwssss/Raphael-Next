import { useState } from "react";
import Head from "next/head";
import { Language, useTranslation } from "../lib/translations";
import { useImageGeneration } from "../components/hooks/useImageGeneration";
import Header from "../components/sections/Header";
import UploadSection from "../components/sections/UploadSection";
import StyleSelection from "../components/sections/StyleSelection";
import GeneratingSection from "../components/sections/GeneratingSection";
import ResultSection from "../components/sections/ResultSection";

export default function Home() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>("zh");
  const { t } = useTranslation(currentLanguage);
  
  const {
    currentStep,
    uploadedImageUrl,
    selectedStyle,
    setSelectedStyle,
    customPrompt,
    setCustomPrompt,
    generationProgress,
    resultImageUrl,
    dailyUsage,
    isDragging,
    setIsDragging,
    isUploading,
    uploadError,
    setUploadError,
    handleFileUpload,
    handleGenerate,
    handleReset,
    handleRegenerate,
  } = useImageGeneration();

  const remainingTime = Math.max(0, Math.ceil((100 - generationProgress) * 0.3));

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
        <Header
          currentLanguage={currentLanguage}
          setCurrentLanguage={setCurrentLanguage}
          t={t}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {currentStep === "upload" && (
            <UploadSection
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              isUploading={isUploading}
              uploadError={uploadError}
              setUploadError={setUploadError}
              handleFileUpload={handleFileUpload}
              t={t}
            />
          )}

          {currentStep === "styleSelect" && (
            <StyleSelection
              uploadedImageUrl={uploadedImageUrl}
              selectedStyle={selectedStyle}
              setSelectedStyle={setSelectedStyle}
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
              onGenerate={handleGenerate}
              t={t}
            />
          )}

          {currentStep === "generating" && (
            <GeneratingSection
              generationProgress={generationProgress}
              remainingTime={remainingTime}
              onCancel={handleReset}
              t={t}
            />
          )}

          {currentStep === "result" && (
            <ResultSection
              uploadedImageUrl={uploadedImageUrl}
              resultImageUrl={resultImageUrl}
              dailyUsage={dailyUsage}
              t={t}
              onRegenerate={handleRegenerate}
              onRestart={handleReset}
            />
          )}
        </main>
      </div>
    </>
  );
}