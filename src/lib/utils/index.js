/**
 * @param {number} bytes 
 * @param {number} decimals 
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['bytes', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  let formated = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  let measure = sizes[i];

  if (isNaN(formated)) {
    formated = 'unknown';
  }
  if (!measure || !formated) {
    measure = '';
  }
  return `${formated}${measure}`;
}
