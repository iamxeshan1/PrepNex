import http from 'http';

const data = JSON.stringify({ amount: 2, itemId: "test_jrasst", couponCode: "TEST" });

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/create-order',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
