import { useState, useReducer } from "react";
import { styleManager } from "../../utils/styleManager";
import { AI_CONFIG, ERROR_MESSAGES } from "../../lib/config/constants";

// Reducer for generation state management to prevent race conditions
type GenerationState = {
  isGenerating: boolean;
  progress: number;
  error: string | null;
  provider: string | null;
  currentStep: Step;
  resultImageUrl: string | null;
};

type GenerationAction = 
  | { type: 'START_GENERATION' }
  | { type: 'UPDATE_PROGRESS'; progress: number }
  | { type: 'GENERATION_SUCCESS'; resultImageUrl: string; provider: string }
  | { type: 'GENERATION_ERROR'; error: string }
  | { type: 'RESET_GENERATION' }
  | { type: 'SET_STEP'; step: Step };

function generationReducer(state: GenerationState, action: GenerationAction): GenerationState {
  switch (action.type) {
    case 'START_GENERATION':
      return {
        ...state,
        isGenerating: true,
        progress: 0,
        error: null,
        provider: null,
        currentStep: 'generating',
      };
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progress: action.progress,
      };
    case 'GENERATION_SUCCESS':
      return {
        ...state,
        isGenerating: false,
        progress: 100,
        error: null,
        provider: action.provider,
        currentStep: 'result',
        resultImageUrl: action.resultImageUrl,
      };
    case 'GENERATION_ERROR':
      return {
        ...state,
        isGenerating: false,
        progress: 0,
        error: action.error,
        currentStep: 'styleSelect',
      };
    case 'RESET_GENERATION':
      return {
        ...state,
        isGenerating: false,
        progress: 0,
        error: null,
        provider: null,
        currentStep: 'styleSelect',
        resultImageUrl: null,
      };
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.step,
      };
    default:
      return state;
  }
}

export type Step = "upload" | "styleSelect" | "generating" | "result";

export function useImageGeneration() {
  // Use reducer for generation state to prevent race conditions
  const [generationState, dispatchGeneration] = useReducer(generationReducer, {
    isGenerating: false,
    progress: 0,
    error: null,
    provider: null,
    currentStep: 'upload',
    resultImageUrl: null,
  });

  // Other state that doesn't need the reducer
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [dailyUsage, setDailyUsage] = useState<number>(2);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    if (file.size > AI_CONFIG.MAX_FILE_SIZE) {
      setUploadError(ERROR_MESSAGES.FILE_TOO_LARGE);
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
        dispatchGeneration({ type: 'SET_STEP', step: 'styleSelect' });

        if (data.data.usage) {
          setDailyUsage(data.data.usage.remaining_generations || 5);
        }
      } else {
        console.error("❌ Upload failed:", data.error);
        setUploadError(data.error || ERROR_MESSAGES.UPLOAD_FAILED);
      }
    } catch (error) {
      console.error("❌ Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UPLOAD_FAILED;
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedStyle || !sessionId) return;

    dispatchGeneration({ type: 'START_GENERATION' });

    try {
      console.log(`🎨 Starting AI generation for style: ${selectedStyle}`);
      dispatchGeneration({ type: 'UPDATE_PROGRESS', progress: 10 });

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
      dispatchGeneration({ type: 'UPDATE_PROGRESS', progress: 70 });

      if (data.success) {
        console.log("✅ AI generation successful:", data.data);
        dispatchGeneration({ 
          type: 'GENERATION_SUCCESS', 
          resultImageUrl: data.data.generatedImageUrl, 
          provider: data.data.provider 
        });
        setDailyUsage((prev) => prev + 1);
        console.log(`🎉 Generation completed with ${data.data.provider} in ${data.data.processingTimeMs}ms`);
      } else {
        console.error("❌ AI generation failed:", data.error);
        dispatchGeneration({ 
          type: 'GENERATION_ERROR', 
          error: data.error || ERROR_MESSAGES.GENERATION_FAILED 
        });
      }
    } catch (error) {
      console.error("❌ Generation error:", error);
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.GENERATION_FAILED;
      dispatchGeneration({ type: 'GENERATION_ERROR', error: errorMessage });
    }
  };

  const handleReset = () => {
    dispatchGeneration({ type: 'SET_STEP', step: 'upload' });
    setUploadedFile(null);
    setUploadedImageUrl(null);
    setSelectedStyle(null);
    setCustomPrompt("");
    setSessionId(null);
    setIsUploading(false);
    setUploadError(null);
  };

  const handleRegenerate = () => {
    dispatchGeneration({ type: 'RESET_GENERATION' });
  };

  return {
    // State from reducer
    currentStep: generationState.currentStep,
    generationProgress: generationState.progress,
    resultImageUrl: generationState.resultImageUrl,
    isGenerating: generationState.isGenerating,
    generationError: generationState.error,
    generationProvider: generationState.provider,
    
    // Other state
    uploadedFile,
    uploadedImageUrl,
    selectedStyle,
    setSelectedStyle,
    customPrompt,
    setCustomPrompt,
    dailyUsage,
    isDragging,
    setIsDragging,
    sessionId,
    isUploading,
    uploadError,
    setUploadError,
    
    // Actions
    handleFileUpload,
    handleGenerate,
    handleReset,
    handleRegenerate,
  };
}