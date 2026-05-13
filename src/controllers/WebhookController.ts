import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { PaymentStatus } from '../services/PaymentService';

export class WebhookController {
  static async handleGatewayCallback(req: Request, res: Response) {
    const { paymentId, status, providerId, error } = req.body;

    logger.info(`Webhook received for payment ${paymentId}: ${status}`);

    try {
      await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { id: paymentId }
        });

        if (!payment) {
          logger.warn(`Webhook received for non-existent payment: ${paymentId}`);
          return;
        }

        if (payment.status === PaymentStatus.SUCCESS || payment.status === PaymentStatus.FAILED) {
          logger.info(`Payment ${paymentId} is already in final state ${payment.status}. Skipping webhook.`);
          return;
        }

        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: status === 'SUCCESS' ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
            providerId,
            lastError: error,
            updatedAt: new Date()
          }
        });

        logger.info(`Payment ${paymentId} updated via webhook to ${status}`);
      });

      return res.status(200).json({ received: true });
    } catch (err: any) {
      logger.error(`Webhook processing error: ${err.message}`);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
}
