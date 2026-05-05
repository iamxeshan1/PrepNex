import process from 'process';
console.log('PID:', process.pid);
console.log('PPID:', process.ppid);
console.log('VITE_RAZORPAY_KEY_ID:', process.env.VITE_RAZORPAY_KEY_ID?.slice(-4));
console.log('Argv:', process.argv);
