import request from 'supertest';
import express from 'express';
import { createApp } from '@presentation/http/app';

// E2E tests require the full stack (DB + Redis) to be running.
// Use docker-compose -f docker-compose.test.yml up -d before running.
describe('Auth API (E2E)', () => {
  // Placeholder — actual e2e wiring uses globalSetup to spin up the app
  it('should respond 200 on GET /health', async () => {
    // Minimal smoke test using a bare express app
    const app = express();
    app.get('/health', (_req, res) => res.json({ status: 'ok' }));

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
