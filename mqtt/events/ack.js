function handleAck(message, pendingRequests) {
  let payload;

  try {
    payload = JSON.parse(message.toString());
  } catch (error) {
    console.error('[MQTT][ACK] Invalid JSON:', error);
    return null;
  }

  if (!payload.request_id) {
    console.error('[MQTT][ACK] Missing request_id');
    return null;
  }

  const pending = pendingRequests.get(payload.request_id);

  if (!pending) {
    console.warn('[MQTT][ACK] No pending request found for:', payload.request_id);
    return payload;
  }

  clearTimeout(pending.timeoutId);
  pending.resolve(payload);
  pendingRequests.delete(payload.request_id);

  console.log('[MQTT][ACK] Success message processed for:', payload.request_id);
  return payload;
}

module.exports = {
  handleAck
};