# Payment Processing System

A robust backend for handling payments with resilience and consistency.

## Setup
1. Install dependencies: `npm install`
2. Initialize DB: `npx prisma migrate dev`
3. Start server: `npm start`

## API Endpoints
- `POST /api/payments`: Initiate a payment.
- `GET /api/payments/:id`: Get payment status.
- `POST /api/webhooks/gateway`: Handle gateway callbacks.

## Key Features
- **Idempotency**: Prevents duplicate payments.
- **Retry Logic**: Exponential backoff for gateway failures.
- **Concurrency Control**: Prevents parallel processing of the same payment.
- **Circuit Breaker**: Protects external systems.
- **Logging**: Detailed tracing of payment lifecycle.
