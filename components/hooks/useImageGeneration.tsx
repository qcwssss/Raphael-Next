import { useState } from "react";
import { styleManager } from "../../utils/styleManager";

export type Step = "upload" | "styleSelect" | "generating" | "result";

export function useImageGeneration() {
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [dailyUsage, setDailyUsage] = useState<number>(2);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationProvider, setGenerationProvider] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("File size too large");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
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
        setUploadedFile(file);
        setSessionId(data.data.sessionId);
        setUploadedImageUrl(data.data.fileUrl);
        setCurrentStep("styleSelect");

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
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setUploadError(errorMessage);
      alert(`Upload error: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
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
      setGenerationProgress(10);

      // Check if it's a custom style and get the custom prompt
      const isCustomStyle = selectedStyle.startsWith('custom-');
      let customStylePrompt = undefined;
      
      if (isCustomStyle) {
        const customStyle = styleManager.getCustomStyles().find(s => s.id === selectedStyle);
        customStylePrompt = customStyle?.prompt;
        console.log(`🎨 Using custom style prompt: ${customStylePrompt?.substring(0, 100)}...`);
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          style: selectedStyle,
          customPrompt: customPrompt || undefined,
          customStylePrompt: customStylePrompt,
        }),
      });

      const data = await response.json();
      setGenerationProgress(70);

      if (data.success) {
        console.log("✅ AI generation successful:", data.data);
        setGenerationProgress(100);
        setResultImageUrl(data.data.generatedImageUrl);
        setGenerationProvider(data.data.provider);
        setCurrentStep("result");
        setDailyUsage((prev) => prev + 1);
        console.log(`🎉 Generation completed with ${data.data.provider} in ${data.data.processingTimeMs}ms`);
      } else {
        console.error("❌ AI generation failed:", data.error);
        setGenerationError(data.error);
        setCurrentStep("styleSelect");
        setGenerationProgress(0);
      }
    } catch (error) {
      console.error("❌ Generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Generation failed";
      setGenerationError(errorMessage);
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

  const handleRegenerate = () => {
    setCurrentStep("styleSelect");
    setGenerationProgress(0);
    setResultImageUrl(null);
  };

  return {
    // State
    currentStep,
    uploadedFile,
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
    sessionId,
    isUploading,
    uploadError,
    setUploadError,
    isGenerating,
    generationError,
    generationProvider,
    
    // Actions
    handleFileUpload,
    handleGenerate,
    handleReset,
    handleRegenerate,
  };
}