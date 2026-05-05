import process from 'process';
console.log('--- RAW ENV ---');
for (const key in process.env) {
  if (key.includes('RAZORPAY')) {
    console.log(`${key}=...${process.env[key]?.slice(-4)}`);
  }
}
