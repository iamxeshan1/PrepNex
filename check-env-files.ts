
import fs from 'fs';
import path from 'path';

const files = ['.env', '.env.local', '.env.development', '.env.production'];
files.forEach(file => {
  const p = path.join(process.cwd(), file);
  if (fs.existsSync(p)) {
    console.log(`--- ${file} FOUND ---`);
    const content = fs.readFileSync(p, 'utf8');
    content.split('\n').forEach(line => {
      if (line.includes('RAZORPAY')) {
        const parts = line.split('=');
        const key = parts[0];
        const val = parts[1] || "";
        console.log(`${key}=...${val.trim().slice(-4)}`);
      }
    });
  } else {
    console.log(`--- ${file} NOT FOUND ---`);
  }
});
