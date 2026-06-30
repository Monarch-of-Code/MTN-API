# MTN API Integration Project

A modern Node.js and Express backend that demonstrates how to integrate with MTN Mobile Money services for payments, collections, bank-style transfers, and bill payments. This project is designed to help developers understand the flow of building a fintech-style API layer around MTN's payment ecosystem.

## What this project does

This repository provides a simple API gateway that connects your application to MTN services for:

- User registration for MTN API access
- Sending money to mobile money recipients
- Requesting money from customers
- Initiating bank transfer-style mobile money transfers
- Processing bill payments
- Checking transaction/payment status

In short, this project shows how a backend can act as a bridge between your app and MTN payment APIs.

## Why this project is useful

If you are building a wallet, fintech platform, payment app, or digital services product, this project gives you a practical starting point for:

- integrating MTN Mobile Money APIs
- handling request validation
- generating secure API requests
- managing transaction flow through a clean Express backend

## Tech Stack

- Node.js
- Express.js
- Axios
- dotenv
- CORS
- UUID

## Project Structure

```bash
controllers/       # Business logic for each payment feature
middlewares/        # Request validation and authentication
routes/             # API route definitions
index.js            # Main Express server entry point
generateUUID.js     # Utility for generating unique transaction IDs
```

## API Endpoints

### Authentication
- POST /api/auth/register
  - Registers a user and creates an MTN API user entry

### Disbursements
- POST /api/disbursements/send-money
  - Sends money to a recipient mobile number

### Collections
- POST /api/collection/receive-money
  - Requests payment from a payer mobile number

### Bank Transfer
- POST /api/bank-transfer/transfer
  - Initiates a mobile money transfer between two parties
- GET /api/bank-transfer/transfer/:referenceId
  - Checks transfer status

### Bill Payments
- POST /api/bills/pay
  - Pays a bill using the MTN payment flow
- GET /api/bills/status/:transactionId
  - Checks bill payment transaction status

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root and add your MTN API credentials:

```env
PORT=5000
MTN_ENVIRONMENT=sandbox

MTN_API_BASE_URL=your_mtn_api_base_url
MTN_DISBURSEMENT_PRIMARY_KEY=your_disbursement_key
MTN_CALLBACK_HOST=your_callback_host

MTN_AUTH_DISBURSEMENTS_URL=your_auth_url
MTN_DISBURSEMENTS_URL=your_disbursement_url
MTN_DISBURSEMENT_USER_ID=your_disbursement_user_id
MTN_DISBURSEMENT_API_SECRET=your_disbursement_api_secret

MTN_AUTH_COLLECTIONS_URL=your_collection_auth_url
MTN_COLLECTIONS_URL=your_collection_url
MTN_COLLECTION_PRIMARY_KEY=your_collection_key
MTN_COLLECTION_USER_ID=your_collection_user_id
MTN_COLLECTION_API_SECRET=your_collection_api_secret

MTN_REMITTANCES_URL=your_remittance_url
MTN_REMITTANCE_PRIMARY_KEY=your_remittance_key
```

### 3. Start the server

```bash
node index.js
```

The server will run on:

```bash
http://localhost:5000
```

## Example Request

### Register a user

```bash
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "Muhammad",
  "lastName": "Muzammil",
  "phoneNumber": "256700000000"
}
```

### Send money

```bash
POST /api/disbursements/send-money
Content-Type: application/json

{
  "amount": "1000",
  "currency": "EUR",
  "recipientNumber": "256700000000"
}
```

## Notes

- This project is intended as a learning and integration example.
- You should use real MTN credentials in production environments.
- Always handle sensitive payment data carefully and follow security best practices.
- You must purchase MTN services and obtain valid credentials in order to use their APIs.

## License

This project is provided as-is for demonstration and learning purposes.

## Author

**Muhammad Muzammil** (Monarch of Code)
Full Stack Developer
