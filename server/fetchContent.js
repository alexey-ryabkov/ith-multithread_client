import fs from 'fs';
import axios from 'axios';
import { Worker } from 'worker_threads';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
let threadsCnt, speedLimit;
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

	console.log(`total size ${totalSize}, thread chunk size ${threadSize}`);

	let progress = 0;
	for (let threadNum = 0; threadNum < threadsCnt; threadNum++) {
		const isLastThread = threadNum === threadsCnt - 1;
		const range = {
			from: threadNum * threadSize,
			to: isLastThread ? totalSize - 1 : (threadNum + 1) * threadSize - 1
		};
		const worker = new Worker(resolve(__dirname, './downloadWorker.js'), {
			workerData: { url, speedLimit: Math.ceil(speedLimit / threadsCnt), threadNum, range }
			// execArgv: ['--inspect-brk=9230']
		});

		worker.on('message', (data) => {
			const { chunkSize, downloadedSize, completed = false, error: err = null } = data;
			if (chunkSize) {
				progress += chunkSize;
				// TODO по этому определим complete
				downloadedSize;
				ws.send(
					JSON.stringify({
						progress,
						totalSize,
						threads: threadsCnt
					})
				);
			} else if (completed) {
				// TODO по завершении нужно отправлять данные!
			} else if (err) {
				ws.send(typeof err !== 'string' ? JSON.stringify({ error: err?.message || err }) : err);
			}
		});
		worker.on('error', (err) => {
			ws.send(typeof err !== 'string' ? JSON.stringify({ error: err?.message || err }) : err);
		});
		worker.on('exit', (code) => {
			if (code) {
				ws.send(JSON.stringify({ error: `Server worker stopped, exit code ${code}` }));
			}
		});
	}
}
