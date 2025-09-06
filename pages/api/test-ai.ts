import { NextApiRequest, NextApiResponse } from "next";
import { testAISetup, checkEnvironmentSetup } from "../../lib/ai-providers/test-setup";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const results = {
      timestamp: new Date().toISOString(),
      environment: checkEnvironmentSetup(),
      aiSetup: false,
      error: null as string | null
    };

    if (results.environment) {
      try {
        results.aiSetup = await testAISetup();
      } catch (error) {
        results.error = error instanceof Error ? error.message : 'AI setup test failed';
      }
    }

    const status = results.environment && results.aiSetup ? 'success' : 'failure';
    const statusCode = status === 'success' ? 200 : 500;

    console.log(`🧪 AI Test Results: ${status}`);

    res.status(statusCode).json({
      status,
      ...results
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown test error',
      timestamp: new Date().toISOString()
    });
  }
}