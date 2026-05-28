export interface LiveUpdate {
  buildNumber: string;
  environment: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  totalPass: number;
  totalFail: number;
  batchCount: number;
}
