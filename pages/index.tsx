import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Language, useTranslation } from "../lib/translations";
import { useTextToImage } from "../components/hooks/useTextToImage";
import Header from "../components/sections/Header";
import HeroSection from "../components/sections/HeroSection";
import TextToImageGenerator from "../components/sections/TextToImageGenerator";
import GenerationGrid from "../components/ui/GenerationGrid";

export default function Home() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>("zh");
  const { t } = useTranslation(currentLanguage);

  const {
    prompt,
    setPrompt,
    selectedOptions,
    setSelectedOptions,
    generationResults,
    isGenerating,
    generationProgress,
    handleGenerate,
    handleClear,
    handleRandom,
  } = useTextToImage();

  return (
    <>
      <Head>
        <title>{t("brandName")} - AI Image Generator</title>
        <meta
          name="description"
          content="Create stunning AI-generated images in seconds. World's First Unlimited Free AI Image Generator."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 text-white">
        <Header
          currentLanguage={currentLanguage}
          setCurrentLanguage={setCurrentLanguage}
          t={t}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <HeroSection t={t} />

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-12">
            <div className="glass-dark border border-white/20 rounded-2xl p-2 inline-flex">
              <div className="bg-gradient-primary text-white px-6 py-3 rounded-xl font-semibold">
                AI Image Generator
              </div>
              <Link href="/transform">
                <div className="text-slate-400 px-6 py-3 rounded-xl font-semibold hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer">
                  Image Transform
                </div>
              </Link>
            </div>
          </div>

          {/* Text-to-Image Generator */}
          <TextToImageGenerator
            prompt={prompt}
            setPrompt={setPrompt}
            selectedOptions={selectedOptions}
            setSelectedOptions={setSelectedOptions}
            onGenerate={handleGenerate}
            onClear={handleClear}
            onRandom={handleRandom}
            isGenerating={isGenerating}
            t={t}
          />

          {/* Generation Results */}
          {(generationResults.length > 0 || isGenerating) && (
            <div className="mt-12">
              <GenerationGrid
                results={generationResults}
                isGenerating={isGenerating}
                generationProgress={generationProgress}
                t={t}
              />
            </div>
          )}
        </main>

        {/* Free Plan Notice - Only show after generation */}
        {generationResults.length > 0 && (
          <div className="fixed bottom-6 left-6 right-6 mx-auto max-w-4xl">
            <div className="glass-dark border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">⭐</div>
                <div>
                  <div className="text-amber-400 font-semibold">
                    You are using the Free Plan
                  </div>
                  <div className="text-sm text-slate-300">
                    Upgrade to Premium for 5x faster speed, better quality &
                    ad-free experience
                  </div>
                </div>
              </div>
              <button className="bg-gradient-primary hover:shadow-glow transform hover:scale-105 transition-all duration-300 text-white font-bold py-3 px-6 rounded-xl">
                ⚡ Upgrade to Premium
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
