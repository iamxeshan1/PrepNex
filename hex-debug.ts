
import process from 'process';

console.log('--- HEX DUMP RAZORPAY VARS ---');
for (const key in process.env) {
  if (key.includes('RAZORPAY')) {
    const val = process.env[key] || "";
    const hex = Buffer.from(val).toString('hex');
    console.log(`${key}: last 8 chars hex: ${hex.slice(-16)} (last 4 chars: ${val.slice(-4)})`);
  }
}
