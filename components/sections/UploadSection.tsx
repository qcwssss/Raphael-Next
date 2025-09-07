import { useRef, useCallback } from "react";

interface UploadSectionProps {
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  isUploading: boolean;
  uploadError: string | null;
  setUploadError: (error: string | null) => void;
  handleFileUpload: (file: File) => void;
  t: (key: string) => string;
}

export default function UploadSection({
  isDragging,
  setIsDragging,
  isUploading,
  uploadError,
  setUploadError,
  handleFileUpload,
  t,
}: UploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, [setIsDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, [setIsDragging]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        handleFileUpload(file);
      }
    }
  }, [setIsDragging, handleFileUpload]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="mb-16">
        <h2 className="text-5xl md:text-7xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-8 font-display animate-gradient bg-[length:200%_200%]">
          {t("heroTitle")}
        </h2>
        <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          {t("heroSubtitle")}
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <span className="px-4 py-2 glass-dark rounded-full text-sm font-medium text-white border border-white/20">
            ✨ {t("nav.features")}
          </span>
          <span className="px-4 py-2 glass-dark rounded-full text-sm font-medium text-white border border-white/20">
            🎨 AI {t("brandSubtitle")}
          </span>
          <span className="px-4 py-2 glass-dark rounded-full text-sm font-medium text-white border border-white/20">
            🚀 {t("buttons.freeTrial")}
          </span>
        </div>
      </div>

      <div
        className={`glass-dark border-2 border-dashed rounded-3xl p-16 mb-12 transition-all duration-500 group relative overflow-hidden ${
          isUploading
            ? "border-blue-400 bg-blue-500/20 cursor-wait"
            : isDragging
            ? "border-purple-400 bg-purple-500/20 shadow-glow cursor-pointer"
            : "border-white/30 hover:border-purple-400 hover:bg-white/5 hover:shadow-glow-sm cursor-pointer"
        }`}
        onDragOver={isUploading ? undefined : handleDragOver}
        onDragLeave={isUploading ? undefined : handleDragLeave}
        onDrop={isUploading ? undefined : handleDrop}
        onClick={isUploading ? undefined : () => fileInputRef.current?.click()}
      >
        <div className="absolute inset-0 bg-gradient-primary opacity-5 group-hover:opacity-10 transition-opacity duration-500"></div>
        <div className="relative z-10">
          {isUploading ? (
            <>
              <div className="text-8xl mb-6 animate-pulse">⏳</div>
              <h3 className="text-2xl font-bold text-white mb-4 font-display">
                Uploading to R2...
              </h3>
              <p className="text-slate-300 text-lg">
                Please wait while we save your image
              </p>
            </>
          ) : (
            <>
              <div className="text-8xl mb-6 animate-float">📸</div>
              <h3 className="text-2xl font-bold text-white mb-4 font-display">
                {t("uploadArea")}
              </h3>
              <p className="text-slate-300 text-lg">{t("uploadSupport")}</p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>

      {/* Upload Error Display */}
      {uploadError && (
        <div className="bg-red-500/20 border border-red-400 rounded-2xl p-6 mb-8 text-center">
          <h3 className="text-red-400 font-bold text-lg mb-2">
            ❌ Upload Failed
          </h3>
          <p className="text-red-300">{uploadError}</p>
          <button
            onClick={() => setUploadError(null)}
            className="mt-4 text-red-400 hover:text-red-300 underline font-semibold"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-6 justify-center">
        <button className="bg-gradient-primary text-white px-10 py-4 rounded-2xl font-bold text-lg hover:shadow-glow transition-all duration-300 transform hover:scale-105 group">
          <span className="flex items-center justify-center gap-3">
            <span>{t("buttons.freeTrial")}</span>
            <span className="group-hover:translate-x-1 transition-transform duration-300">
              ✨
            </span>
          </span>
        </button>
        <button className="glass-dark border border-white/30 text-white px-10 py-4 rounded-2xl font-semibold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300">
          {t("buttons.viewExamples")}
        </button>
      </div>
    </div>
  );
}