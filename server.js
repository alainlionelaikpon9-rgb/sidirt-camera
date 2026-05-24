const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

let latestFrame = null;
let clients = [];

app.post('/push', (req, res) => {
  let chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    latestFrame = Buffer.concat(chunks);
    res.sendStatus(200);
  });
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width">
      <title>SITIRT - Surveillance en direct</title>
      <style>
        body{margin:0;background:#0a0e1a;display:flex;
             flex-direction:column;align-items:center;
             justify-content:center;height:100vh;color:white;
             font-family:Arial;}
        h2{color:#ff4444;margin-bottom:10px;}
        img{max-width:95%;border:2px solid #ff4444;border-radius:8px;}
      </style>
    </head>
    <body>
      <h2>🔥 SITIRT - Caméra en direct</h2>
      <img src="/stream" />
    </body>
    </html>
  `);
});

app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=frame');
  res.setHeader('Cache-Control', 'no-cache');
  clients.push(res);
  req.on('close', () => {
    clients = clients.filter(c => c !== res);
  });
});

setInterval(() => {
  if (!latestFrame || clients.length === 0) return;
  const header = Buffer.from(
    `--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${latestFrame.length}\r\n\r\n`
  );
  const footer = Buffer.from('\r\n');
  const packet = Buffer.concat([header, latestFrame, footer]);
  clients.forEach(c => c.write(packet));
}, 200);

app.listen(PORT, () => console.log(`Serveur SITIRT actif sur port ${PORT}`));
