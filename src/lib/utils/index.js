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
/**
 * @param {Blob} blob 
 * @returns 
 */
export async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
  });
}
/**
 * 
 * @param {string} base64 
 * @param {string} type 
 * @returns Blob
 */
export function base64ToBlob(base64, type) {
	const byteCharacters = atob(base64.split(',')[1]);
	const byteNumbers = new Array(byteCharacters.length);
  
	for (let i = 0; i < byteCharacters.length; i++) {
		byteNumbers[i] = byteCharacters.charCodeAt(i);
	}
	const byteArray = new Uint8Array(byteNumbers);
	return new Blob([byteArray], { type });
}
