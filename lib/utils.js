import { createHmac } from 'crypto';

export function generateID(key = String(Math.random()), secret = 'airdb') {
  const hash = createHmac('sha256', secret)
    .update(key)
    .digest('hex');
  return hash;
}
