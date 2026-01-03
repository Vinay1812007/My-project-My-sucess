// --- Configuration ---
const API_BASE = 'http://127.0.0.1:5000'; // Flask Backend

// --- State ---
let currentTrack = null;
let isPlaying = false;
let audio = new Audio();
let queue = [];
let currentIndex = 0;

// --- DOM Elements ---
const playBtn = document.getElementById('playPauseBtn');
const progressBar = document.getElementById('progressBar');
const volumeBar = document.getElementById('volumeBar');
const searchInput = document.getElementById('searchInput');
const homeGrid = document.getElementById('homeGrid');
const resultsGrid = document.getElementById('resultsGrid');
const contentArea = document.getElementById('contentArea');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Load some initial content (e.g., search for a popular term)
    searchSongs('Top Hits');
});

// --- Audio Logic ---
audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.value = progress;
        document.getElementById('currTime').innerText = formatTime(audio.currentTime);
        document.getElementById('totalTime').innerText = formatTime(audio.duration);
    }
});

audio.addEventListener('ended', nextTrack);

progressBar.addEventListener('input', (e) => {
    const time = (audio.duration / 100) * e.target.value;
    audio.currentTime = time;
});

volumeBar.addEventListener('input', (e) => {
    audio.volume = e.target.value / 100;
});

// --- Player Controls ---
function togglePlay() {
    if (!currentTrack) return;
    
    if (isPlaying) {
        audio.pause();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    } else {
        audio.play().catch(e => console.error("Playback error:", e));
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    }
    isPlaying = !isPlaying;
}

function loadTrack(track, index, trackList) {
    currentTrack = track;
    queue = trackList || queue;
    currentIndex = index;

    // UI Updates
    document.getElementById('trackName').innerText = track.name;
    document.getElementById('artistName').innerText = track.artist;
    document.getElementById('trackArt').src = track.image;
    
    // Audio Source
    // Priority: 1. Spotify Preview (if avail), 2. Demo Fallback (because we can't do full DRM decode in 1 file)
    if (track.preview_url) {
        audio.src = track.preview_url;
    } else {
        // Fallback to a copyright-free stream for demo if Spotify preview is null
        console.warn("No preview available, using demo stream.");
        audio.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    }

    audio.load();
    isPlaying = false; // Reset state
    togglePlay(); // Start playing
}

function nextTrack() {
    if (currentIndex < queue.length - 1) {
        loadTrack(queue[currentIndex + 1], currentIndex + 1, queue);
    } else {
        // Loop to start
        loadTrack(queue[0], 0, queue);
    }
}

function prevTrack() {
    if (currentIndex > 0) {
        loadTrack(queue[currentIndex - 1], currentIndex - 1, queue);
    }
}

// --- API Calls ---
let debounceTimer;
searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const query = e.target.value;
        if (query.length > 0) {
            showSection('search');
            searchSongs(query);
        } else {
            showSection('home');
        }
    }, 500);
});

async function searchSongs(query) {
    try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (data.tracks) {
            renderGrid(data.tracks, document.getElementById('searchSection').classList.contains('hidden') ? homeGrid : resultsGrid);
        }
    } catch (err) {
        console.error("Search failed:", err);
    }
}

// --- UI Rendering ---
function renderGrid(tracks, container) {
    container.innerHTML = '';
    
    tracks.forEach((track, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${track.image}" alt="${track.name}">
            <h3>${track.name}</h3>
            <p>${track.artist}</p>
            <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
        `;
        
        card.addEventListener('click', () => loadTrack(track, index, tracks));
        container.appendChild(card);
    });
}

function showSection(section) {
    if (section === 'home') {
        document.getElementById('homeSection').classList.remove('hidden');
        document.getElementById('searchSection').classList.add('hidden');
    } else if (section === 'search') {
        document.getElementById('homeSection').classList.add('hidden');
        document.getElementById('searchSection').classList.remove('hidden');
    } else {
        alert("Library feature coming soon!");
    }
}

function focusSearch() {
    document.getElementById('searchInput').focus();
}

function createPlaylist() {
    const name = prompt("Enter playlist name:");
    if (name) {
        const li = document.createElement('li');
        li.innerText = name;
        document.getElementById('playlistList').appendChild(li);
    }
}

// Helper
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}
