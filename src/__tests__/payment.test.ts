import request from 'supertest';
import app from '../app';
import prisma from '../utils/prisma';
import { randomUUID } from 'crypto';

describe('Payment System API', () => {
  beforeAll(async () => {
    // Clear the database before tests
    await prisma.payment.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should initiate a payment successfully', async () => {
    const idempotencyKey = randomUUID();
    const res = await request(app)
      .post('/api/payments')
      .send({
        amount: 100.0,
        currency: 'USD',
        idempotencyKey
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.idempotencyKey).toBe(idempotencyKey);
  });

  it('should be idempotent: same key returns same payment', async () => {
    const idempotencyKey = randomUUID();
    const payload = {
      amount: 50.0,
      currency: 'EUR',
      idempotencyKey
    };

    // First call
    const res1 = await request(app).post('/api/payments').send(payload);
    const paymentId = res1.body.id;

    // Second call
    const res2 = await request(app).post('/api/payments').send(payload);

    expect(res2.status).toBe(201);
    expect(res2.body.id).toBe(paymentId);
    
    // Check DB count
    const count = await prisma.payment.count({ where: { idempotencyKey } });
    expect(count).toBe(1);
  });

  it('should handle invalid inputs', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({
        amount: -10,
        currency: 'INVALID',
        idempotencyKey: ''
      });

    expect(res.status).toBe(400);
  });

  it('should track payment status', async () => {
    const idempotencyKey = randomUUID();
    const res1 = await request(app)
      .post('/api/payments')
      .send({
        amount: 10.0,
        currency: 'GBP',
        idempotencyKey
      });

    const paymentId = res1.body.id;
    const res2 = await request(app).get(`/api/payments/${paymentId}`);

    expect(res2.status).toBe(200);
    expect(res2.body.id).toBe(paymentId);
  });
});
