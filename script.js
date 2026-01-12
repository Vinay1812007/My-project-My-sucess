// --- CONFIGURATION & STATE ---
const state = {
    audio: document.getElementById('audioPlayer'),
    queue: [],
    currentIndex: 0,
    isPlaying: false,
    audioCtx: null,
    analyser: null
};

// --- ROUTER (SPA LOGIC) ---
const router = {
    current: 'home',
    navigate: (page) => {
        // Update Nav Active State
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.getElementById(`nav-${page}`);
        if(activeBtn) activeBtn.classList.add('active');

        const app = document.getElementById('app-content');
        app.innerHTML = ''; // Clear current content

        // Render New View
        if (page === 'home') renderHome(app);
        else if (page === 'music') renderMusic(app);
        else if (page === 'ai') renderAI(app);
        else if (page === 'dl') renderDL(app);

        router.current = page;
    }
};

// --- VIEW RENDERERS ---
function renderHome(container) {
    container.innerHTML = `
        <div class="landing-container">
            <h1 class="hero-logo">SIRIMILLA VINAY</h1>
            <p style="color:var(--text-secondary); margin-bottom:30px; letter-spacing:1px;">PREMIUM AUDIO & AI EXPERIENCE</p>
            <div>
                <button class="btn-primary" onclick="router.navigate('music')"><i class="fa-solid fa-music"></i> Launch Player</button>
                <button class="btn-primary" onclick="router.navigate('ai')"><i class="fa-solid fa-robot"></i> AI Studio</button>
            </div>
        </div>
    `;
}

function renderMusic(container) {
    container.innerHTML = `
        <div class="search-container">
            <input type="text" id="searchInput" class="search-input" placeholder="Search for songs, artists...">
            <button class="btn-icon" onclick="searchMusic()"><i class="fa-solid fa-magnifying-glass"></i></button>
        </div>
        <div id="musicGrid" class="music-grid"></div>
    `;
    // Load default if queue empty, else show current queue
    if(state.queue.length === 0) fetchSongs('Top Hits India');
    else renderGrid();
}

function renderAI(container) {
    container.innerHTML = `
        <div class="chat-wrapper" style="max-width:800px; margin:0 auto;">
            <div id="chatContainer" class="chat-container">
                <div class="message ai">Hello! I am connected to Llama 3 via Groq. How can I help?</div>
            </div>
            <div class="search-container">
                <input type="text" id="aiPrompt" class="search-input" placeholder="Ask AI...">
                <button class="btn-icon" onclick="sendAiMessage()"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        </div>
    `;
    // Attach Enter key listener
    setTimeout(() => {
        document.getElementById('aiPrompt').addEventListener('keypress', (e) => {
            if(e.key === 'Enter') sendAiMessage();
        });
    }, 100);
}

function renderDL(container) {
    container.innerHTML = `
        <div class="landing-container">
            <h2>Universal Downloader</h2>
            <div class="search-container" style="max-width:600px; margin:20px auto;">
                <input type="text" id="dlUrl" class="search-input" placeholder="Paste YouTube/Insta link...">
                <button class="btn-icon" onclick="startDownload()"><i class="fa-solid fa-download"></i></button>
            </div>
            <div id="dlResult" style="margin-top:20px; color:var(--accent);"></div>
        </div>
    `;
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Start at Home
    router.navigate('home');

    // Global Event Listeners for Player
    setupPlayerEvents();
    
    // Theme
    document.getElementById('themeToggle').onclick = () => {
        const curr = document.documentElement.getAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', curr === 'dark' ? 'light' : 'dark');
    };

    setupVisualizer();
});

// --- MUSIC LOGIC ---
async function fetchSongs(query) {
    const grid = document.getElementById('musicGrid');
    if(grid) grid.innerHTML = '<p style="color:white; text-align:center;">Loading...</p>';

    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=50`);
        const data = await res.json();
        state.queue = data.results.filter(s => s.previewUrl);
        state.currentIndex = 0;
        renderGrid();
    } catch(e) { console.error(e); }
}

function searchMusic() {
    const val = document.getElementById('searchInput').value;
    if(val) fetchSongs(val);
}

function renderGrid() {
    const grid = document.getElementById('musicGrid');
    if(!grid) return;
    grid.innerHTML = '';

    state.queue.forEach((song, idx) => {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <div class="art-box" style="background-image:url('${song.artworkUrl100.replace('100x100','300x300')}')"></div>
            <h4>${song.trackName}</h4>
            <p style="color:var(--text-secondary); font-size:0.8rem;">${song.artistName}</p>
        `;
        card.onclick = () => playSong(idx);
        grid.appendChild(card);
    });
}

function playSong(idx) {
    // Audio Context Resume
    if (!state.audioCtx) initAudioContext();
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume();

    state.currentIndex = idx;
    const song = state.queue[idx];

    state.audio.src = song.previewUrl;
    state.audio.play();
    state.isPlaying = true;

    updatePlayerUI(song);
    // Show Dynamic Island
    document.getElementById('dynamicIsland').classList.remove('hidden');
}

function togglePlay() {
    if(state.audio.paused) {
        state.audio.play();
        state.isPlaying = true;
    } else {
        state.audio.pause();
        state.isPlaying = false;
    }
    updateIcons();
}

