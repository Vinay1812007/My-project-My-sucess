// --- CONFIG & STATE ---
const state = {
    audio: null,
    audioCtx: null,
    analyser: null,
    queue: [],
    currentIndex: 0,
    isPlaying: false
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    setupTheme();
    setupCursor();
    setupVisualizer(); // Runs on all pages for background effect

    // PAGE SPECIFIC LOGIC
    if (document.getElementById('musicGrid')) {
        setupMusicPlayer();
    } 
    else if (document.getElementById('chatContainer')) {
        setupAI();
    } 
    else if (document.getElementById('videoUrl')) {
        setupDownloader();
    }
});

// --- GLOBAL UTILS ---
function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const toggle = document.getElementById('themeToggle');
    if(toggle) {
        toggle.onclick = () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
        };
    }
}

function setupCursor() {
    const cursor = document.getElementById('cursor');
    if(!cursor) return;
    
    let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;
    document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

    function animate() {
        cursorX += (mouseX - cursorX) * 0.15;
        cursorY += (mouseY - cursorY) * 0.15;
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    // Magnetic Effect
    document.querySelectorAll('.magnetic').forEach(el => {
        el.onmouseenter = () => cursor.classList.add('hovered');
        el.onmouseleave = () => cursor.classList.remove('hovered');
    });
}

// --- VISUALIZER (Background Animation) ---
function setupVisualizer() {
    const canvas = document.getElementById('bgCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');

    function animate() {
        requestAnimationFrame(animate);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Idle animation since audio only plays on music page
        const time = Date.now() * 0.002;
        const color1 = document.documentElement.getAttribute('data-theme') === 'dark' ? '#1a0b2e' : '#e0f7fa';
        const color2 = document.documentElement.getAttribute('data-theme') === 'dark' ? '#000000' : '#ffffff';

        const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);
        
        ctx.fillStyle = grad;
        ctx.fillRect(0,0, canvas.width, canvas.height);
    }
    animate();
}

// =========================================
// 🎵 MUSIC PLAYER LOGIC (Only runs on Music Page)
// =========================================
function setupMusicPlayer() {
    state.audio = document.getElementById('audioPlayer');
    fetchSongs('Top Hits India');

    // Controls
    document.getElementById('playBtn').onclick = togglePlay;
    document.getElementById('fullPlayBtn').onclick = togglePlay;
    document.getElementById('nextBtn').onclick = nextSong;
    document.getElementById('fullNextBtn').onclick = nextSong;
    document.getElementById('prevBtn').onclick = prevSong;
    document.getElementById('fullPrevBtn').onclick = prevSong;
    
    // Search
    document.getElementById('searchBtn').onclick = () => {
        const val = document.getElementById('searchInput').value;
        if(val) fetchSongs(val);
    };

    // Full Player Toggles
    document.getElementById('miniPlayerInfo').onclick = () => document.getElementById('fullPlayer').classList.add('active');
    document.getElementById('closeFullPlayer').onclick = () => document.getElementById('fullPlayer').classList.remove('active');
}

async function fetchSongs(query) {
    const grid = document.getElementById('musicGrid');
    grid.innerHTML = '<div class="loader"></div>';

    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=40`);
        const data = await res.json();
        state.queue = data.results.filter(s => s.previewUrl);
        renderGrid();
    } catch(e) { console.error(e); }
}

function renderGrid() {
    const grid = document.getElementById('musicGrid');
    grid.innerHTML = '';
    state.queue.forEach((song, idx) => {
        const card = document.createElement('div');
        card.className = 'song-card magnetic';
        card.innerHTML = `
            <div class="art-box" style="background-image:url('${song.artworkUrl100.replace('100x100','400x400')}')">
                <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
            </div>
            <div class="song-info">
                <h3>${song.trackName}</h3>
                <p>${song.artistName}</p>
            </div>
        `;
        card.onclick = () => playSong(idx);
        grid.appendChild(card);
    });
}

function playSong(idx) {
    state.currentIndex = idx;
    const song = state.queue[idx];
    state.audio.src = song.previewUrl;
    state.audio.play();
    state.isPlaying = true;
    updatePlayerUI(song);
}

function togglePlay() {
    if(state.audio.paused) { state.audio.play(); state.isPlaying = true; }
    else { state.audio.pause(); state.isPlaying = false; }
    updatePlayerUI(state.queue[state.currentIndex]);
}

function nextSong() {
    let i = state.currentIndex + 1;
    if(i >= state.queue.length) i = 0;
    playSong(i);
}

function prevSong() {
    let i = state.currentIndex - 1;
    if(i < 0) i = state.queue.length - 1;
    playSong(i);
}

function updatePlayerUI(song) {
    // Update Mini Player
    document.getElementById('trackTitle').innerText = song.trackName;
    document.getElementById('trackArtist').innerText = song.artistName;
    document.getElementById('albumArt').style.backgroundImage = `url('${song.artworkUrl60}')`;
    document.getElementById('musicPlayerBar').classList.add('active');

    // Update Full Player
    document.getElementById('fullTrackTitle').innerText = song.trackName;
    document.getElementById('fullTrackArtist').innerText = song.artistName;
    document.getElementById('fullAlbumArt').style.backgroundImage = `url('${song.artworkUrl100.replace('100x100','600x600')}')`;

    // Icons
    const icon = state.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    document.getElementById('playBtn').innerHTML = icon;
    document.getElementById('fullPlayBtn').innerHTML = icon;
}

// =========================================
// 🤖 AI CHAT LOGIC
// =========================================
function setupAI() {
    const btn = document.getElementById('generateBtn');
    const input = document.getElementById('aiPrompt');
    const container = document.getElementById('chatContainer');

    async function send() {
        const text = input.value.trim();
        if(!text) return;

        // User Bubble
        container.innerHTML += `<div class="message user"><div class="bubble">${text}</div></div>`;
        input.value = '';
        container.scrollTop = container.scrollHeight;

        // AI Loading Bubble
        const loadId = Date.now();
        container.innerHTML += `<div class="message ai" id="${loadId}"><div class="bubble">Thinking...</div></div>`;
        container.scrollTop = container.scrollHeight;

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: text })
            });
            const data = await res.json();
            document.getElementById(loadId).innerHTML = `<div class="avatar"><i class="fa-solid fa-robot"></i></div><div class="bubble">${data.result || data.error}</div>`;
        } catch(e) {
            document.getElementById(loadId).innerText = "Error connecting.";
        }
    }

    if(btn) btn.onclick = send;
    if(input) input.addEventListener('keypress', (e) => { if(e.key === 'Enter') send(); });
}

// =========================================
// ⬇️ DOWNLOADER LOGIC
// =========================================
function setupDownloader() {
    const btn = document.getElementById('fetchVideoBtn');
    if(btn) {
        btn.onclick = () => {
            const loader = document.getElementById('videoLoader');
            const result = document.getElementById('dlResult');
            
            loader.classList.remove('hidden');
            result.classList.add('hidden');
            
            setTimeout(() => {
                loader.classList.add('hidden');
                result.classList.remove('hidden');
                document.getElementById('thumbPreview').src = "https://picsum.photos/600/340?r="+Math.random();
            }, 1500);
        };
    }
}
