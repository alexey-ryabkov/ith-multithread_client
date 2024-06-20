import fs from 'fs';
import { WebSocketServer } from 'ws';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import fetchContent from './fetchContent.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let urlsByKeywords;
try {
	urlsByKeywords = JSON.parse(fs.readFileSync(resolve(__dirname, './urls_by_keywords.json'), 'utf-8'));
} catch (e) {
	console.error(e);
}

const server = new WebSocketServer({ port: 8080 });
server.on('connection', (ws) => {
	ws.on('message', (message) => {
		// TODO JSON.parse в try? обработка ошибок на промисах?
		// TODO первым запросом список ключевых слов?
		const { keyword, url } = JSON.parse(message);
		if (keyword) {
			const urls = urlsByKeywords[keyword] || [];
			ws.send(JSON.stringify({ urls }));
		} else if (url) {
			fetchContent(url, ws);
		} else {
			ws.send(JSON.stringify({ error: 'Incorrect query recieved' }));
		}
	});
});
