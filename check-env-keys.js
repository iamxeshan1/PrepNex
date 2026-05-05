import process from 'process';
for (const key in process.env) {
  if (key.includes('RAZORPAY')) {
    console.log(`Key: [${key}], Value end: [${process.env[key]?.slice(-4)}]`);
  }
}
