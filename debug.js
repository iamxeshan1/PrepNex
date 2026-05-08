fetch("http://127.0.0.1:3000/api/debug-subs").then(r=>r.json()).then(r=>console.log(JSON.stringify(r, null, 2))).catch(console.error);
