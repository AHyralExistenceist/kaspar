const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = 3000;

app.use(express.static(__dirname));
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'notebook-data.json');

async function ensureDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(DATA_FILE, JSON.stringify({}, null, 2), 'utf8');
        }
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/pages', async (req, res) => {
    try {
        await ensureDataFile();
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const parsed = JSON.parse(data);
        res.json(parsed || {});
    } catch (error) {
        console.error('Error reading data:', error);
        res.json({});
    }
});

app.post('/api/pages', async (req, res) => {
    try {
        await ensureDataFile();
        const dataToSave = req.body || {};
        await fs.writeFile(DATA_FILE, JSON.stringify(dataToSave, null, 2), 'utf8');
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

app.listen(PORT, async () => {
    await ensureDataFile();
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    console.log(`브라우저에서 http://localhost:${PORT} 를 열어주세요.`);
});

