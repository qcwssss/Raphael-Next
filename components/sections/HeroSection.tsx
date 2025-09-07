interface HeroSectionProps {
  t: (key: string) => string;
}

export default function HeroSection({ t }: HeroSectionProps) {
  return (
    <section className="text-center py-8 px-4">
      {/* Main Brand */}
      <div className="flex items-center justify-center mb-3">
        <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mr-3">
          <span className="text-xl font-bold text-white">R</span>
        </div>
        <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
          Raphael AI
        </h1>
      </div>

      {/* Compact Tagline */}
      <p className="text-lg text-slate-300 mb-1 max-w-xl mx-auto">
        Create stunning AI-generated images in seconds
      </p>

      {/* Compact Subtitle */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="text-amber-400 text-sm">✨</span>
        <p className="text-sm text-slate-400">
          World's First Unlimited Free AI Image Generator
        </p>
        <span className="text-amber-400 text-sm">✨</span>
      </div>

      {/* Compact Feature Badges */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <div className="bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-full text-xs font-medium">
          100% Free
        </div>
        <div className="bg-green-500/20 border border-green-500/30 text-green-300 px-3 py-1 rounded-full text-xs font-medium">
          Powered by Flux.1 Dev
        </div>
        <div className="bg-blue-500/20 border border-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
          No Login Required
        </div>
        <div className="bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-1 rounded-full text-xs font-medium">
          Unlimited Generations
        </div>
      </div>
    </section>
  );
}