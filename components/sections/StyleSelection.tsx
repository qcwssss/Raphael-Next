import { useState, useEffect, useMemo } from "react";
import { styleManager, StyleOption, CustomStyle } from "../../utils/styleManager";
import CustomStyleCreator from "../ui/CustomStyleCreator";

interface StyleSelectionProps {
  uploadedImageUrl: string | null;
  selectedStyle: string | null;
  setSelectedStyle: (style: string) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  onGenerate: () => void;
  t: (key: string) => string;
}

export default function StyleSelection({
  uploadedImageUrl,
  selectedStyle,
  setSelectedStyle,
  customPrompt,
  setCustomPrompt,
  onGenerate,
  t,
}: StyleSelectionProps) {
  const [styleOptions, setStyleOptions] = useState<StyleOption[]>([]);
  const [showCustomCreator, setShowCustomCreator] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  useEffect(() => {
    // Load custom styles from localStorage and get all styles
    styleManager.loadCustomStyles();
    setStyleOptions(styleManager.getAllStyles(t));
    
    // Cleanup function to prevent memory leaks
    return () => {
      // Any cleanup logic if needed
    };
  }, [t]);

  const categories = styleManager.getCategories();
  const isCustomEnabled = styleManager.isCustomStyleEnabled();

  const handleStyleCreated = (newStyle: CustomStyle) => {
    setStyleOptions(styleManager.getAllStyles(t));
    setShowCustomCreator(false);
    setSelectedStyle(newStyle.id);
  };

  const handleDeleteCustomStyle = (styleId: string) => {
    if (styleId.startsWith('custom-')) {
      // Use a more user-friendly confirmation
      const customStyle = styleOptions.find(s => s.id === styleId);
      const confirmDelete = window.confirm(`Are you sure you want to delete "${customStyle?.name || 'this style'}"? This action cannot be undone.`);
      
      if (confirmDelete) {
        styleManager.removeCustomStyle(styleId);
        setStyleOptions(styleManager.getAllStyles(t));
        if (selectedStyle === styleId) {
          setSelectedStyle(null);
        }
      }
    }
  };

  // Use useMemo to optimize filtering and prevent unnecessary re-renders
  const filteredStyles = useMemo(() => {
    return selectedCategory === "all" 
      ? styleOptions
      : styleOptions.filter(style => style.category === selectedCategory);
  }, [styleOptions, selectedCategory]);

  return (
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
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white font-display">
              {t("selectStyle")}
            </h3>
            {isCustomEnabled && (
              <button
                onClick={() => setShowCustomCreator(true)}
                className="flex items-center gap-2 bg-gradient-secondary text-white px-4 py-2 rounded-xl font-semibold hover:shadow-glow transition-all duration-300"
              >
                <span>✨</span>
                <span>Create Custom</span>
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === "all"
                  ? "bg-purple-500 text-white"
                  : "glass-dark border border-white/20 text-slate-300 hover:border-white/40"
              }`}
            >
              All Styles
            </button>
            {Object.entries(categories).map(([key, name]) => {
              const count = styleOptions.filter(s => s.category === key).length;
              if (count === 0) return null;
              
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === key
                      ? "bg-purple-500 text-white"
                      : "glass-dark border border-white/20 text-slate-300 hover:border-white/40"
                  }`}
                >
                  {name} ({count})
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredStyles.map((style) => (
              <div
                key={style.id}
                className={`style-card p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 group relative overflow-hidden ${
                  selectedStyle === style.id
                    ? "border-purple-400 bg-purple-500/20 shadow-glow ring-2 ring-purple-400 ring-offset-2 ring-offset-dark-800"
                    : "glass-dark border-white/20 hover:border-white/40 hover:bg-white/5"
                }`}
                onClick={() => setSelectedStyle(style.id)}
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
                  
                  {/* Delete button for custom styles */}
                  {style.id.startsWith('custom-') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomStyle(style.id);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-full flex items-center justify-center text-xs transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  )}
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
            onClick={onGenerate}
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

      {/* Custom Style Creator Modal */}
      {showCustomCreator && (
        <CustomStyleCreator
          onStyleCreated={handleStyleCreated}
          onCancel={() => setShowCustomCreator(false)}
          t={t}
        />
      )}
    </div>
  );
}