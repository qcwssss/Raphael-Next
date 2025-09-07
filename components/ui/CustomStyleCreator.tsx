import { useState } from "react";
import { styleManager, CustomStyle } from "../../utils/styleManager";

// Utility function to sanitize user input
function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

interface CustomStyleCreatorProps {
  onStyleCreated: (style: CustomStyle) => void;
  onCancel: () => void;
  t: (key: string) => string;
}

export default function CustomStyleCreator({
  onStyleCreated,
  onCancel,
  t,
}: CustomStyleCreatorProps) {
  const [formData, setFormData] = useState({
    name: "",
    emoji: "✨",
    description: "",
    prompt: ""
  });
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const config = styleManager.getCustomStyleConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!formData.name.trim() || !formData.prompt.trim()) {
      setErrorMessage("Name and prompt are required");
      return;
    }

    if (formData.prompt.length > config.maxPromptLength) {
      setErrorMessage(`Prompt must be less than ${config.maxPromptLength} characters`);
      return;
    }

    setIsCreating(true);
    
    try {
      // Sanitize all inputs to prevent XSS
      const newStyle = styleManager.addCustomStyle({
        name: sanitizeInput(formData.name.trim()),
        emoji: formData.emoji || config.defaultEmoji,
        description: sanitizeInput(formData.description.trim()),
        prompt: sanitizeInput(formData.prompt.trim())
      });

      onStyleCreated(newStyle);
      
      // Reset form
      setFormData({
        name: "",
        emoji: "✨", 
        description: "",
        prompt: ""
      });
    } catch (error) {
      console.error("Failed to create custom style:", error);
      setErrorMessage("Failed to create style. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const commonEmojis = ["✨", "🎨", "🌟", "🎪", "🔮", "🌈", "🎭", "🖼️", "🎬", "📸"];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-dark border border-white/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold text-white mb-8 font-display text-center">
          Create Custom Style
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4 text-red-200">
              {errorMessage}
            </div>
          )}
          {/* Name Field */}
          <div>
            <label className="block text-lg font-semibold text-white mb-3">
              Style Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., Vintage Comic Book"
              className="w-full p-4 glass-dark border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-white placeholder-slate-400 bg-transparent"
              maxLength={50}
              required
            />
            <div className="text-xs text-slate-400 mt-1">
              {formData.name.length}/50 characters
            </div>
          </div>

          {/* Emoji Selector */}
          <div>
            <label className="block text-lg font-semibold text-white mb-3">
              Emoji
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              {commonEmojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleChange("emoji", emoji)}
                  className={`text-2xl p-2 rounded-lg border-2 transition-all duration-200 ${
                    formData.emoji === emoji
                      ? "border-purple-400 bg-purple-500/20"
                      : "border-white/20 hover:border-white/40"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={formData.emoji}
              onChange={(e) => handleChange("emoji", e.target.value)}
              placeholder="Or enter custom emoji"
              className="w-full p-3 glass-dark border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-white placeholder-slate-400 bg-transparent"
              maxLength={2}
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-lg font-semibold text-white mb-3">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Brief description of the style"
              className="w-full p-4 glass-dark border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-white placeholder-slate-400 bg-transparent"
              maxLength={100}
            />
            <div className="text-xs text-slate-400 mt-1">
              {formData.description.length}/100 characters
            </div>
          </div>

          {/* Prompt Field */}
          <div>
            <label className="block text-lg font-semibold text-white mb-3">
              AI Prompt *
            </label>
            <textarea
              value={formData.prompt}
              onChange={(e) => handleChange("prompt", e.target.value)}
              placeholder="Describe the artistic style in detail (e.g., 'vintage comic book style, bold outlines, halftone dots, retro colors')"
              className="w-full p-4 glass-dark border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 resize-none text-white placeholder-slate-400 bg-transparent"
              rows={4}
              maxLength={config.maxPromptLength}
              required
            />
            <div className="text-xs text-slate-400 mt-1">
              {formData.prompt.length}/{config.maxPromptLength} characters
            </div>
            <div className="text-xs text-slate-500 mt-2">
              💡 Tip: Be specific and descriptive. Good prompts include artistic techniques, color palettes, and visual elements.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-4 glass-dark border border-white/30 text-white rounded-2xl font-semibold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !formData.name.trim() || !formData.prompt.trim()}
              className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                isCreating || !formData.name.trim() || !formData.prompt.trim()
                  ? "glass-dark border border-white/20 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-primary text-white hover:shadow-glow transform hover:scale-105"
              }`}
            >
              {isCreating ? "Creating..." : "Create Style"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}