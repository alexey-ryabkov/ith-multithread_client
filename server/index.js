import fs from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import fetchContent, { handleErrorAndSend2client } from './fetchContent.js';
import { inErrorBoundary } from '../src/lib/utils/errorsHandling.js';
// eslint-disable-next-line no-unused-vars -- import WebSocket just for right type for linter
import { WebSocketServer, WebSocket } from 'ws';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type string */
const urlsByKeywords = inErrorBoundary(
	() => JSON.parse(fs.readFileSync(resolve(__dirname, './urls_by_keywords.json'), 'utf-8')),
	() => []
);
const server = new WebSocketServer({ port: 8080 });
server.on('connection', (/** @type WebSocket */ ws) => {
	ws.on('message', (/** @type string */ message) => {
		const { keyword, url } = inErrorBoundary(
			() => JSON.parse(message),
			() => ({}),
			() => handleErrorAndSend2client('Keywords list is incorrect', ws)
		);
		if (keyword) {
			const urls = urlsByKeywords[keyword] || [];
			ws.send(JSON.stringify({ urls }));
		} else if (url) {
			inErrorBoundary(
				() => fetchContent(url, ws),
				null,
				(err) => handleErrorAndSend2client(err, ws)
			);
		} else {
			handleErrorAndSend2client('Incorrect query recieved', ws);
		}
	});
	ws.on('error', (err) => console.error(err.message));
});
