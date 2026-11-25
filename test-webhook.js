import 'dotenv/config';
import crypto from 'crypto';

const body = JSON.stringify({
  action: 'opened',
  pull_request: { number: 1 },
  repository: { full_name: 'test/repo' },
});

function sign(secret) {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

async function send(label, signature) {
  const res = await fetch('http://localhost:3000/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-GitHub-Event': 'pull_request',
      'X-GitHub-Delivery': 'test-123',
      'X-Hub-Signature-256': signature,
    },
    body,
  });
  console.log(label, res.status, await res.text());
}

await send('valid signature  ->', sign(process.env.WEBHOOK_SECRET));
await send('wrong signature  ->', sign('wrong-secret'));