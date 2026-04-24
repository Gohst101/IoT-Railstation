// Alle Tracks Laden
async function loadTracks() {
  try {
    const response = await fetch('/api/tracks');
    
    if (!response.ok) {
      console.error('Fehler beim Laden:', response.statusText);
      showError(`Tracks konnten nicht geladen werden (${response.status})`);
      return;
    }
    
    const data = await response.json();
    console.log('Tracks geladen:', data);
    
    displayAllTracks(data.tracks || {});
  } catch (error) {
    console.error('Fehler beim Laden der Tracks:', error);
    showError('Fehler beim Laden der Tracks: ' + error.message);
  }
}

function displayAllTracks(tracksObj) {
  const pageContent = document.getElementById('page-content');
  
  const cards = pageContent.querySelectorAll('.track-card:not(.track-card-create)');
  cards.forEach(card => card.remove());
  
  Object.entries(tracksObj).forEach(([trackName, trackData]) => {
    const card = createTrackCard(trackName, trackData);
    pageContent.insertBefore(card, pageContent.querySelector('.track-card-create'));
  });
}

// Track Card erstellen
function createTrackCard(trackName, trackData) {
  const card = document.createElement('article');
  card.className = 'track-card';

  const safeTrackName = escapeHtml(trackName);

  card.innerHTML = `
    <figure class="track-card-preview" aria-hidden="true">
      <p class="track-card-preview-label">Preview</p>
    </figure>
    <div class="track-card-bar">
      <h3 class="track-card-title">${safeTrackName}</h3>
      <ul class="track-card-actions" aria-label="Aktionen für ${safeTrackName}">
        <li>
          <button class="btn btn-play" type="button" title="Starten">
            <img class="icon" src="/img/icons/play.svg" alt="Starten">
          </button>
        </li>
        <li>
          <button class="btn btn-edit" type="button" title="Bearbeiten">
            <img class="icon" src="/img/icons/edit.svg" alt="Bearbeiten">
          </button>
        </li>
        <li>
          <button class="btn btn-settings" type="button" title="Einstellungen">
            <img class="icon" src="/img/icons/settings.svg" alt="Einstellungen">
          </button>
        </li>
        <li>
          <button class="btn btn-delete" type="button" title="Löschen">
            <img class="icon" src="/img/icons/trash.svg" alt="Löschen">
          </button>
        </li>
      </ul>
    </div>
  `;

  const playButton = card.querySelector('.btn-play');
  const editButton = card.querySelector('.btn-edit');
  const settingsButton = card.querySelector('.btn-settings');
  const deleteButton = card.querySelector('.btn-delete');

  if (playButton) {
    playButton.addEventListener('click', () => {
      window.location.href = `/track/${encodeURIComponent(trackName)}`;
    });
  }

  if (editButton) {
    editButton.addEventListener('click', () => {
      window.location.href = `/track/${encodeURIComponent(trackName)}/edit`;
    });
  }

  if (settingsButton) {
    settingsButton.addEventListener('click', () => {
      openEditTrackModal(trackName, trackData);
    });
  }

  if (deleteButton) {
    deleteButton.addEventListener('click', () => {
      openDeleteTrackModal(trackName);
    });
  }
  
  return card;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function openDeleteTrackModal(trackName) {
  const deleteTrackName = document.getElementById('delete-track-name');
  const deleteTrackValue = document.getElementById('delete-track-value');

  if (deleteTrackName) {
    deleteTrackName.textContent = trackName;
  }

  if (deleteTrackValue) {
    deleteTrackValue.value = trackName;
  }

  openModal('modal-delete-track');
}

function openEditTrackModal(trackName, trackData) {
  const originalNameField = document.getElementById('edit-track-original-name');
  const trackNameField = document.getElementById('edit-track-name');
  const xGridField = document.getElementById('edit-x-grid');
  const yGridField = document.getElementById('edit-y-grid');

  const settings = Array.isArray(trackData) && trackData.length > 0
    ? trackData[0]
    : {};

  if (originalNameField) {
    originalNameField.value = trackName;
  }

  if (trackNameField) {
    trackNameField.value = trackName;
  }

  if (xGridField) {
    xGridField.value = settings.grid_X || 5000;
  }

  if (yGridField) {
    yGridField.value = settings.grid_Y || 5000;
  }

  openModal('modal-edit-track');
}

window.openDeleteTrackModal = openDeleteTrackModal;

// Error Handler
function showError(message) {
  const pageContent = document.getElementById('page-content');
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  pageContent.appendChild(errorDiv);
}

document.addEventListener('DOMContentLoaded', loadTracks);
