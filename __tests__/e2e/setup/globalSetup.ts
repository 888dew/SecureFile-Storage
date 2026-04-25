export default async function globalSetup(): Promise<void> {
  // E2E global setup — ensure services are running via docker-compose
  console.log('\n🔧 E2E Global Setup: checking environment...');

  if (!process.env['DB_HOST']) {
    process.env['DB_HOST'] = 'localhost';
  }
  if (!process.env['REDIS_HOST']) {
    process.env['REDIS_HOST'] = 'localhost';
  }
}
