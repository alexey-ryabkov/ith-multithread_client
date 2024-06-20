import { parentPort, workerData } from 'worker_threads';
import axios from 'axios';

(async () => {
  const { url, speedLimit } = workerData;
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  const totalSize = parseInt(response.headers['content-length'], 10);

  // eslint-disable-next-line no-unused-vars
  let downloadedSize = 0;
  response.data.on('data', (chunk) => {
    downloadedSize += chunk.length;
    parentPort.postMessage({ chunkSize: chunk.length, totalSize });
    // TODO по завершении нужно передавать данные! 

    // XXX wtf
    // Simulate speed limit
    if (speedLimit > 0) {
        setTimeout(() => {}, 1000 / speedLimit * chunk.length);
    }
  });

  response.data.on('end', () => {
      parentPort.close();
  });
})();
