/**
 * @callback Callable
 * @param {...any} args
 * @return {any}
 */
/**
 * @callback ErrorHandler
 * @param {unknown} err
 * @param {...any} args
 * @return {string|void}
 */
/**
 * @param {Callable} func
 * @param {Callable|null} [fallback]
 * @param {ErrorHandler} handler
 * @return any
 */
export function inErrorBoundary(func, fallback, handler = handleError) {
	let result;
	try {
		result = func();
	} catch (err) {
		handler(err);
		if (fallback) {
			try {
				result = fallback();
			} catch (err) {
				handler(err);
			}
		}
	}
	return result;
}

/** @type ErrorHandler */
export function handleError(err, ...params) {
	const errMsg =
		err instanceof Error
			? err.message
			: typeof err === 'string' && err.length
				? err
				: 'unknown error';
	const toConsole = params?.[0] || true;
	if (toConsole) console.error(`Error's occurred: ${errMsg}`);
	return errMsg;
}
