import { useState } from "react";

export interface GenerationOptions {
  squareAspect: boolean;
  noStyle: boolean;
  noColor: boolean;
  noLighting: boolean;
  shotFromBelow: boolean;
  negativePrompt: boolean;
  highQuality: boolean;
}

interface TextToImageGeneratorProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  selectedOptions: GenerationOptions;
  setSelectedOptions: (options: GenerationOptions) => void;
  onGenerate: () => void;
  onClear: () => void;
  onRandom: () => void;
  isGenerating: boolean;
  t: (key: string) => string;
}

export default function TextToImageGenerator({
  prompt,
  setPrompt,
  selectedOptions,
  setSelectedOptions,
  onGenerate,
  onClear,
  onRandom,
  isGenerating,
  t,
}: TextToImageGeneratorProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleOptionToggle = (option: keyof GenerationOptions) => {
    setSelectedOptions({
      ...selectedOptions,
      [option]: !selectedOptions[option],
    });
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Main Generator Container - Make prompt the centerpiece */}
      <div className="glass-dark border border-white/20 rounded-3xl p-8">
        {/* Large, Prominent Description Prompt */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">AI Image Generator</h2>
            <p className="text-slate-400">Describe what you want to create</p>
          </div>
          
          <div className="relative">
            <textarea
              value={prompt}
              onChange={handlePromptChange}
              placeholder="A fairy in a blue dress, waving a magic wand, surrounded by sparkling stars."
              className="w-full h-40 p-6 glass-dark border-2 border-white/30 rounded-3xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 text-white placeholder-slate-400 bg-transparent resize-none text-xl leading-relaxed font-medium shadow-lg"
              disabled={isGenerating}
              style={{ fontSize: '18px', lineHeight: '1.6' }}
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <button className="p-2 glass-dark border border-white/20 rounded-lg hover:border-white/40 transition-colors">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="p-2 glass-dark border border-white/20 rounded-lg hover:border-white/40 transition-colors">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Compact Auxiliary Options */}
        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <button 
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
              onClick={() => setIsEditing(!isEditing)}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Advanced options
            </button>
          </div>
          
          {/* Collapsible Options */}
          <div className={`transition-all duration-300 overflow-hidden ${isEditing ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="flex flex-wrap justify-center gap-2 p-4 bg-black/20 rounded-xl border border-white/10">
              <button
                onClick={() => handleOptionToggle('squareAspect')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                  selectedOptions.squareAspect
                    ? 'bg-white/20 text-white border border-white/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className={`w-3 h-3 border rounded ${selectedOptions.squareAspect ? 'border-white bg-white' : 'border-slate-500'}`}>
                  {selectedOptions.squareAspect && (
                    <svg className="w-2 h-2 text-dark-900" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                Square
              </button>

              <button className="px-2 py-1 text-xs text-slate-500 hover:text-slate-300 rounded-lg transition-colors">
                No Style
              </button>

              <button className="px-2 py-1 text-xs text-slate-500 hover:text-slate-300 rounded-lg transition-colors">
                No Color
              </button>

              <button className="px-2 py-1 text-xs text-slate-500 hover:text-slate-300 rounded-lg transition-colors">
                No Lighting
              </button>

              <button className="px-2 py-1 text-xs text-slate-500 hover:text-slate-300 rounded-lg transition-colors">
                Shot From Below
              </button>

              <button className="px-2 py-1 text-xs text-slate-500 hover:text-slate-300 rounded-lg transition-colors">
                Negative Prompt
              </button>

              <button className="px-2 py-1 text-xs text-slate-500 hover:text-slate-300 rounded-lg transition-colors">
                High Quality
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onClear}
            className="flex-1 py-4 glass-dark border border-white/30 text-white rounded-2xl font-semibold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300"
            disabled={isGenerating}
          >
            Clear
          </button>
          <button
            onClick={onRandom}
            className="flex-1 py-4 glass-dark border border-white/30 text-white rounded-2xl font-semibold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300"
            disabled={isGenerating}
          >
            Random
          </button>
          <button
            onClick={onGenerate}
            disabled={isGenerating || !prompt.trim()}
            className={`flex-2 py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-300 ${
              isGenerating || !prompt.trim()
                ? 'glass-dark border border-white/20 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-primary text-white hover:shadow-glow transform hover:scale-105'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <span className="text-xl">⚡</span>
                  Generate
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Generation Info */}
      {prompt && (
        <div className="mt-4 text-center">
          <p className="text-sm text-slate-400">
            Generate: {prompt.substring(0, 100)}{prompt.length > 100 ? '...' : ''} (Shot From Below)
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {new Date().toLocaleString('en-US', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      )}
    </div>
  );
}