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

function upsertHeartbeat(payload) {
  const devices = loadDevices();
  const index = devices.findIndex((device) => device.device_id === payload.device_id);
  const now = new Date();

  const updatedDevice = {
    alias: index >= 0 && devices[index].alias ? devices[index].alias : 'Unknown device',
    device_id: payload.device_id,
    ip_address: payload.ip_address || '',
    version: payload.version || 'None',
    last_seen: formatLastSeen(now)
  };

  if (index >= 0) {
    devices[index] = {
      ...devices[index],
      ...updatedDevice
    };
  } else {
    devices.push(updatedDevice);
  }

  saveDevices(devices);
  return updatedDevice;
}

function handleHeartbeat(message) {
  let payload;

  try {
    payload = JSON.parse(message.toString());
  } catch (error) {
    console.error('[MQTT][Heartbeat] Invalid JSON:', error);
    return null;
  }

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