export interface TestStep {
  name: string;
  status: 'PASS' | 'FAIL';
  durationMs: number;
  errorMessage?: string;
  timestamp: number;
}

export interface TestCase {
  suiteName: string;
  caseName: string;
  status: 'PASS' | 'FAIL';
  errorMessage?: string;
  rawStackTrace?: string;
  errorFingerprint?: string;
  steps: TestStep[];
}

export interface ExecutionBatch {
  batchId: string;
  durationMs: number;
  metadata: Record<string, string>;
  testCases: TestCase[];
}

export interface TestRun {
  buildNumber: string;
  environment: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  batches: ExecutionBatch[];
  totalPass: number;
  totalFail: number;
}
