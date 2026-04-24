const fs = require('fs');
const path = require('path');

const deviceDirectoryPath = path.join(
  __dirname,
  '..',
  '..',
  'storage',
  'application',
  'device_directory.json'
);

function loadDevices() {
  try {
    if (!fs.existsSync(deviceDirectoryPath)) {
      return [];
    }

    const raw = fs.readFileSync(deviceDirectoryPath, 'utf8');
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[MQTT][Heartbeat] Failed to load device directory:', error);
    return [];
  }
}

function saveDevices(devices) {
  fs.writeFileSync(deviceDirectoryPath, JSON.stringify(devices, null, 2), 'utf8');
}

function formatLastSeen(date) {
  const pad = (value) => String(value).padStart(2, '0');

  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} - ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function normalizeDeviceId(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const id = String(value).trim();
  return id.length ? id.toUpperCase() : null;
}

function getDeviceIdFromTopic(topic) {
  if (!topic || typeof topic !== 'string') {
    return null;
  }

  const match = topic.match(/^track\/device\/([^/]+)\/status$/);
  return match ? match[1] : null;
}

function normalizePayload(rawPayload, topic) {
  const payload = rawPayload && typeof rawPayload === 'object' ? { ...rawPayload } : {};
  const topicDeviceId = getDeviceIdFromTopic(topic);

  if (!payload.device_id) {
    payload.device_id = payload.deviceId || topicDeviceId || null;
  }

  payload.device_id = normalizeDeviceId(payload.device_id);

  if (payload.ip_address === undefined) {
    payload.ip_address = payload.ipAddress !== undefined ? payload.ipAddress : payload.ip;
  }

  if (payload.uptime_seconds === undefined) {
    payload.uptime_seconds = payload.uptimeSeconds !== undefined ? payload.uptimeSeconds : payload.uptime;
  }

  if (payload.wifi_rssi === undefined) {
    payload.wifi_rssi = payload.wifiRssi !== undefined ? payload.wifiRssi : payload.rssi;
  }

  if (payload.free_heap === undefined) {
    payload.free_heap = payload.freeHeap !== undefined ? payload.freeHeap : payload.heap;
  }

  if (payload.online === undefined) {
    payload.online = payload.isOnline !== undefined ? payload.isOnline : payload.is_online;
  }

  delete payload.deviceId;
  delete payload.ipAddress;
  delete payload.uptimeSeconds;
  delete payload.uptime;
  delete payload.wifiRssi;
  delete payload.rssi;
  delete payload.freeHeap;
  delete payload.heap;
  delete payload.isOnline;
  delete payload.is_online;

  return payload;
}

function upsertHeartbeat(payload) {
  const devices = loadDevices();
  const incomingDeviceId = normalizeDeviceId(payload.device_id);
  const index = devices.findIndex(
    (device) => normalizeDeviceId(device.device_id || device.deviceId) === incomingDeviceId
  );
  const now = new Date();
  const { device_id: _ignoredDeviceId, alias: _ignoredAlias, ...payloadWithoutProtectedFields } = payload;

  let updatedDevice;

  if (index >= 0) {
    const existingDevice = devices[index];

    updatedDevice = {
      ...existingDevice,
      ...payloadWithoutProtectedFields,
      alias: existingDevice.alias || 'Unknown device',
      device_id: normalizeDeviceId(existingDevice.device_id || existingDevice.deviceId),
      last_seen: formatLastSeen(now)
    };

    devices[index] = updatedDevice;
  } else {
    updatedDevice = {
      ...payloadWithoutProtectedFields,
      alias: payload.alias || 'Unknown device',
      device_id: incomingDeviceId,
      last_seen: formatLastSeen(now)
    };

    devices.push(updatedDevice);
  }

  saveDevices(devices);
  return updatedDevice;
}

function handleHeartbeat(topicOrMessage, maybeMessage) {
  let payload;
  const message = maybeMessage || topicOrMessage;
  const topic = maybeMessage ? topicOrMessage : null;

  try {
    payload = JSON.parse(message.toString());
  } catch (error) {
    console.error('[MQTT][Heartbeat] Invalid JSON:', error);
    return null;
  }

  payload = normalizePayload(payload, topic);

  if (!payload.device_id) {
    console.error('[MQTT][Heartbeat] Missing device_id');
    return null;
  }

  const updatedDevice = upsertHeartbeat(payload);
  console.log('[MQTT][Heartbeat] Updated device:', updatedDevice);
  return updatedDevice;
}

module.exports = {
  handleHeartbeat,
  upsertHeartbeat
};