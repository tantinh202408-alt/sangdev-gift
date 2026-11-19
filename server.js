const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');
const { execFile } = require('child_process');

const os = require('os');
const PORT = process.env.PORT || 3000;
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);

const BUNDLED_DATA_DIR = path.join(__dirname, 'data');
const BUNDLED_UPLOADS_DIR = path.join(__dirname, 'uploads');

const WRITE_DATA_DIR = isServerless ? path.join(os.tmpdir(), 'sangdev-data') : BUNDLED_DATA_DIR;
const WRITE_UPLOADS_DIR = isServerless ? path.join(os.tmpdir(), 'sangdev-uploads') : BUNDLED_UPLOADS_DIR;

const DATA_DIR = BUNDLED_DATA_DIR;
const UPLOADS_DIR = WRITE_UPLOADS_DIR;

const TEMPLATE_FILE = path.join(__dirname, 'index_template.html');

try {
    if (!fs.existsSync(WRITE_DATA_DIR)) fs.mkdirSync(WRITE_DATA_DIR, { recursive: true });
    if (!fs.existsSync(WRITE_UPLOADS_DIR)) fs.mkdirSync(WRITE_UPLOADS_DIR, { recursive: true });
} catch (e) {
    console.warn('Could not initialize write dirs:', e.message);
}

const MEM_GIFTS = new Map();

function findGiftFile(code) {
    const filename = `${code}.json`;
    const tmpPath = path.join(WRITE_DATA_DIR, filename);
    if (fs.existsSync(tmpPath)) return tmpPath;
    const bundledPath = path.join(BUNDLED_DATA_DIR, filename);
    if (fs.existsSync(bundledPath)) return bundledPath;
    return null;
}

function findUploadFile(filename) {
    const tmpPath = path.join(WRITE_UPLOADS_DIR, filename);
    if (fs.existsSync(tmpPath)) return tmpPath;
    const bundledPath = path.join(BUNDLED_UPLOADS_DIR, filename);
    if (fs.existsSync(bundledPath)) return bundledPath;
    return null;
}

// MIME types dictionary
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=utf-8'
};

