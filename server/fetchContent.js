import fs from 'fs';
import axios from 'axios';
import { Worker } from 'worker_threads';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
let threadsCnt = 1;
let speedLimit = 0;
try {
	({ maxThreads: threadsCnt, speedLimit } = JSON.parse(
		fs.readFileSync(resolve(__dirname, './config.json'), 'utf-8')
	));
} catch (e) {
	console.error(e);
}

/**
 * @param {string} url
 * @param {WebSocket} ws
 */
export default async function fetchContent(url, ws) {
	const response = await axios.head(url);
	const totalSize = parseInt(response.headers['content-length'], 10);
	const threadSize = Math.ceil(totalSize / threadsCnt);

	let progress = 0;
	for (let threadNum = 0; threadNum < threadsCnt; threadNum++) {
		const isLastThread = threadNum === threadsCnt - 1;
		const range = {
			from: threadNum * threadSize,
			to: isLastThread ? totalSize - 1 : (threadNum + 1) * threadSize - 1
		};
		const worker = new Worker(resolve(__dirname, './downloadWorker.js'), {
			workerData: { url, speedLimit: Math.ceil(speedLimit / threadsCnt), threadNum, range }
		});

		worker.on('message', (data) => {
			const { chunk, chunkSize, error: err = null } = data;
			if (chunkSize) {
				progress += chunkSize;
				ws.send(
					JSON.stringify({
						chunk,
						threadNum, 
						progress,
						totalSize,
						threads: threadsCnt
					})
				);
			} else if (err) {
				ws.send(err instanceof Error ? JSON.stringify({ error: err.message }) : err);
			}
		});
		worker.on('error', (err) => {
			ws.send(JSON.stringify({ error: err.message }));
		});
		worker.on('exit', (code) => {
			if (code) {
				ws.send(JSON.stringify({ error: `Server worker stopped, exit code ${code}` }));
			}
		});
	}
}
