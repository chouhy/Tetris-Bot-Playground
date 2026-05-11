#!/usr/bin/env node

/**
 * Simple test server for debug mode
 * Usage: node test-server.js [port]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.argv[2] || 8000;
const BASE_DIR = __dirname;

const server = http.createServer((req, res) => {
    // Parse URL
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;
    
    // Remove leading slash
    if (pathname === '/') {
        pathname = '/debug.html';
    }
    
    // Construct file path
    let filePath = path.join(BASE_DIR, pathname);
    
    // Security: prevent path traversal
    if (!filePath.startsWith(BASE_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }
    
    // Try to read file
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.error(`[404] Not Found: ${pathname}`);
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end(`404 Not Found: ${pathname}\n\nAvailable paths:\n  /debug.html\n  /src/debug.js\n  /src/debug-runner.js\n  /src/debug-analyzer.js`);
            } else if (err.code === 'EISDIR') {
                res.writeHead(301, { 'Location': pathname + '/' });
                res.end();
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error: ' + err.message);
            }
            return;
        }
        
        // Determine content type
        const ext = path.extname(filePath);
        let contentType = 'text/plain';
        if (ext === '.html') contentType = 'text/html';
        else if (ext === '.js') contentType = 'application/javascript';
        else if (ext === '.css') contentType = 'text/css';
        else if (ext === '.json') contentType = 'application/json';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
        console.log(`[200] ${req.method} ${pathname}`);
    });
});

server.listen(PORT, () => {
    console.log(`\n✅ Debug Server running at http://localhost:${PORT}`);
    console.log(`📂 Root directory: ${BASE_DIR}`);
    console.log(`\n📝 Available endpoints:`);
    console.log(`   http://localhost:${PORT}/debug.html`);
    console.log(`   http://localhost:${PORT}/src/debug.js`);
    console.log(`   http://localhost:${PORT}/src/debug-runner.js`);
    console.log(`   http://localhost:${PORT}/src/debug-analyzer.js`);
    console.log(`\n✨ Open http://localhost:${PORT}/debug.html in your browser\n`);
});

process.on('SIGINT', () => {
    console.log('\n\nServer stopped.');
    process.exit(0);
});
