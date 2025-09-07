interface GenerationResult {
  id: string;
  imageUrl?: string;
  status: 'generating' | 'completed' | 'error';
  progress: number;
  estimatedTime?: number;
}

interface GenerationGridProps {
  results: GenerationResult[];
  isGenerating: boolean;
  generationProgress: number;
  t: (key: string) => string;
}

export default function GenerationGrid({ 
  results, 
  isGenerating, 
  generationProgress, 
  t 
}: GenerationGridProps) {
  // Create 1 slot for single image display
  const slots = Array.from({ length: 1 }, (_, index) => {
    const result = results[index];
    return {
      id: index,
      result,
      isEmpty: !result,
      isGenerating: isGenerating && index < 1,
    };
  });

  const handleDownload = (imageUrl: string, index: number) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `generated-image-${index + 1}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Grid Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Generation Results</h3>
        <p className="text-slate-400">AI-generated images based on your prompt</p>
      </div>

      {/* Single Image Display */}
      <div className="flex justify-center">
        {slots.map(({ id, result, isEmpty, isGenerating: slotGenerating }) => (
          <div key={id} className="relative w-full max-w-lg">
            <div className="aspect-square glass-dark border border-white/20 rounded-2xl overflow-hidden group w-full">
              {result && result.imageUrl ? (
                // Completed image
                <div className="relative w-full h-full">
                  <img
                    src={result.imageUrl}
                    alt={`Generated image ${id + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDownload(result.imageUrl!, id)}
                        className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                      >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z" />
                        </svg>
                      </button>
                      <button className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ) : slotGenerating ? (
                // Generating state
                <div className="w-full h-full flex flex-col items-center justify-center p-8">
                  <div className="w-16 h-16 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin mb-6"></div>
                  <div className="text-center">
                    <p className="text-white font-semibold mb-2">Generating...</p>
                    <p className="text-slate-400 text-sm">Estimated time: 20s</p>
                    <div className="w-full bg-white/10 rounded-full h-2 mt-4">
                      <div 
                        className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${generationProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{generationProgress}% complete</p>
                  </div>
                </div>
              ) : (
                // Empty state with upgrade prompt
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 border-2 border-dashed border-white/30 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-white font-semibold mb-2">Estimated time: 20s</p>
                  <button className="bg-gradient-primary hover:shadow-glow transform hover:scale-105 transition-all duration-300 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    Generate 5x faster
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Generation Summary */}
      {(results.length > 0 || isGenerating) && (
        <div className="mt-8 text-center">
          <div className="glass-dark border border-white/20 rounded-2xl p-6 inline-block">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-300">
                  Completed: {results.filter(r => r.status === 'completed').length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-slate-300">
                  Generating: {results.filter(r => r.status === 'generating').length}
                </span>
              </div>
              {results.length === 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
                  <span className="text-slate-300">
                    Ready to generate
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}