import { TRUSTED_IMAGE_DOMAINS } from "../../lib/config/constants";

interface ResultSectionProps {
  uploadedImageUrl: string | null;
  resultImageUrl: string | null;
  dailyUsage: number;
  t: (key: string) => string;
  onRegenerate: () => void;
  onRestart: () => void;
}

// URL validation to prevent SSRF attacks
function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow HTTPS for external URLs
    if (parsedUrl.protocol !== 'https:') {
      return false;
    }
    
    // Check if domain is in trusted list
    return TRUSTED_IMAGE_DOMAINS.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
    ) || parsedUrl.hostname === window.location.hostname; // Allow same origin
  } catch {
    return false;
  }
}

export default function ResultSection({
  uploadedImageUrl,
  resultImageUrl,
  dailyUsage,
  t,
  onRegenerate,
  onRestart,
}: ResultSectionProps) {
  const handleDownload = async () => {
    if (!resultImageUrl) return;

    // Validate URL before downloading
    if (!isValidImageUrl(resultImageUrl)) {
      console.error("❌ Invalid or untrusted image URL:", resultImageUrl);
      // In a real implementation, this should use a toast notification
      console.error("Security: Blocked download from untrusted domain");
      alert("Cannot download image: Security restriction - untrusted domain");
      return;
    }

    try {
      console.log("🔗 Downloading image from:", resultImageUrl);
      
      // Fetch the image from the result URL
      const response = await fetch(resultImageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      // Get the image as blob
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, "-");
      a.download = `generated-image-${timestamp}.jpg`;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log("✅ Image download completed");
    } catch (error) {
      console.error("❌ Download failed:", error);
      // Use a more user-friendly error message
      const errorMessage = error instanceof Error ? error.message : "Download failed";
      console.error("Download error details:", errorMessage);
      // In a real implementation, this should use a toast or modal
      alert("Download failed. Please check your connection and try again.");
    }
  };

  const handleShare = async () => {
    if (!resultImageUrl) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My AI Generated Art",
          text: "Check out this amazing AI-generated artwork!",
          url: resultImageUrl,
        });
      } else {
        // Fallback: Copy URL to clipboard
        await navigator.clipboard.writeText(resultImageUrl);
        // In a real implementation, this should use a toast notification
        console.log("✅ Image URL copied to clipboard");
        alert("Image URL copied to clipboard!");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-6 font-display">
          {t("generationComplete")}
        </h2>
        <p className="text-xl text-slate-300">Your artwork is ready!</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-12 items-center mb-12">
        {/* Original Image */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-white text-center font-display">
            {t("originalImage")}
          </h3>
          {uploadedImageUrl && (
            <div className="rounded-3xl overflow-hidden glass-dark border border-white/20 shadow-card group">
              <img
                src={uploadedImageUrl}
                alt={t("originalImage")}
                className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="text-center">
          <div className="text-6xl bg-gradient-primary bg-clip-text text-transparent animate-pulse">
            →
          </div>
        </div>

        {/* Result Image */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-white text-center font-display">
            {t("generatedResult")}
          </h3>
          {resultImageUrl && (
            <div className="rounded-3xl overflow-hidden glass-dark border border-purple-400/50 shadow-glow group">
              <img
                src={resultImageUrl}
                alt={t("generatedResult")}
                className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-6 mb-12">
        <button 
          onClick={handleDownload}
          className="flex items-center gap-3 bg-gradient-primary text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-glow transition-all duration-300 transform hover:scale-105 group"
        >
          <span>{t("buttons.download")}</span>
          <span className="group-hover:translate-y-[-2px] transition-transform duration-300">
            💾
          </span>
        </button>
        <button
          className="flex items-center gap-3 glass-dark border border-white/30 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300"
          onClick={onRegenerate}
        >
          <span>{t("buttons.regenerate")}</span>
          <span>🔄</span>
        </button>
        <button 
          onClick={handleShare}
          className="flex items-center gap-3 glass-dark border border-white/30 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300"
        >
          <span>{t("buttons.share")}</span>
          <span>📤</span>
        </button>
      </div>

      {/* Usage Status */}
      <div className="glass-dark rounded-3xl p-8 border border-white/20 text-center shadow-card">
        <p className="text-slate-300 mb-6 text-lg">
          {t("dailyUsage", { remaining: 5 - dailyUsage, total: 5 })}
        </p>
        <button className="bg-gradient-warm text-white px-8 py-3 rounded-xl font-bold hover:shadow-glow transition-all duration-300 transform hover:scale-105">
          {t("upgradePrompt")}
        </button>
      </div>

      <div className="text-center mt-10">
        <button
          className="text-purple-400 hover:text-purple-300 font-semibold text-lg transition-colors duration-300 hover:underline"
          onClick={onRestart}
        >
          {t("buttons.restart")}
        </button>
      </div>
    </div>
  );
}