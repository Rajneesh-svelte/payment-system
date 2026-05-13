import logger from '../utils/logger';

export interface GatewayResponse {
  success: boolean;
  providerId?: string;
  error?: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
}

export class GatewaySimulator {
  /**
   * Simulates a payment gateway call with random outcomes:
   * - 70% Success
   * - 15% Transient Failure (Retryable)
   * - 10% Timeout (Retryable)
   * - 5% Permanent Failure (Non-retryable)
   */
  static async processPayment(amount: number, currency: string): Promise<GatewayResponse> {
    const random = Math.random();
    
    // Simulate network delay (100ms - 2000ms)
    const delay = Math.floor(Math.random() * 1900) + 100;
    await new Promise(resolve => setTimeout(resolve, delay));

    logger.debug(`Gateway received request: ${amount} ${currency}`);

    if (random < 0.7) {
      return {
        success: true,
        providerId: `prov_${Math.random().toString(36).substr(2, 9)}`,
        status: 'SUCCESS'
      };
    } else if (random < 0.85) {
      throw new Error('GATEWAY_TRANSIENT_FAILURE');
    } else if (random < 0.95) {
      throw new Error('GATEWAY_TIMEOUT');
    } else {
      return {
        success: false,
        error: 'INVALID_CARD_DETAILS',
        status: 'FAILED'
      };
    }
  }
}
