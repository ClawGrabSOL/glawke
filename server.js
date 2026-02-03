const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'submissions.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Get all submissions
app.get('/api/submissions', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json(data);
});

// Submit a new CA
app.post('/api/submit', (req, res) => {
    const { ca } = req.body;
    
    if (!ca || !ca.trim()) {
        return res.status(400).json({ error: 'CA is required' });
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    
    const submission = {
        id: Date.now(),
        ca: ca.trim(),
        time: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }),
        timestamp: Date.now()
    };

    data.unshift(submission);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    
    res.json({ success: true, submission });
});

// Server-Sent Events for live updates
app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendData = () => {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Send initial data
    sendData();

    // Check for updates every second
    const interval = setInterval(sendData, 1000);

    req.on('close', () => {
        clearInterval(interval);
    });
});

app.listen(PORT, () => {
    console.log(`🟢 Glawke server running at http://localhost:${PORT}`);
});
