import { useState } from "react";

export interface GenerationOptions {
  squareAspect: boolean;
  noStyle: boolean;
  noColor: boolean;
  noLighting: boolean;
  noComposition: boolean;
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
      {/* Clean Main Container */}
      <div className="bg-gray-800 rounded-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-semibold text-white">AI Image Generator</h2>
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Clean Description Prompt */}
        <div className="mb-8">
          <label className="block text-lg font-medium text-gray-300 mb-4">
            Description prompt
          </label>
          <textarea
            value={prompt}
            onChange={handlePromptChange}
            placeholder="What do you want to see?"
            className="w-full h-32 p-4 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 resize-none text-base leading-relaxed"
            disabled={isGenerating}
          />
        </div>

        {/* Clean Options Row 1 */}
        <div className="flex flex-wrap items-center gap-6 mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={selectedOptions.squareAspect}
              onChange={() => handleOptionToggle('squareAspect')}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-500 rounded focus:ring-blue-500 focus:ring-2"
              disabled={isGenerating}
            />
            <span className="ml-2 text-gray-300 font-medium">Square Aspect</span>
          </label>

          <button
            onClick={() => handleOptionToggle('noStyle')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedOptions.noStyle
                ? 'bg-gray-600 text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            disabled={isGenerating}
          >
            No Style
          </button>

          <button
            onClick={() => handleOptionToggle('noColor')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedOptions.noColor
                ? 'bg-gray-600 text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            disabled={isGenerating}
          >
            No Color
          </button>

          <button
            onClick={() => handleOptionToggle('noLighting')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedOptions.noLighting
                ? 'bg-gray-600 text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            disabled={isGenerating}
          >
            No Lighting
          </button>

          <button
            onClick={() => handleOptionToggle('noComposition')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedOptions.noComposition
                ? 'bg-gray-600 text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            disabled={isGenerating}
          >
            No Composition
          </button>
        </div>

        {/* Clean Options Row 2 */}
        <div className="flex items-center gap-8 mb-8">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              checked={selectedOptions.negativePrompt}
              onChange={() => handleOptionToggle('negativePrompt')}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-500 focus:ring-blue-500 focus:ring-2"
              disabled={isGenerating}
            />
            <span className="ml-2 text-gray-300 font-medium">Negative Prompt</span>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              checked={selectedOptions.highQuality}
              onChange={() => handleOptionToggle('highQuality')}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-500 focus:ring-blue-500 focus:ring-2"
              disabled={isGenerating}
            />
            <span className="ml-2 text-gray-300 font-medium">High Quality</span>
          </label>
        </div>

        {/* Clean Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onClear}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            disabled={isGenerating}
          >
            Clear
          </button>
          <button
            onClick={onRandom}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            disabled={isGenerating}
          >
            Random
          </button>
          <button
            onClick={onGenerate}
            disabled={isGenerating || !prompt.trim()}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              isGenerating || !prompt.trim()
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-primary hover:shadow-glow transform hover:scale-105 text-white'
            }`}
          >
            {isGenerating ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Generating...
              </div>
            ) : (
              'Generate'
            )}
          </button>
        </div>
      </div>

      {/* Generation Info */}
      {prompt && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            Generate: {prompt.substring(0, 100)}{prompt.length > 100 ? '...' : ''}
          </p>
          <p className="text-xs text-gray-500 mt-1">
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