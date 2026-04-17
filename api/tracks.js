const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const tracksDir = path.join(__dirname, '..', 'storage', 'tracks');

function ensureTracksDir() {
	fs.mkdirSync(tracksDir, { recursive: true });
}

function sanitizeTrackName(trackName) {
	return String(trackName || '')
		.trim()
		.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
		.replace(/\s+/g, ' ')
		.replace(/[. ]+$/g, '') || 'track';
}

function redirectWithNotification(res, targetPath, notificationType, message) {
	const query = new URLSearchParams({ notification: notificationType });
	if (message) {
		query.set('message', message);
	}

	return res.redirect(`${targetPath}?${query.toString()}`);
}

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

router.post('/', (req, res) => {
	try {
		ensureTracksDir();

		const trackName = sanitizeTrackName(req.body.name);
		const gridX = String(req.body['x-grid'] || '5000');
		const gridY = String(req.body['y-grid'] || '5000');
		const filePath = path.join(tracksDir, `${trackName}.json`);

		if (fs.existsSync(filePath)) {
			return redirectWithNotification(
				res,
				'/tracks',
				'track-error',
				`Der Track "${trackName}" existiert bereits.`
			);
		}

		const trackData = [
			{
				grid_X: gridX,
				grid_Y: gridY
			}
		];

		fs.writeFileSync(filePath, JSON.stringify(trackData, null, 2), 'utf8');
		return redirectWithNotification(
			res,
			'/tracks',
			'track-created',
			`Der Track "${trackName}" wurde angelegt.`
		);
	} catch (error) {
		console.error('[API] Fehler beim Erstellen des Tracks:', error);
		return redirectWithNotification(
			res,
			'/tracks',
			'track-error',
			'Der Track konnte nicht erstellt werden.'
		);
	}
});

router.post('/delete', (req, res) => {
	try {
		if (!fs.existsSync(tracksDir)) {
			return redirectWithNotification(
				res,
				'/tracks',
				'track-error',
				'Der Track-Speicher wurde nicht gefunden.'
			);
		}

		const trackName = sanitizeTrackName(req.body.trackName);
		const filePath = path.join(tracksDir, `${trackName}.json`);

		if (!fs.existsSync(filePath)) {
			return redirectWithNotification(
				res,
				'/tracks',
				'track-error',
				`Der Track "${trackName}" wurde nicht gefunden.`
			);
		}

		fs.unlinkSync(filePath);
		return redirectWithNotification(
			res,
			'/tracks',
			'track-deleted',
			`Der Track "${trackName}" wurde gelöscht.`
		);
	} catch (error) {
		console.error('[API] Fehler beim Löschen des Tracks:', error);
		return redirectWithNotification(
			res,
			'/tracks',
			'track-error',
			'Der Track konnte nicht gelöscht werden.'
		);
	}
});


module.exports = router;
