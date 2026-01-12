// --- STATE & CONFIG ---
const state = {
    audio: null,
    audioCtx: null,
    analyser: null,
    queue: [],
    currentIndex: 0,
    isPlaying: false
};

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    setupTheme();
    setupCursor();
    createSnow();        // Background Snow
    setupVisualizer();   // Background Audio Vis

    // Check which page we are on
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

// --- SNOW ANIMATION (Optimized) ---
function createSnow() {
    let container = document.getElementById('snowContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'snowContainer';
        document.body.prepend(container);
    }
    
    // Create 40 fixed flakes to prevent DOM flooding
    for(let i=0; i<40; i++) {
        const flake = document.createElement('div');
        flake.className = 'snowflake';
        const size = Math.random() * 3 + 2 + 'px';
        flake.style.width = size;
        flake.style.height = size;
        flake.style.left = Math.random() * 100 + 'vw';
        flake.style.animationDuration = Math.random() * 5 + 8 + 's';
        flake.style.animationDelay = Math.random() * 5 + 's';
        flake.style.opacity = Math.random() * 0.7;
        container.appendChild(flake);
    }
}

// --- GLOBAL UTILS ---
function setupTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    const btn = document.getElementById('themeToggle');
    if(btn) btn.onclick = () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    };
}

function setupCursor() {
    if(window.innerWidth < 768) return;
    const cursor = document.getElementById('cursor');
    if(!cursor) return;
    
    let mx=0, my=0, cx=0, cy=0;
    document.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; });
    
    function animate() {
        cx += (mx - cx) * 0.15;
        cy += (my - cy) * 0.15;
        cursor.style.left = cx + 'px';
        cursor.style.top = cy + 'px';
        requestAnimationFrame(animate);
    }
    animate();

    document.querySelectorAll('a, button, .magnetic').forEach(el => {
        el.onmouseenter = () => cursor.classList.add('hovered');
        el.onmouseleave = () => cursor.classList.remove('hovered');
    });
}

function setupVisualizer() {
    const canvas = document.getElementById('bgCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    function loop() {
        requestAnimationFrame(loop);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const time = Date.now() * 0.0005;
        const color1 = document.documentElement.getAttribute('data-theme') === 'dark' ? '#0f0f1a' : '#ffffff';
        const color2 = document.documentElement.getAttribute('data-theme') === 'dark' ? '#000000' : '#f0f0f0';
        
        const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);
        
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,canvas.width, canvas.height);
    }
    loop();
}

// --- MUSIC PLAYER ---
function setupMusicPlayer() {
    state.audio = document.getElementById('audioPlayer');
    fetchSongs('Top Hits India');

    document.getElementById('playBtn').onclick = togglePlay;
    document.getElementById('nextBtn').onclick = nextSong;
    document.getElementById('prevBtn').onclick = prevSong;
    
    const sBtn = document.getElementById('searchBtn');
    if(sBtn) sBtn.onclick = () => {
        const val = document.getElementById('searchInput').value;
        if(val) fetchSongs(val);
    };
}

async function fetchSongs(query) {
    const grid = document.getElementById('musicGrid');
    grid.innerHTML = '<div style="width:100%; text-align:center; padding:20px;">Loading...</div>';

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
        card.className = 'song-card magnetic reveal';
        card.innerHTML = `
            <div class="art-box" style="background-image:url('${song.artworkUrl100.replace('100x100','400x400')}')">
                <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
            </div>
            <div class="song-info">
                <h4 style="margin-bottom:5px; white-space:nowrap; overflow:hidden;">${song.trackName}</h4>
                <p style="color:var(--text-secondary); font-size:0.9rem;">${song.artistName}</p>
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
    
    document.getElementById('trackTitle').innerText = song.trackName;
    document.getElementById('trackArtist').innerText = song.artistName;
    document.getElementById('albumArt').style.backgroundImage = `url('${song.artworkUrl60}')`;
    document.getElementById('playBtn').innerHTML = '<i class="fa-solid fa-pause"></i>';
    document.getElementById('musicPlayerBar').classList.add('active');
}

function togglePlay() {
    if(state.audio.paused) { state.audio.play(); state.isPlaying = true; }
    else { state.audio.pause(); state.isPlaying = false; }
    
    const icon = state.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    document.getElementById('playBtn').innerHTML = icon;
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

// --- AI CHAT ---
function setupAI() {
    const btn = document.getElementById('generateBtn');
    const input = document.getElementById('aiPrompt');
    const container = document.getElementById('chatContainer');

    async function send() {
        const text = input.value.trim();
        if(!text) return;
        
        container.innerHTML += `<div class="message user"><div class="bubble">${text}</div></div>`;
        input.value = '';
        container.scrollTop = container.scrollHeight;

        const loadId = Date.now();
        container.innerHTML += `<div class="message ai" id="${loadId}"><div class="bubble">...</div></div>`;
        container.scrollTop = container.scrollHeight;

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ prompt: text })
            });
            const data = await res.json();
            document.getElementById(loadId).innerHTML = `<div class="bubble">${data.result || data.error}</div>`;
        } catch(e) {
            document.getElementById(loadId).innerText = "Error connecting.";
        }
    }
    if(btn) btn.onclick = send;
    if(input) input.addEventListener('keypress', e => { if(e.key==='Enter') send(); });
}

// --- DOWNLOADER ---
function setupDownloader() {
    const btn = document.getElementById('fetchVideoBtn');
    if(btn) btn.onclick = () => {
        document.getElementById('videoLoader').classList.remove('hidden');
        document.getElementById('dlResult').classList.add('hidden');
        setTimeout(() => {
            document.getElementById('videoLoader').classList.add('hidden');
            document.getElementById('dlResult').classList.remove('hidden');
            document.getElementById('thumbPreview').src = "https://picsum.photos/600/350";
        }, 1500);
    };
}
