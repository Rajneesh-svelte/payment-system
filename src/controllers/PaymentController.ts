import { Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';
import { z } from 'zod';
import logger from '../utils/logger';

const InitiatePaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  idempotencyKey: z.string().min(1)
});

export class PaymentController {
  static async initiate(req: Request, res: Response) {
    try {
      const validatedData = InitiatePaymentSchema.parse(req.body);
      const payment = await PaymentService.initiatePayment(validatedData);
      PaymentService.processPayment(payment.id).catch(err => {
        logger.error(`Async processing failed for ${payment.id}: ${err.message}`);
      });

      return res.status(201).json(payment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      logger.error(`Controller Error: ${error.message}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getStatus(req: Request, res: Response) {
    try {
      const id = req.params['id'] as string;
      const payment = await PaymentService.getPaymentStatus(id);

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      return res.json(payment);
    } catch (error: any) {
      logger.error(`Controller Error: ${error.message}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
