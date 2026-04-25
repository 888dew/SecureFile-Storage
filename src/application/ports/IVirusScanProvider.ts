export type ScanOutcome = 'clean' | 'infected' | 'error' | 'skipped';

export interface ScanResult {
  outcome: ScanOutcome;
  virusName?: string;
  message?: string;
}

export interface IVirusScanProvider {
  scan(buffer: Buffer, filename: string): Promise<ScanResult>;
  isAvailable(): Promise<boolean>;
}
