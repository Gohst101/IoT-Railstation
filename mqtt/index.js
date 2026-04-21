const { buildTopics } = require('./topics');
const { publishSwitchCommand } = require('./commands/switch');
const { handleHeartbeat } = require('./events/heartbeat');
const { handleAck } = require('./events/ack');
const { handleError } = require('./events/error');
const { getPendingRequests } = require('./pendingRequests');
const { buildGlobalTopics } = require('./topics');

function initMqtt(client) {
  const topics = buildGlobalTopics();
  const pendingRequests = getPendingRequests();

  function subscribeToEventTopics() {
    client.subscribe([topics.status, topics.ack, topics.error], { qos: 0 }, (error) => {
      if (error) {
        console.error('[MQTT] Failed to subscribe:', error);
        return;
      }

      console.log('[MQTT] Subscribed to global device topics:', topics);
    });
  }

  client.on('connect', () => {
    console.log('[MQTT] Connected to broker');
    subscribeToEventTopics();
  });

  if (client.connected) {
    subscribeToEventTopics();
  }

  client.on('message', (topic, message) => {
    console.log(`[MQTT] Message received on ${topic}`);

    if (topic.endsWith('/status')) {
      handleHeartbeat(message);
      return;
    }

    if (topic.endsWith('/ack')) {
      handleAck(message, pendingRequests);
      return;
    }

    if (topic.endsWith('/error')) {
      handleError(message, pendingRequests);
      return;
    }

    console.log('[MQTT] Ignored message on unhandled topic:', topic);
  });

  client.on('error', (error) => {
    console.error('[MQTT] Client error:', error.message);
  });

  client.on('offline', () => {
    console.warn('[MQTT] Client went offline');
  });

  client.on('reconnect', () => {
    console.log('[MQTT] Reconnecting to broker...');
  });

  function getTopics(deviceId) {
    return buildTopics(deviceId);
  }

  function sendSwitchCommand(data) {
    if (!data || !data.deviceId) {
      throw new Error('deviceId is required to send a switch command');
    }

    const deviceTopics = buildTopics(data.deviceId);
    return publishSwitchCommand(client, deviceTopics, data);
  }

  return {
    topics,
    getTopics,
    sendSwitchCommand
  };
}

module.exports = {
  initMqtt
};