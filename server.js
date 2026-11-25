import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';

const PORT = process.env.PORT || 3000;
const SECRET = process.env.WEBHOOK_SECRET;
if (!SECRET) {
  console.error('WEBHOOK_SECRET is missing');
  process.exit(1);
}

const app = express();

function verifySignature(rawBody, signatureHeader) {
  if (!signatureHeader) return false;
  const expected =
    'sha256=' +
    crypto.createHmac('sha256', SECRET).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.get('X-Hub-Signature-256');

  if (!verifySignature(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.get('X-GitHub-Event');
  const deliveryId = req.get('X-GitHub-Delivery');
  const payload = JSON.parse(req.body.toString('utf8'));

  if (event === 'ping') {
    return res.status(200).send('pong');
  }

  const reviewable = ['opened', 'synchronize', 'reopened'];
  if (event === 'pull_request' && reviewable.includes(payload.action)) {
    console.log(
      `[${deliveryId}] PR #${payload.pull_request.number} ${payload.action} in ${payload.repository.full_name}`
    );
  }

  res.status(200).send('ok');
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));