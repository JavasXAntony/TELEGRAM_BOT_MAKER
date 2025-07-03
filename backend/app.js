const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

let currentBotProcess = null; // ⬅️ menyimpan proses bot aktif

// Middleware log request
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
  next();
});

// Serve static files dari project root
app.use(express.static(path.join(__dirname, '..')));

// Serve index.html
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, '..', 'index.html');
  console.log(`Serving index.html from: ${filePath}`);
  res.sendFile(filePath);
});

// Endpoint untuk jalankan kode bot
app.post('/run', express.json({ limit: '2mb' }), (req, res) => {
  const code = req.body.code;

  if (!code) {
    console.warn('⚠️ Tidak ada kode yang dikirim di body!');
    return res.status(400).json({ error: 'Code is required in the body.' });
  }

  const filePath = path.join(__dirname, 'icebot.js');
  console.log(`📄 Menyimpan file bot ke: ${filePath}`);

  fs.writeFile(filePath, code, (err) => {
    if (err) {
      console.error('❌ Gagal menulis file:', err);
      return res.status(500).json({ error: 'Failed to write code file.' });
    }

    // Fungsi untuk jalankan bot baru
    const runBot = () => {
      console.log('✅ File berhasil disimpan! Menjalankan bot baru...');

      currentBotProcess = exec(`node ${filePath}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Error saat menjalankan bot:\n${error.message}`);
          return;
        }
        if (stderr) {
          console.warn(`⚠️ stderr:\n${stderr}`);
        }
        if (stdout) {
          console.log(`📤 stdout:\n${stdout}`);
        }
      });

      console.log('🤖 Bot baru sedang berjalan...');
      res.json({ message: '✅ Bot started successfully (with previous process terminated).' });
    };

    // Kalau ada proses lama, hentikan dan tunggu selesai
    if (currentBotProcess) {
      console.log('🛑 Menghentikan bot sebelumnya...');
      currentBotProcess.on('exit', (code, signal) => {
        console.log(`🔴 Bot sebelumnya selesai dengan code ${code}, signal ${signal}`);
        runBot();  // jalankan proses baru setelah proses lama benar-benar selesai
      });
      currentBotProcess.kill();
    } else {
      // Kalau belum ada proses lama, langsung jalankan
      runBot();
    }
  });
});


// Jalankan server
app.listen(PORT, () => {
  console.log('🚀=====================================');
  console.log(`✅ Server siap di: http://localhost:${PORT}`);
  console.log('🟢 Menunggu permintaan...');
  console.log('🚀=====================================');
});
