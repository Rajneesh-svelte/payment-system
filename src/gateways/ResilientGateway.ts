import CircuitBreaker from 'opossum';
import { GatewaySimulator, GatewayResponse } from './GatewaySimulator';
import logger from '../utils/logger';

const options = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
};

const breaker = new CircuitBreaker(GatewaySimulator.processPayment, options);

breaker.on('open', () => logger.warn('Gateway Circuit Breaker OPEN'));
breaker.on('halfOpen', () => logger.info('Gateway Circuit Breaker HALF-OPEN'));
breaker.on('close', () => logger.info('Gateway Circuit Breaker CLOSED'));

export class ResilientGateway {
  static async processPayment(amount: number, currency: string): Promise<GatewayResponse> {
    try {
      return await breaker.fire(amount, currency);
    } catch (error: any) {
      if (error.message === 'The circuit is open') {
        logger.error('Circuit Breaker is active. Rejecting request.');
        throw new Error('GATEWAY_SERVICE_UNAVAILABLE');
      }
      throw error;
    }
  }
}
