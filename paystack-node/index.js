require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json({
  verify: (req, res, buf) => {
    // store raw body for webhook signature verification
    req.rawBody = buf.toString();
  }
}));

const PAYSTACK_BASE = process.env.PAYSTACK_BASE || 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  console.error('PAYSTACK_SECRET_KEY is not set.');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json'
};

function verifySignature(req) {
  const signature = req.headers['x-paystack-signature'];
  if (!signature) return false;
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(req.rawBody)
    .digest('hex');
  return signature === hash;
}

async function createRecipient(name, accountNumber, bankCode) {
  const data = {
    type: 'nuban',
    name,
    account_number: accountNumber,
    bank_code: bankCode,
    currency: 'ZAR'
  };

  const resp = await axios.post(`${PAYSTACK_BASE}/transferrecipient`, data, { headers });
  return resp.data.data.recipient_code;
}

async function initiateTransfer(amount, recipientCode, reason) {
  const data = {
    source: 'balance',
    amount,
    recipient: recipientCode,
    reason
  };
  const resp = await axios.post(`${PAYSTACK_BASE}/transfer`, data, { headers });
  return resp.data.data;
}

app.post('/webhook', (req, res) => {
  if (!verifySignature(req)) {
    console.warn('Invalid webhook signature');
    return res.status(400).send('invalid signature');
  }

  console.log('Webhook received:', req.body);
  res.status(200).send('ok');
});

async function main() {
  try {
    const recipientCode = await createRecipient(
      'BW Maiden',
      '1560706447',
      '470010'
    );

    const transfer = await initiateTransfer(20000 * 100, recipientCode, 'Advance for expenses');
    console.log('Transfer initiated:', transfer);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Webhook server listening on port ${port}`);
  });

  main();
}
