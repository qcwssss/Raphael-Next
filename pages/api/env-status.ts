import { NextApiRequest, NextApiResponse } from 'next';
import { checkUploadEnvironment, getEnvironmentStatusReport } from '../../lib/utils/env-checker';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const envCheck = checkUploadEnvironment();
    const report = getEnvironmentStatusReport();

    // Return both JSON data and formatted report
    res.status(200).json({
      success: true,
      environment: {
        isReady: envCheck.isReady,
        missing: envCheck.missing,
        warnings: envCheck.warnings,
        suggestions: envCheck.suggestions
      },
      report: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Environment check error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Environment check failed'
    });
  }
}