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
/**
 * @param {unknown} obj
 * @returns {boolean}
 */
function isObject(obj) {
	return obj && typeof obj === 'object' && !Array.isArray(obj);
}
/**
 * @param {Object} target
 * @param {Object} source
 * @returns {Object}
 */
export function deepMerge(target, ...sources) {
	if (!sources.length) return target;
	const source = sources.shift();
	if (isObject(target) && isObject(source)) {
		for (const key in source) {
			if (isObject(source[key])) {
				if (!target[key]) Object.assign(target, { [key]: {} });
				deepMerge(target[key], source[key]);
			} else if (Array.isArray(source[key])) {
				if (!target[key]) Object.assign(target, { [key]: [] });
				target[key] = Array.from(new Set([...target[key], ...source[key]]));
			} else {
				Object.assign(target, { [key]: source[key] });
			}
		}
	}
	return deepMerge(target, ...sources);
}
