import { parentPort, workerData } from 'worker_threads';
import axios from 'axios';

(async () => {
	const {
		url,
		speedLimit,
		threadNum,
		range: { from, to }
	} = workerData;

	console.log(`load thread ${threadNum}, range ${from}-${to}`);

	const response = await axios({
		url,
		method: 'GET',
		responseType: 'stream',
		headers: { Range: `bytes=${from}-${to}` }
	});

	let downloadedSize = 0;
	let loadStartTime = performance.now();
	let loadEndTime = loadStartTime;

	response.data.on('data', (/** @type {Uint8Array} */ chunk) => {
		loadEndTime = performance.now();
		const loadElapsedTime = loadEndTime - loadStartTime;
		loadStartTime = loadEndTime;

		const chunkSize = chunk.length;
		downloadedSize += chunkSize;

		parentPort.postMessage({ threadNum, chunkSize, downloadedSize });

		const loadSleepTime = speedLimit > 0 ? (1000 / speedLimit) * chunkSize - loadElapsedTime : 0;
		if (loadSleepTime > 0) {
			response.data.pause();
			setTimeout(() => response.data.resume(), loadSleepTime);
		}

		console.log(
			`in thread ${threadNum}: chunk ${chunkSize}, downloaded ${downloadedSize}, sleep time ${loadSleepTime}, elapsed time ${loadElapsedTime}`
		);

		// TODO по завершении передавать данные
	});
	response.data.on('end', () => {
		parentPort.close();
	});
	response.data.on('error', (err) => {
		parentPort.postMessage({ threadNum, error: err?.message || err });
	});
})();
