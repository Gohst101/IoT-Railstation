function buildTopics(deviceId) {
	const id = String(deviceId || '').trim();

	return {
		trigger: `track/device/${id}/trigger`,
		status: `track/device/${id}/status`,
		ack: `track/device/${id}/ack`,
		error: `track/device/${id}/error`
	};
}

function buildGlobalTopics() {
	return {
		status: 'track/device/+/status',
		ack: 'track/device/+/ack',
		error: 'track/device/+/error'
	};
}

module.exports = {
	buildTopics,
	buildGlobalTopics
};
