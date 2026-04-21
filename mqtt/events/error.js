function handleError(message, pendingRequests) {
  let payload;

  try {
    payload = JSON.parse(message.toString());
  } catch (error) {
    console.error('[MQTT][ERROR] Invalid JSON:', error);
    return null;
  }

  if (!payload.request_id) {
    console.error('[MQTT][ERROR] Missing request_id');
    return null;
  }

  const pending = pendingRequests.get(payload.request_id);

  if (pending) {
    clearTimeout(pending.timeoutId);
    pending.reject(new Error(payload.message || 'MQTT error message received'));
    pendingRequests.delete(payload.request_id);
  }

  console.error('[MQTT][ERROR] Error message received:', payload);
  return payload;
}

module.exports = {
  handleError
};