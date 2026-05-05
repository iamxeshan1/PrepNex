const https = require('https');
const data = JSON.stringify({ amount: 100, currency: "INR" });
const options = {
  hostname: 'api.razorpay.com',
  path: '/v1/orders',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + Buffer.from('invalid:secret').toString('base64')
  }
};
const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(body));
});
req.write(data);
req.end();
