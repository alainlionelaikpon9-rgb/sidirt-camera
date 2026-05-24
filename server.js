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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SITIRT - Surveillance en direct</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0;}
        body{
          background:#0a0e1a;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          min-height:100vh;
          color:white;
          font-family:Arial;
          padding:20px;
        }
        h2{
          color:#ff4444;
          margin-bottom:15px;
          font-size:1.4em;
          text-align:center;
        }
        .camera-box{
          width:100%;
          max-width:900px;
          border:3px solid #ff4444;
          border-radius:12px;
          overflow:hidden;
          box-shadow:0 0 30px rgba(255,68,68,0.4);
        }
        img{
          width:100%;
          height:auto;
          display:block;
        }
        .status{
          margin-top:12px;
          font-size:0.9em;
          color:#aaa;
        }
        .dot{
          display:inline-block;
          width:10px;
          height:10px;
          background:#ff4444;
          border-radius:50%;
          margin-right:6px;
          animation:blink 1s infinite;
        }
        @keyframes blink{
          0%,100%{opacity:1;}
          50%{opacity:0;}
        }
      </style>
    </head>
    <body>
      <h2>🔥 SITIRT - Caméra en direct</h2>
      <div class="camera-box">
        <img src="/stream" />
      </div>
      <p class="status">
        <span class="dot"></span>En direct
      </p>
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
}, 100);

app.listen(PORT, () => console.log(`Serveur SITIRT actif sur port ${PORT}`));
