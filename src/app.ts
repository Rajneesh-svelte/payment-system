import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { PaymentController } from './controllers/PaymentController';
import { WebhookController } from './controllers/WebhookController';

const app = express();

app.use(cors());
app.use(express.json());


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Routes
app.get('/api/payments', PaymentController.list);
app.post('/api/payments', PaymentController.initiate);
app.get('/api/payments/:id', PaymentController.getStatus);
app.post('/api/webhooks/gateway', WebhookController.handleGatewayCallback);

// Mock Health Check
app.get('/health', (req, res) => res.json({ status: 'OK' }));

export default app;
