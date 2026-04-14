const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const tracksDir = path.join(__dirname, '..', 'storage', 'tracks');

// GET all Tracks
router.get('/', (req, res) => {
	try {
		if (!fs.existsSync(tracksDir)) {
			return res.json({ success: true, tracks: [] });
		}

		const files = fs.readdirSync(tracksDir);
		const jsonFiles = files.filter(f => f.endsWith('.json'));
		
		const tracks = {};
		jsonFiles.forEach(file => {
			const trackName = file.replace('.json', '');
			const filePath = path.join(tracksDir, file);
			try {
				const trackData = fs.readFileSync(filePath, 'utf8');
				tracks[trackName] = JSON.parse(trackData);
			} catch (error) {
				console.error(`[API] Fehler beim Parsen von ${file}:`, error);
			}
		});

		res.json({ success: true, tracks: tracks });
	} catch (error) {
		console.error('[API] Fehler beim Auflisten der Tracks:', error);
		res.status(500).json({ success: false, error: error.message });
	}
});


module.exports = router;
