import { NextApiRequest, NextApiResponse } from "next";
import { aiProviderManager } from "../../lib/ai-providers/provider-manager";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get system status
    const systemStatus = await aiProviderManager.getSystemStatus();
    
    // Get available providers with configurations
    const availableProviders = aiProviderManager.getAvailableProviders();

    // Environment check
    const environmentStatus = {
      replicateConfigured: !!process.env.REPLICATE_API_TOKEN,
      r2Configured: !!(
        process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
        process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
        process.env.CLOUDFLARE_R2_BUCKET_NAME &&
        process.env.CLOUDFLARE_R2_ACCOUNT_ID
      ),
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    };

    const response = {
      timestamp: new Date().toISOString(),
      status: systemStatus.healthyProviders > 0 ? 'operational' : 'degraded',
      environment: environmentStatus,
      providers: {
        total: systemStatus.totalProviders,
        healthy: systemStatus.healthyProviders,
        details: systemStatus.providers
      },
      capabilities: {
        availableStyles: systemStatus.availableStyles,
        supportedTiers: availableProviders.map(p => p.tier.name),
        estimatedCosts: availableProviders.reduce((acc, p) => {
          acc[p.name] = `$${p.tier.costPerImage}`;
          return acc;
        }, {} as Record<string, string>)
      },
      configuration: availableProviders.map(p => ({
        name: p.name,
        displayName: p.tier.displayName,
        tier: p.tier.name,
        costPerImage: p.tier.costPerImage,
        estimatedSpeed: `${p.tier.estimatedSpeedSeconds}s`,
        supportedStyles: p.supportedStyles,
        enabled: p.tier.enabled
      }))
    };

    console.log(`📊 AI System Status: ${response.status} (${response.providers.healthy}/${response.providers.total} providers healthy)`);

    res.status(200).json(response);

  } catch (error) {
    console.error("AI status check failed:", error);
    
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: 'Failed to get system status',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}