// Generate random uppercase alphanumeric code
function generateCode(length = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Parse request body with 50MB limit
function parseJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            if (body.length > 50 * 1024 * 1024) { // 50MB limit
                req.destroy();
                reject(new Error('Payload quá lớn (giới hạn 50MB)'));
            }
        });
        req.on('end', () => {
            try {
                const parsed = body ? JSON.parse(body) : {};
                resolve(parsed);
            } catch (err) {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

// Download image from remote URL and save to uploads
function downloadRemoteImage(remoteUrl) {
    return new Promise((resolve, reject) => {
        const client = remoteUrl.startsWith('https') ? https : http;
        client.get(remoteUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return resolve(downloadRemoteImage(res.headers.location));
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Tải ảnh thất bại, mã HTTP: ${res.statusCode}`));
            }

            const contentType = res.headers['content-type'] || 'image/jpeg';
            let ext = '.jpg';
            if (contentType.includes('png')) ext = '.png';
            else if (contentType.includes('webp')) ext = '.webp';
            else if (contentType.includes('gif')) ext = '.gif';
            else if (contentType.includes('svg')) ext = '.svg';

            const fileName = `${Date.now()}_remote${ext}`;
            const filePath = path.join(WRITE_UPLOADS_DIR, fileName);
            const fileStream = fs.createWriteStream(filePath);

            res.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close(() => resolve({ fileName, ext, size: fs.statSync(filePath).size }));
            });
            fileStream.on('error', reject);
        }).on('error', reject);
    });
}

// Serve static file with Range support for audio/media
function serveStaticFile(req, res, filePath) {
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const totalSize = stats.size;
        const range = req.headers.range;

        // Support audio Range requests
        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

            if (start >= totalSize || end >= totalSize) {
                res.writeHead(416, { 'Content-Range': `bytes */${totalSize}` });
                return res.end();
            }

            const chunkSize = (end - start) + 1;
            const stream = fs.createReadStream(filePath, { start, end });

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });

            stream.pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': totalSize,
                'Content-Type': contentType,
                'Accept-Ranges': 'bytes',
                'Access-Control-Allow-Origin': '*'
            });

            fs.createReadStream(filePath).pipe(res);
        }
    });
}

// Render Gift Page with specified code
function renderGiftPage(res, code) {
    const safeCode = (code || 'PVB33A62').toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    let giftData = MEM_GIFTS.get(safeCode);

    if (!giftData) {
        const dataPath = findGiftFile(safeCode);
        if (dataPath) {
            try {
                giftData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
            } catch (e) {
                console.error('Error reading gift file:', e);
            }
        }
    }

    // Fallback to PVB33A62 if not found
    if (!giftData) {
        giftData = MEM_GIFTS.get('PVB33A62');
        if (!giftData) {
            const fallbackPath = findGiftFile('PVB33A62');
            if (fallbackPath) {
                try {
                    giftData = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
                } catch (e) {}
            }
        }
    }
    if (!giftData) {
        giftData = { config: {}, music: '' };
    }

    fs.readFile(TEMPLATE_FILE, 'utf-8', (err, template) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('Internal Server Error: Missing index_template.html');
        }

        const rendered = template.replace('/*__GIFT_DATA__*/', JSON.stringify(giftData));
        res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache'
        });
        res.end(rendered);
    });
}

const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    const host = req.headers.host || `localhost:${PORT}`;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const baseUrl = `${protocol}://${host}`;

    const parsedUrl = new URL(req.url, baseUrl);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // ==========================================
    // API ROUTES
    // ==========================================

    // POST /api/upload: Upload image/audio file (Base64) -> Returns URL link
    if (pathname === '/api/upload' && req.method === 'POST') {
        try {
            const body = await parseJsonBody(req);
            const { name, data } = body;
            if (!data || !data.includes('base64,')) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({ success: false, error: 'Dữ liệu base64 không hợp lệ' }));
            }

            const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({ success: false, error: 'Định dạng base64 không đúng' }));
            }

            const mime = matches[1];
            let ext = '.jpg';
            if (mime === 'image/png') ext = '.png';
            else if (mime === 'image/webp') ext = '.webp';
            else if (mime === 'image/gif') ext = '.gif';
            else if (mime === 'image/svg+xml') ext = '.svg';
            else if (mime === 'audio/mpeg' || mime === 'audio/mp3') ext = '.mp3';
            else if (mime === 'audio/wav' || mime === 'audio/x-wav') ext = '.wav';
            else if (mime === 'audio/ogg') ext = '.ogg';
            else if (mime === 'audio/mp4' || mime === 'audio/x-m4a' || mime === 'audio/m4a') ext = '.m4a';

            const parsedExt = path.extname(name || '').toLowerCase();
            if (['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(parsedExt)) {
                ext = parsedExt;
            }

            const cleanBaseName = (name ? path.parse(name).name : 'media')
                .replace(/[^a-zA-Z0-9_-]/g, '_')
                .substring(0, 30);
            const fileName = `${Date.now()}_${cleanBaseName}${ext}`;
            const filePath = path.join(WRITE_UPLOADS_DIR, fileName);

            let buffer = null;
            try {
                buffer = Buffer.from(matches[2], 'base64');
                fs.writeFileSync(filePath, buffer);
            } catch (err) {
                console.warn('Upload write error in serverless:', err.message);
            }

            const relativeUrl = (buffer && fs.existsSync(filePath)) ? `/uploads/${fileName}` : data;
            const fullUrl = `${baseUrl}${relativeUrl}`;

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                success: true,
                url: relativeUrl,
                fullUrl: fullUrl,
                fileName: fileName
            }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({ success: false, error: err.message }));
        }
    }

    // POST /api/upload-url: Import image from web URL -> Returns local stored link
    if (pathname === '/api/upload-url' && req.method === 'POST') {
        try {
            const body = await parseJsonBody(req);
            const imageUrl = (body.url || '').trim();
            if (!imageUrl || !imageUrl.startsWith('http')) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({ success: false, error: 'URL ảnh không hợp lệ' }));
            }

            const result = await downloadRemoteImage(imageUrl);
            const relativeUrl = `/uploads/${result.fileName}`;
            const fullUrl = `${baseUrl}${relativeUrl}`;

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                success: true,
                url: relativeUrl,
                fullUrl: fullUrl,
                fileName: result.fileName
            }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({ success: false, error: err.message }));
        }
    }

    // POST /api/convert-audio: Extract & Convert YouTube or TikTok audio to MP3
    if (pathname === '/api/convert-audio' && req.method === 'POST') {
        try {
            const body = await parseJsonBody(req);
            const mediaUrl = (body.url || '').trim();
            if (!mediaUrl || !mediaUrl.startsWith('http')) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({ success: false, error: 'Vui lòng cung cấp link YouTube hoặc TikTok hợp lệ' }));
            }

            console.log(`[Audio Converter] Đang trích xuất nhạc từ: ${mediaUrl}`);

            const args = [
                '--no-playlist',
                '--js-runtimes', 'node',
                '-x',
                '--audio-format', 'mp3',
                '--max-filesize', '60M',
                '--print', 'after_move:filepath',
                '--print', 'title',
                '-o', path.join(UPLOADS_DIR, 'audio_%(id)s.%(ext)s'),
                mediaUrl
            ];

            execFile('yt-dlp', args, { timeout: 90000 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('[Audio Converter] Lỗi:', error.message);
                    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                    return res.end(JSON.stringify({
                        success: false,
                        error: 'Không thể trích xuất nhạc từ link này: ' + (stderr || error.message).substring(0, 200)
                    }));
                }

                const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
                let filePath = '';
                let title = 'Nhạc từ video';

                for (const line of lines) {
                    if (line.includes('uploads') && line.endsWith('.mp3')) {
                        filePath = line.trim();
                    } else if (!filePath && line.trim()) {
                        title = line.trim();
                    }
                }

                if (!filePath) {
                    const files = fs.readdirSync(UPLOADS_DIR).filter(f => f.startsWith('audio_') && f.endsWith('.mp3'));
                    if (files.length > 0) {
                        filePath = path.join(UPLOADS_DIR, files[files.length - 1]);
                    }
                }

                const fileName = path.basename(filePath);
                const relativeUrl = `/uploads/${fileName}`;
                const fullUrl = `${baseUrl}${relativeUrl}`;

                console.log(`[Audio Converter] Thành công: ${fileName} (${title})`);

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({
                    success: true,
                    url: relativeUrl,
                    fullUrl: fullUrl,
                    title: title,
                    fileName: fileName
                }));
            });
            return;
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({ success: false, error: err.message }));
        }
    }

    // POST /api/gifts: Create or update a gift with code
    if (pathname === '/api/gifts' && req.method === 'POST') {
        try {
            const body = await parseJsonBody(req);
            let code = (body.code || '').trim().toUpperCase();
            if (!code) {
                code = generateCode(8);
            }
            code = code.replace(/[^A-Z0-9_-]/g, '');

            const config = body.config || {};
            const music = body.music || config.bgMusic || './app/assets/music/givemeyourforever.mp3';

            const giftPayload = {
                code,
                createdAt: new Date().toISOString(),
                config,
                music
            };

            MEM_GIFTS.set(code, giftPayload);

            const targetFile = path.join(WRITE_DATA_DIR, `${code}.json`);
            try {
                fs.writeFileSync(targetFile, JSON.stringify(giftPayload, null, 2), 'utf-8');
            } catch (writeErr) {
                console.warn('Could not write gift to disk in serverless:', writeErr.message);
            }

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                success: true,
                code,
                giftUrl: `/gift?code=${code}`,
                shortUrl: `/g/${code}`,
                data: giftPayload
            }));
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({ success: false, error: err.message }));
        }
    }

    // GET /api/gifts: List all gifts
    if (pathname === '/api/gifts' && req.method === 'GET') {
        try {
            const giftsMap = new Map();
            const scanDir = (dir) => {
                if (fs.existsSync(dir)) {
                    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
                    for (const file of files) {
                        try {
                            const code = path.basename(file, '.json');
                            if (!giftsMap.has(code)) {
                                const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
                                giftsMap.set(code, {
                                    code,
                                    title: content.config?.appTitle || 'Món Quà Nhỏ',
                                    recipient: content.config?.recipientName || 'Người Thương',
                                    createdAt: content.createdAt || null
                                });
                            }
                        } catch (e) {}
                    }
                }
            };
            scanDir(BUNDLED_DATA_DIR);
            scanDir(WRITE_DATA_DIR);
            for (const [code, content] of MEM_GIFTS.entries()) {
                if (!giftsMap.has(code)) {
                    giftsMap.set(code, {
                        code,
                        title: content.config?.appTitle || 'Món Quà Nhỏ',
                        recipient: content.config?.recipientName || 'Người Thương',
                        createdAt: content.createdAt || null
                    });
                }
            }
            const gifts = Array.from(giftsMap.values());
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({ success: true, count: gifts.length, gifts }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({ success: false, error: err.message }));
        }
    }

    // GET /api/gifts/:code: Get single gift data
    const apiCodeMatch = pathname.match(/^\/api\/gifts\/([A-Za-z0-9_-]+)$/);
    if (apiCodeMatch && req.method === 'GET') {
        const code = apiCodeMatch[1].toUpperCase();
        if (MEM_GIFTS.has(code)) {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({ success: true, code, data: MEM_GIFTS.get(code) }));
        }
        const targetFile = findGiftFile(code);
        if (targetFile) {
            try {
                const data = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({ success: true, code, data }));
            } catch (e) {}
        }
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, error: `Gift code ${code} not found` }));
    }

    // ==========================================
    // GIFT VIEW ROUTES (Clean URLs & Short Links)
    // ==========================================

    // 1. Short Share Link: /g/:code (e.g. /g/PVB33A62 or /g/SANG88)
    const shortLinkMatch = pathname.match(/^\/g\/([A-Za-z0-9_-]+)$/);
    if (shortLinkMatch) {
        const code = shortLinkMatch[1];
        return renderGiftPage(res, code);
    }

    // 2. Query routes: /gift?code=XYZ or /index.html?code=XYZ
    if (
        pathname === '/gift' ||
        pathname === '/gift.php' ||
        pathname === '/mon-qua-nho-2010/gift.php' ||
        (pathname === '/index.html' && parsedUrl.searchParams.has('code'))
    ) {
        const code = parsedUrl.searchParams.get('code') || 'PVB33A62';
        return renderGiftPage(res, code);
    }

    // Default route / -> If ?code is present, render gift; otherwise serve create.html
    if (pathname === '/' || pathname === '/create.html' || pathname === '/create') {
        if (pathname === '/' && parsedUrl.searchParams.has('code')) {
            const code = parsedUrl.searchParams.get('code');
            return renderGiftPage(res, code);
        }
        return serveStaticFile(req, res, path.join(__dirname, 'create.html'));
    }

    // Check /data/:code.json dynamic or memory lookup
    const dataMatch = pathname.match(/^\/data\/([A-Za-z0-9_-]+)\.json$/);
    if (dataMatch && req.method === 'GET') {
        const code = dataMatch[1].toUpperCase();
        if (MEM_GIFTS.has(code)) {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify(MEM_GIFTS.get(code)));
        }
        const file = findGiftFile(code);
        if (file) {
            return serveStaticFile(req, res, file);
        }
    }

    // Check /uploads/ dynamic lookup
    const uploadMatch = pathname.match(/^\/uploads\/(.+)$/);
    if (uploadMatch && req.method === 'GET') {
        const file = findUploadFile(uploadMatch[1]);
        if (file) {
            return serveStaticFile(req, res, file);
        }
    }

    // ==========================================
    // STATIC ASSETS & UPLOADS
    // ==========================================
    const safePath = path.normalize(path.join(__dirname, pathname)).replace(/^(\.\.[\/\\])+/, '');

    if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
        return serveStaticFile(req, res, safePath);
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 Không tìm thấy trang</h1><p><a href="/create.html">Quay về trang tạo quà tặng</a></p>');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================`);
    console.log(`🎁 sangdev Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`✨ Trang tạo quà tặng: http://localhost:${PORT}/create.html`);
    console.log(`🎉 Quà mẫu gốc: http://localhost:${PORT}/gift.php?code=PVB33A62`);
    console.log(`📁 Thư mục lưu trữ ảnh & nhạc API: ${UPLOADS_DIR}`);
    console.log(`==================================================\n`);
});
