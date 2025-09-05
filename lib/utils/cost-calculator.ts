/**
 * Cost calculation utilities for AI providers
 */

export interface ProviderCost {
  name: string;
  costPerGeneration: number;
  isActive: boolean;
}

export interface CostEstimate {
  provider: string;
  cost: number;
  estimatedTime: number;
  quality: 'basic' | 'standard' | 'premium';
}

/**
 * Default provider costs (can be updated from database)
 */
const DEFAULT_PROVIDER_COSTS: ProviderCost[] = [
  { name: 'flux1', costPerGeneration: 0.008, isActive: true },
  { name: 'stable_diffusion_xl', costPerGeneration: 0.015, isActive: true },
  { name: 'google_gemini', costPerGeneration: 0.039, isActive: true }
];

/**
 * Get cost for a specific provider
 */
export function getProviderCost(providerName: string): number {
  const provider = DEFAULT_PROVIDER_COSTS.find(p => p.name === providerName);
  return provider?.costPerGeneration || 0;
}

/**
 * Calculate total cost for multiple generations
 */
export function calculateTotalCost(
  providerName: string,
  generationCount: number
): number {
  const unitCost = getProviderCost(providerName);
  return unitCost * generationCount;
}

/**
 * Get cost estimates for all available providers
 */
export function getAllProviderCostEstimates(userTier: string = 'free'): CostEstimate[] {
  const estimates: CostEstimate[] = [];

  for (const provider of DEFAULT_PROVIDER_COSTS) {
    if (!provider.isActive) continue;

    let quality: 'basic' | 'standard' | 'premium' = 'basic';
    let estimatedTime = 30; // seconds

    // Provider-specific quality and time estimates
    switch (provider.name) {
      case 'flux1':
        quality = 'basic';
        estimatedTime = 8;
        break;
      case 'stable_diffusion_xl':
        quality = 'standard'; 
        estimatedTime = 25;
        break;
      case 'google_gemini':
        quality = 'premium';
        estimatedTime = 15;
        break;
    }

    estimates.push({
      provider: provider.name,
      cost: provider.costPerGeneration,
      estimatedTime,
      quality
    });
  }

  // Sort by cost (cheapest first) for free users, by quality for premium
  if (userTier === 'free') {
    estimates.sort((a, b) => a.cost - b.cost);
  } else if (userTier === 'premium') {
    const qualityOrder = { premium: 3, standard: 2, basic: 1 };
    estimates.sort((a, b) => qualityOrder[b.quality] - qualityOrder[a.quality]);
  }

  return estimates;
}

/**
 * Calculate monthly cost projection
 */
export function calculateMonthlyCostProjection(
  dailyGenerations: number,
  providerDistribution: Record<string, number> // percentage distribution
): number {
  let totalMonthlyCost = 0;
  const daysInMonth = 30;

  for (const [providerName, percentage] of Object.entries(providerDistribution)) {
    const dailyCostForProvider = 
      (dailyGenerations * percentage / 100) * getProviderCost(providerName);
    totalMonthlyCost += dailyCostForProvider * daysInMonth;
  }

  return totalMonthlyCost;
}

/**
 * Get recommended provider based on user tier and cost constraints
 */
export function getRecommendedProvider(
  userTier: string = 'free',
  budgetConstraint?: number
): string {
  const estimates = getAllProviderCostEstimates(userTier);
  
  if (budgetConstraint) {
    const affordableProviders = estimates.filter(e => e.cost <= budgetConstraint);
    if (affordableProviders.length > 0) {
      // Return highest quality within budget
      return affordableProviders[0].provider;
    }
  }

  // Default recommendation based on tier
  switch (userTier) {
    case 'free':
      return 'flux1'; // Cheapest option
    case 'paid':
      return 'stable_diffusion_xl'; // Balance of cost and quality
    case 'premium':
      return 'google_gemini'; // Best quality
    default:
      return 'flux1';
  }
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(1)}¢`;
  }
  return `$${cost.toFixed(3)}`;
}

/**
 * Check if generation would exceed budget
 */
export function wouldExceedBudget(
  currentSpend: number,
  budgetLimit: number,
  additionalCost: number
): boolean {
  return (currentSpend + additionalCost) > budgetLimit;
}