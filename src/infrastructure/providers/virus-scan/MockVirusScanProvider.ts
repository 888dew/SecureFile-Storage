import { IVirusScanProvider, ScanResult } from '@application/ports/IVirusScanProvider';
import { createChildLogger } from '@shared/logger/logger';

const log = createChildLogger('MockVirusScanProvider');

/**
 * Mock implementation used in development/test environments.
 * Returns 'skipped' for all files. Replace with ClamavVirusScanProvider in production.
 */
export class MockVirusScanProvider implements IVirusScanProvider {
  async scan(_buffer: Buffer, filename: string): Promise<ScanResult> {
    log.debug({ filename }, 'Virus scan skipped (mock provider)');
    return { outcome: 'skipped', message: 'Mock scan — always skipped' };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}
