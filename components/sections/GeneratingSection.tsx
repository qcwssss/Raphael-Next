interface GeneratingSectionProps {
  generationProgress: number;
  remainingTime: number;
  onCancel: () => void;
  t: (key: string) => string;
}

export default function GeneratingSection({
  generationProgress,
  remainingTime,
  onCancel,
  t,
}: GeneratingSectionProps) {
  return (
    <div className="max-w-3xl mx-auto text-center">
      <div className="mb-12">
        <h2 className="text-4xl font-bold text-white mb-8 font-display">
          {t("generating")}
          <span className="loading-dots ml-3">
            <span className="animate-pulse">.</span>
            <span
              className="animate-pulse"
              style={{ animationDelay: "0.2s" }}
            >
              .
            </span>
            <span
              className="animate-pulse"
              style={{ animationDelay: "0.4s" }}
            >
              .
            </span>
          </span>
        </h2>

        <div className="glass-dark rounded-3xl p-10 border border-white/20 shadow-card">
          <div className="relative mb-8">
            <div className="w-full bg-white/10 rounded-full h-6 overflow-hidden">
              <div
                className="progress-bar bg-gradient-primary h-6 rounded-full transition-all duration-500 shadow-glow-sm"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <div className="mt-4 text-xl font-bold text-white">
              {Math.round(generationProgress)}%
            </div>
          </div>

          <p className="text-slate-300 mb-8 text-lg">
            {t("estimatedTime", { time: remainingTime })}
          </p>

          <button
            className="px-8 py-3 glass-dark border border-white/30 text-white rounded-xl hover:bg-white/10 hover:border-white/50 transition-all duration-300 font-semibold"
            onClick={onCancel}
          >
            {t("buttons.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}