import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { ResilientGateway } from '../gateways/ResilientGateway';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export class PaymentService {
  /**
   * Initiates a payment. 
   * Handles idempotency: if a payment with the same key exists, returns it.
   */
  static async initiatePayment(data: {
    amount: number;
    currency: string;
    idempotencyKey: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Check for existing payment with the same idempotency key
      const existing = await tx.payment.findUnique({
        where: { idempotencyKey: data.idempotencyKey }
      });

      if (existing) {
        logger.info(`Idempotency hit for key: ${data.idempotencyKey}`);
        return existing;
      }

      // 2. Create new payment in PENDING state
      const payment = await tx.payment.create({
        data: {
          amount: data.amount,
          currency: data.currency,
          idempotencyKey: data.idempotencyKey,
          status: PaymentStatus.PENDING,
        }
      });

      logger.info(`Payment initiated: ${payment.id}`);
      return payment;
    });
  }

  /**
   * Processes a payment with retry logic.
   * Uses atomic update to prevent race conditions (Concurrency Control).
   */
  static async processPayment(paymentId: string) {
    // Atomically move from PENDING to PROCESSING
    const updateResult = await prisma.payment.updateMany({
      where: { 
        id: paymentId,
        status: PaymentStatus.PENDING 
      },
      data: { status: PaymentStatus.PROCESSING }
    });

    if (updateResult.count === 0) {
      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      logger.warn(`Payment ${paymentId} could not be moved to PROCESSING. Current status: ${payment?.status}`);
      return payment;
    }

    return this.executeGatewayCallWithRetries(paymentId);
  }

  private static async executeGatewayCallWithRetries(
    paymentId: string, 
    attempt: number = 0
  ): Promise<any> {
    const maxRetries = parseInt(process.env.MAX_RETRIES || '3');
    const baseDelay = parseInt(process.env.BASE_RETRY_DELAY_MS || '1000');

    try {
      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      if (!payment) return;

      const result = await ResilientGateway.processPayment(payment.amount, payment.currency);

      return await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: result.status,
          providerId: result.providerId,
          lastError: result.error,
          retryCount: attempt
        }
      });

    } catch (error: any) {
      logger.error(`Attempt ${attempt + 1} failed for payment ${paymentId}: ${error.message}`);

      if (attempt < maxRetries && (error.message === 'GATEWAY_TRANSIENT_FAILURE' || error.message === 'GATEWAY_TIMEOUT')) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        logger.info(`Retrying payment ${paymentId} in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeGatewayCallWithRetries(paymentId, attempt + 1);
      }

      // Final failure
      return await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAILED,
          lastError: error.message,
          retryCount: attempt
        }
      });
    }
  }

  static async getPaymentStatus(paymentId: string) {
    return await prisma.payment.findUnique({ where: { id: paymentId } });
  }

  static async getAllPayments() {
    return await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to latest 50 for performance
    });
  }
}
