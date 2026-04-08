const express = require('express')
const https = require('https')
const path = require('path')
const fs = require('fs')
const session = require('express-session')

// Load environment variables FIRST
require('dotenv').config()

// MQTT - https://www.npmjs.com/package/mqtt#example
const mqtt = require('mqtt')
// Use MQTT connection from environment (.env)
const mqttUrl = process.env.MQTT_BROKER_URL || 'mqtt://test.mosquitto.org:1883'
const mqttOptions = {}
if (process.env.MQTT_USERNAME) mqttOptions.username = process.env.MQTT_USERNAME
if (process.env.MQTT_PASSWORD) mqttOptions.password = process.env.MQTT_PASSWORD
const client = mqtt.connect(mqttUrl, mqttOptions);
console.log(`[Startup Process] MQTT connecting to: ${mqttUrl}`)

const pem = require('pem')

const redirectsRoutes = require('./routes/redirects')
const publicRoutes = require('./routes/public')
const privateRoutes = require('./routes/private')
const apiTracksRoutes = require('./api/tracks')
// const apiSwitchRoutes = require('./mqtt/esp32/switch')
// const apiSpeedRoutes = require('./mqtt/esp32/speed')



// Console Logs for Fun
console.log(`[Startup Process] Starting up the Server..`)

const app = express()
const PORT = process.env.PORT || 443;

startServer();

function startServer() {
	console.log(`[Startup Process] ⏳ Server is starting on Port ${PORT}..`)
	try {
	console.log(`[Startup Process] ⏳ Setting up Style Utils..`)
	// View Engine (EJS Templates)
	app.set('view engine', 'ejs')
	app.set('views', path.join(__dirname, 'views'))

	// Body Parser Middleware (For Post)
	app.use(express.urlencoded({ extended: true }))
	app.use(express.json())

	// Static Files
	app.use('/css', express.static(path.join(__dirname, 'styles/css')))
	app.use('/js', express.static(path.join(__dirname, 'styles/js')))
	app.use('/img', express.static(path.join(__dirname, 'styles/img')))
	app.use('/utils', express.static(path.join(__dirname, '/utils')))

	// Session Middleware
	app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: {
		secure: true,
		httpOnly: true,
		maxAge: 24 * 60 * 60 * 1000
	}
	}))
	} catch (error) {
		console.error(`[Startup Process] ❌ Error setting up Style Utils:`, error)
		return
	}
	console.log(`[Startup Process] ✅ Style Utils Finished`)

	console.log(`[Startup Process] ⏳ Setting up MQTT Client..`)
	startMQTT();

function startMQTT() {
	client.on("connect", () => {
		client.subscribe("presence", (err) => {
			if (!err) {
			client.publish("presence", "Hello mqtt");
			}
		});
	});

	client.on("message", (topic, message) => {
		// message is Buffer
		console.log(`[MQTT] message on ${topic}: ${message.toString()}`);
		// Keep client connected; do not call client.end() here.
	});
}


/* ##### Add later #####
console.log(`[Startup Process] ⏳ Setting up API Endpoints..`)
try {
	app.use('/api/tracks', apiTracksRoutes);
	app.use('/api/switch', apiSwitchRoutes(client));
	app.use('/api/speed', apiSpeedRoutes(client));
}
catch (error) {
	console.error(`[Startup Process] ❌ Error setting up API Endpoints:`, error)
	return
}
*/


console.log(`[Startup Process] ⏳ Setting up Routes..`)
try {
	app.use(redirectsRoutes, privateRoutes, publicRoutes)
} catch (error) {
	console.error(`[Startup Process] ❌ Error setting up Routes:`, error)
	return
}
  
  
	console.log(`[Startup Process] ✅ Routes Finished`)
	console.log(`[Startup Process] ⌛ Create SSL Certificate..`)
	createCert();


// SSL Certificate erstellung von Felix
const isLocal = process.platform === 'win32'
function createCert() {
	pem.createCertificate({ days: 365, selfSigned: true }, (err, keys) => {
		if (isLocal) {
		// Use SSL certificate from C:/SSL/ on Windows
		try {
			const key = fs.readFileSync('C:/SSL/localhost-key.pem');
			const cert = fs.readFileSync('C:/SSL/localhost.pem');
			keys = { serviceKey: key, certificate: cert };
		} catch (err) {
			console.error('[Startup Process] ❌ Error reading SSL certificate from C:/SSL/:', err);
			return;
		}
		} else {
		// Use pem.createCertificate on Linux/other platforms
		if (err) {
			console.error('[Startup Process] ❌ Error creating self-signed certificate:', err);
			return;
		}
	}
	https.createServer({ key: keys.serviceKey, cert: keys.certificate }, app).listen(PORT, () => {
		console.log(`[Startup Process] 🌐 HTTPS Server running on port ${PORT}`);
		console.log(`[Startup Process] 🌐 URL: https://localhost:${PORT}`);
	});
	});
}
}