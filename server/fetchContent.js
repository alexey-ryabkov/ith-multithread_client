import fs from 'fs';
import axios from 'axios';
import { Worker } from 'worker_threads';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { itemsSum } from '../src/lib/utils/index.js';
import { handleError, inErrorBoundary } from '../src/lib/utils/errorsHandling.js';
// eslint-disable-next-line no-unused-vars -- import WebSocket just for right type for linter
import WebSocket from 'ws';

const __dirname = dirname(fileURLToPath(import.meta.url));

const {
	maxThreads: threadsCnt = 1,
	speedLimit = 0,
	speedLimits = []
} = inErrorBoundary(
	() => JSON.parse(fs.readFileSync(resolve(__dirname, './config.json'), 'utf-8')),
	() => ({}),
	(err) => handleError(err)
);
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
		// if no limit is set for thread - part of total limit is taken
		const treadSpeedLimit =
			speedLimits?.[threadNum] ??
			(Math.ceil((speedLimit - itemsSum(speedLimits)) / (threadsCnt - speedLimits.length)) || 0);
		const worker = new Worker(resolve(__dirname, './downloadWorker.js'), {
			workerData: { url, speedLimit: treadSpeedLimit, threadNum, range }
		});

		worker.on('message', (data) => {
			const { chunk, chunkSize, error } = data;
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
			} else if (error) {
				handleErrorAndSend2client(error, ws, { threadNum });
			}
		});
		worker.on('error', (error) => handleErrorAndSend2client(error, ws));
		worker.on('exit', (code) => {
			if (code) {
				handleErrorAndSend2client(`Server worker stopped, exit code ${code}`, ws);
			}
		});
	}
}
/**
 * @param {unknown} err
 * @param {WebSocket} ws
 * @param  {Object} [additional]
 */
export function handleErrorAndSend2client(err, ws, additional) {
	ws.send(JSON.stringify({ error: err instanceof Error ? err.message : err, ...additional }));
	handleError(err);
}
