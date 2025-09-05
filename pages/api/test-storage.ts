import { NextApiRequest, NextApiResponse } from 'next';
import { runBasicTests } from '../../lib/utils/test-storage';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Capture console output
    const originalLog = console.log;
    const originalError = console.error;
    const logs: string[] = [];

    console.log = (...args: any[]) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };

    console.error = (...args: any[]) => {
      logs.push('ERROR: ' + args.join(' '));
      originalError(...args);
    };

    // Run tests
    const allPassed = runBasicTests();

    // Restore console
    console.log = originalLog;
    console.error = originalError;

    res.status(200).json({
      success: allPassed,
      message: allPassed ? 'All tests passed!' : 'Some tests failed',
      logs: logs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test execution error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}