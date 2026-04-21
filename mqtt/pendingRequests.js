const pendingRequests = new Map();

function createPendingRequest(requestId, timeoutMs) {
	return new Promise((resolve, reject) => {
		const timeoutId = setTimeout(() => {
			pendingRequests.delete(requestId);
			reject(new Error(`MQTT request timed out: ${requestId}`));
		}, timeoutMs);

		pendingRequests.set(requestId, {
			resolve,
			reject,
			timeoutId
		});
	});
}

function resolvePendingRequest(requestId, payload) {
	const pending = pendingRequests.get(requestId);

	if (!pending) {
		return false;
	}

	clearTimeout(pending.timeoutId);
	pending.resolve(payload);
	pendingRequests.delete(requestId);
	return true;
}

function rejectPendingRequest(requestId, error) {
	const pending = pendingRequests.get(requestId);

	if (!pending) {
		return false;
	}

	clearTimeout(pending.timeoutId);
	pending.reject(error);
	pendingRequests.delete(requestId);
	return true;
}

function getPendingRequests() {
	return pendingRequests;
}

module.exports = {
	createPendingRequest,
	resolvePendingRequest,
	rejectPendingRequest,
	getPendingRequests
};
