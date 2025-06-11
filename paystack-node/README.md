# Paystack Node Example

This is a simple Node.js project that demonstrates how to send funds using the Paystack API and receive webhook updates.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Paystack secret key and optional base URL/port.

3. Start the server:
   ```bash
   npm start
   ```

The script will create a transfer recipient and initiate a transfer of 20,000 ZAR. Incoming webhook events are logged to the console.
