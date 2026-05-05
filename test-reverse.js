import Razorpay from 'razorpay';
import http from 'http';

const rzp = new Razorpay({
  key_id: 'LZrGeD0OTFi8PfYoD0Z4FJ1F', // SECRET in key_id
  key_secret: 'rzp_live_SlatKCq1SZwzYG' // ID in key_secret
});

rzp.orders.create({ amount: 1000, currency: "INR" })
  .then(console.log)
  .catch(e => console.error(e));
