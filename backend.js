const express = require('express')
const https = require('https')
const path = require('path')
const fs = require('fs')
const session = require('express-session')

// Load environment variables FIRST
require('dotenv').config()

// MQTT - https://www.npmjs.com/package/mqtt#example
const mqtt = require('mqtt')
const { initMqtt } = require('./mqtt')
// Use MQTT connection from environment (.env)
const mqttUrl = process.env.MQTT_BROKER_URL || 'mqtt://test.mosquitto.org:1883'
const mqttOptions = {}
const mqttUsername = (process.env.MQTT_USERNAME || process.env.MQTT_USER || '').trim()
const mqttPassword = (process.env.MQTT_PASSWORD || '').trim()

if (mqttUsername) mqttOptions.username = mqttUsername
if (mqttPassword) mqttOptions.password = mqttPassword
if (!mqttOptions.connectTimeout) mqttOptions.connectTimeout = 5000
if (!mqttOptions.reconnectPeriod) mqttOptions.reconnectPeriod = 3000

if (mqttPassword && !mqttUsername) {
	console.warn('[Startup Process] ⚠️ MQTT_PASSWORD is set but MQTT_USERNAME/MQTT_USER is missing. Broker auth may fail.')
}

const client = mqtt.connect(mqttUrl, mqttOptions);
const mqttBridge = initMqtt(client)
console.log(`[Startup Process] MQTT connecting to: ${mqttUrl}`)
console.log(`[Startup Process] MQTT auth user: ${mqttUsername ? mqttUsername : 'none'}`)

client.on('error', (error) => {
	console.error('[Startup Process] MQTT connection error:', error.message)
})

const pem = require('pem')

const redirectsRoutes = require('./routes/redirects')
const publicRoutes = require('./routes/public')
const privateRoutes = require('./routes/private')
const apiTracksRoutes = require('./api/tracks')


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
	app.use('/themes', express.static(path.join(__dirname, 'styles/themes')))
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
	app.locals.mqtt = mqttBridge;
	console.log(`[Startup Process] ✅ MQTT bridge initialized`)


console.log(`[Startup Process] ⏳ Setting up API Endpoints..`)
try {
	app.use('/api/tracks', apiTracksRoutes);
	//app.use('/api/switch', apiSwitchRoutes(client));
	//app.use('/api/speed', apiSpeedRoutes(client));
}
catch (error) {
	console.error(`[Startup Process] ❌ Error setting up API Endpoints:`, error)
	return
}



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