function updatePlayerUI(song) {
    // Mini Player
    document.getElementById('miniTitle').innerText = song.trackName;
    document.getElementById('miniArtist').innerText = song.artistName;
    document.getElementById('miniArt').style.backgroundImage = `url('${song.artworkUrl60}')`;
    document.getElementById('miniArt').classList.add('playing');

    // Full Player
    document.getElementById('fullTitle').innerText = song.trackName;
    document.getElementById('fullArtist').innerText = song.artistName;
    document.getElementById('fullArt').style.backgroundImage = `url('${song.artworkUrl100.replace('100x100','600x600')}')`;
    
    updateIcons();
}

function updateIcons() {
    const icon = state.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    document.getElementById('miniPlay').innerHTML = icon;
    document.getElementById('fullPlay').innerHTML = icon;
    
    const wave = document.getElementById('diWave');
    state.isPlaying ? wave.style.opacity = '1' : wave.style.opacity = '0';
    
    const miniArt = document.getElementById('miniArt');
    state.isPlaying ? miniArt.style.animationPlayState = 'running' : miniArt.style.animationPlayState = 'paused';
}

function setupPlayerEvents() {
    // Mini & Full Controls
    const els = ['miniPlay', 'fullPlay'];
    els.forEach(id => document.getElementById(id).onclick = (e) => { e.stopPropagation(); togglePlay(); });

    const nexts = ['miniNext', 'fullNext'];
    nexts.forEach(id => document.getElementById(id).onclick = (e) => { 
        e.stopPropagation(); 
        let next = state.currentIndex + 1; 
        if(next >= state.queue.length) next = 0;
        playSong(next);
    });

    const prevs = ['miniPrev', 'fullPrev'];
    prevs.forEach(id => document.getElementById(id).onclick = (e) => { 
        e.stopPropagation(); 
        let prev = state.currentIndex - 1; 
        if(prev < 0) prev = state.queue.length - 1;
        playSong(prev);
    });

    // Full Screen Toggle
    window.openFullPlayer = () => document.getElementById('fullPlayer').classList.add('active');
    window.closeFullPlayer = () => document.getElementById('fullPlayer').classList.remove('active');

    // Progress Bar
    state.audio.ontimeupdate = () => {
        if(!state.audio.duration) return;
        const pct = (state.audio.currentTime / state.audio.duration) * 100;
        document.getElementById('fullProgressFill').style.width = pct + '%';
        
        // Time Text
        const format = t => {
            const m = Math.floor(t/60);
            const s = Math.floor(t%60).toString().padStart(2,'0');
            return `${m}:${s}`;
        };
        document.getElementById('fullCurrTime').innerText = format(state.audio.currentTime);
    };
    
    // Seek
    document.getElementById('fullProgressBar').onclick = (e) => {
        const rect = e.target.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        state.audio.currentTime = pct * state.audio.duration;
    };
}

// --- AI LOGIC (Vercel Backend) ---
async function sendAiMessage() {
    const input = document.getElementById('aiPrompt');
    const text = input.value.trim();
    if(!text) return;

    const chat = document.getElementById('chatContainer');
    chat.innerHTML += `<div class="message user">${text}</div>`;
    input.value = '';
    chat.scrollTop = chat.scrollHeight;

    const loadMsg = document.createElement('div');
    loadMsg.className = 'message ai';
    loadMsg.innerText = '...';
    chat.appendChild(loadMsg);

    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ prompt: text })
        });
        const data = await res.json();
        loadMsg.innerText = data.result || data.error;
    } catch(e) {
        loadMsg.innerText = "Error connecting to AI.";
    }
}

// --- DOWNLOADER SIMULATION ---
function startDownload() {
    const res = document.getElementById('dlResult');
    res.innerHTML = "Fetching video details...";
    setTimeout(() => {
        res.innerHTML = `
            <div style="background:rgba(255,255,255,0.1); padding:10px; border-radius:10px; display:inline-block;">
                <img src="https://picsum.photos/300/170" style="border-radius:10px; display:block; margin-bottom:10px;">
                <h3>Simulated Video</h3>
                <button class="btn-primary" onclick="showToast('Download Started')">Download MP4</button>
            </div>
        `;
    }, 1500);
}

// --- VISUALIZER ---
function initAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    state.audioCtx = new AudioContext();
    state.analyser = state.audioCtx.createAnalyser();
    const source = state.audioCtx.createMediaElementSource(state.audio);
    source.connect(state.analyser);
    state.analyser.connect(state.audioCtx.destination);
    state.analyser.fftSize = 256;
}

function setupVisualizer() {
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');
    
    function animate() {
        requestAnimationFrame(animate);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        let bass = 0;
        if(state.analyser) {
            const data = new Uint8Array(state.analyser.frequencyBinCount);
            state.analyser.getByteFrequencyData(data);
            bass = data[0];
        }

        const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
        const intensity = Math.min(0.3 + (bass/500), 0.8);
        
        // Theme aware colors
        const theme = document.documentElement.getAttribute('data-theme');
        const color = theme === 'dark' ? `rgba(100, 0, 255, ${intensity})` : `rgba(0, 150, 255, ${intensity})`;
        
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,canvas.width, canvas.height);
    }
    animate();
}

window.showToast = (msg) => {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
};
