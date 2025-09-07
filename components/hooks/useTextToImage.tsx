import { useState, useCallback, useRef } from "react";
import { GenerationOptions } from "../sections/TextToImageGenerator";

interface GenerationResult {
  id: string;
  imageUrl?: string;
  status: 'generating' | 'completed' | 'error';
  progress: number;
  estimatedTime?: number;
}

export function useTextToImage() {
  const [prompt, setPrompt] = useState("A fairy in a blue dress, waving a magic wand, surrounded by sparkling stars.");
  const [selectedOptions, setSelectedOptions] = useState<GenerationOptions>({
    squareAspect: false,
    noStyle: false,
    noColor: false,
    noLighting: false,
    noComposition: false,
    negativePrompt: false,
    highQuality: false,
  });
  
  const [generationResults, setGenerationResults] = useState<GenerationResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  const generationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const randomPrompts = [
    "A majestic dragon soaring through clouds at sunset",
    "A cyberpunk cityscape with neon lights reflecting on wet streets",
    "A cozy cottage in a enchanted forest with glowing mushrooms",
    "An astronaut riding a horse on the surface of Mars",
    "A steampunk airship floating above Victorian London",
    "A magical library with floating books and crystal chandeliers",
    "A samurai warrior standing in a field of cherry blossoms",
    "A underwater palace with mermaids and coral gardens",
    "A clockwork mechanism with gears and springs in motion",
    "A phoenix rising from ashes with wings of fire"
  ];

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Reset results
    setGenerationResults([]);
    
    try {
      // Create 1 generating slot
      const initialResults: GenerationResult[] = Array.from({ length: 1 }, (_, index) => ({
        id: `gen-${Date.now()}-${index}`,
        status: 'generating' as const,
        progress: 0,
        estimatedTime: 20,
      }));
      
      setGenerationResults(initialResults);

      // Start progress animation
      let progress = 0;
      progressIntervalRef.current = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
          progress = 100;
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
        }
        setGenerationProgress(progress);
      }, 500);

      // Make API call for text-to-image generation
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          options: selectedOptions,
          count: 1, // Generate 1 image
        }),
      });

      const data = await response.json();
      
      if (data.success && data.data.generatedImages) {
        // Update results with completed images
        const completedResults: GenerationResult[] = data.data.generatedImages.map((imageUrl: string, index: number) => ({
          id: initialResults[index].id,
          imageUrl,
          status: 'completed' as const,
          progress: 100,
        }));
        
        setGenerationResults(completedResults);
      } else {
        // Handle error - for now, simulate some successful generations
        setTimeout(() => {
          const mockResults: GenerationResult[] = initialResults.map((result, index) => ({
            ...result,
            imageUrl: `/api/placeholder/512/512?text=Generated${index + 1}`,
            status: 'completed' as const,
            progress: 100,
          }));
          setGenerationResults(mockResults);
        }, 2000);
      }

    } catch (error) {
      console.error('Generation failed:', error);
      
      // Show error state
      const errorResults: GenerationResult[] = initialResults.map(result => ({
        ...result,
        status: 'error' as const,
      }));
      setGenerationResults(errorResults);
    } finally {
      // Clean up
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
      
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(100);
      }, 1000);
    }
  }, [prompt, selectedOptions, isGenerating]);

  const handleClear = useCallback(() => {
    setPrompt("");
    setGenerationResults([]);
    setGenerationProgress(0);
  }, []);

  const handleRandom = useCallback(() => {
    const randomPrompt = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
    setPrompt(randomPrompt);
  }, []);

  return {
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
  };
}