import fs from 'fs';
import { Worker } from 'worker_threads';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
let threads, speedLimit;
try {
  ({ maxThreads: threads, speedLimit } = JSON.parse(fs.readFileSync(resolve(__dirname, './config.json'), 'utf-8')));
} catch (e) {
  console.error(e);
}

/**
 * @param {string} url
 * @param {WebSocket} ws
 */
export default function fetchContent(url, ws) {
	let progress = 0;

	for (let i = 0; i < threads; i++) {
		const worker = new Worker(resolve(__dirname, './downloadWorker.js'), { workerData: { url, speedLimit } });

		worker.on('message', (data) => {
      const { chunkSize, totalSize } = data;
			progress += chunkSize;
			ws.send(JSON.stringify({ progress, totalSize, threads }));
      // TODO по завершении нужно отправлять данные! 
		});

		worker.on('error', (error) => {
			ws.send(JSON.stringify({ error: error.message }));
		});

		worker.on('exit', (code) => {
			ws.send(JSON.stringify({ error: `Server worker stopped, exit code ${code}` }));
		});
	}
}
