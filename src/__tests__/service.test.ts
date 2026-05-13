import { PaymentService } from '../services/PaymentService';
import prisma from '../utils/prisma';
import { ResilientGateway } from '../gateways/ResilientGateway';
import { randomUUID } from 'crypto';

jest.mock('../gateways/ResilientGateway');

describe('Payment Service Retry Logic', () => {
  beforeEach(async () => {
    await prisma.payment.deleteMany();
    jest.clearAllMocks();
  });

  it('should retry on transient failure and eventually succeed', async () => {
    const payment = await prisma.payment.create({
      data: {
        amount: 100,
        currency: 'USD',
        idempotencyKey: randomUUID(),
        status: 'PENDING'
      }
    });

    // Mock 2 failures then 1 success
    (ResilientGateway.processPayment as jest.Mock)
      .mockRejectedValueOnce(new Error('GATEWAY_TRANSIENT_FAILURE'))
      .mockRejectedValueOnce(new Error('GATEWAY_TRANSIENT_FAILURE'))
      .mockResolvedValueOnce({ success: true, status: 'SUCCESS', providerId: 'p123' });

    // Speed up tests by mocking setTimeout
    const originalSetTimeout = global.setTimeout;
    // @ts-ignore
    global.setTimeout = (fn: any) => fn();

    await PaymentService.processPayment(payment.id);

    const updatedPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
    expect(updatedPayment?.status).toBe('SUCCESS');
    expect(updatedPayment?.retryCount).toBe(2);
    expect(ResilientGateway.processPayment).toHaveBeenCalledTimes(3);

    global.setTimeout = originalSetTimeout;
  });

  it('should stop retrying after MAX_RETRIES', async () => {
    const payment = await prisma.payment.create({
      data: {
        amount: 100,
        currency: 'USD',
        idempotencyKey: randomUUID(),
        status: 'PENDING'
      }
    });

    // Mock constant failures
    (ResilientGateway.processPayment as jest.Mock)
      .mockRejectedValue(new Error('GATEWAY_TRANSIENT_FAILURE'));

    // @ts-ignore
    const originalSetTimeout = global.setTimeout;
    // @ts-ignore
    global.setTimeout = (fn: any) => fn();

    await PaymentService.processPayment(payment.id);

    const updatedPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
    expect(updatedPayment?.status).toBe('FAILED');
    expect(updatedPayment?.retryCount).toBe(3); // Based on MAX_RETRIES=3 in .env
    
    global.setTimeout = originalSetTimeout;
  });
});
