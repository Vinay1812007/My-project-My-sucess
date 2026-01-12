// --- CONFIG & STATE ---
const state = {
    audio: null,
    audioCtx: null,
    analyser: null,
    source: null,
    filters: { bass: null, treble: null },
    songQueue: [],
    currentIndex: 0,
    isPartyMode: false,
    colorHash: 0
};

// --- CUSTOM CURSOR ---
const cursor = document.getElementById('cursor');
let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    if (cursor) {
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
    }
    requestAnimationFrame(animateCursor);
}
requestAnimationFrame(animateCursor);

function applyMagnetic() {
    document.querySelectorAll('.magnetic').forEach(el => {
        el.onmouseenter = () => cursor && cursor.classList.add('hovered');
        el.onmouseleave = () => cursor && cursor.classList.remove('hovered');
    });
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    applyMagnetic();
    
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.onclick = () => {
            const html = document.documentElement;
            html.setAttribute('data-theme', html.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
        };
    }

    if (document.getElementById('musicGrid')) {
        setupMusicPlayer();
    } else if (document.getElementById('videoUrl')) {
        setupDownloader();
    } else if (document.getElementById('chatContainer')) {
        setupAI();
    } else {
        initDiscoVisualizer(true); 
    }
});

// --- AI CHAT LOGIC (Updated for Chat UI) ---
function setupAI() {
    const btn = document.getElementById('generateBtn');
    const input = document.getElementById('aiPrompt');
    const container = document.getElementById('chatContainer');

    function appendMessage(role, text) {
        const div = document.createElement('div');
        div.className = `message ${role}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerHTML = role === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';
        
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.innerText = text;
        
        if (role === 'user') {
            div.appendChild(bubble);
            div.appendChild(avatar);
        } else {
            div.appendChild(avatar);
            div.appendChild(bubble);
        }
        
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return bubble;
    }

    async function sendRequest() {
        const text = input.value.trim();
        if(!text) return;
        
        appendMessage('user', text);
        input.value = '';
        
        // Show typing
        const loadingBubble = appendMessage('ai', 'Thinking...');
        
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: text })
            });
            const data = await response.json();
            
            // Replace loading text with result or error
            if (data.error) {
                loadingBubble.innerText = "Error: " + data.error;
            } else {
                loadingBubble.innerText = data.result;
            }
        } catch(e) {
            console.error(e);
            loadingBubble.innerText = "Connection error. Please try again later.";
        }
    }

    if(btn) btn.onclick = sendRequest;
    if(input) {
        input.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') sendRequest();
        });
    }
}

// --- MUSIC PLAYER LOGIC ---
function setupMusicPlayer() {
    state.audio = document.getElementById('audioPlayer');
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    let debounce;

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounce);
            debounce = setTimeout(() => fetchSongs(e.target.value), 800);
        });
        searchInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') { clearTimeout(debounce); fetchSongs(e.target.value); }});
    }
    if (searchBtn) searchBtn.onclick = () => fetchSongs(searchInput.value || 'Trending');

    document.querySelectorAll('.chip').forEach(chip => {
        chip.onclick = () => fetchSongs(chip.dataset.query + ' Songs India');
    });

    if(document.getElementById('myMixBtn')) {
        document.getElementById('myMixBtn').onclick = () => fetchSongs(['Best of 2024 India', 'Late Night LoFi'][Math.floor(Math.random()*2)]);
    }

    setupControls();
    fetchSongs('Latest India Hits');
}

async function fetchSongs(query) {
    if (!query) return;
    const grid = document.getElementById('musicGrid');
    const loader = document.getElementById('loader');
    
    grid.innerHTML = ''; 
    if (loader) { grid.appendChild(loader); loader.classList.remove('hidden'); }

    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=30&country=IN`);
        const data = await res.json();
        
        if (loader) loader.classList.add('hidden');

        state.songQueue = data.results.map(s => ({
            id: s.trackId, trackName: s.trackName, artistName: s.artistName,
            artwork: s.artworkUrl100.replace('100x100', '600x600'), previewUrl: s.previewUrl
        }));

        state.songQueue.forEach((song, idx) => {
            if (!song.previewUrl) return;
            const card = document.createElement('div');
            card.className = 'song-card magnetic';
            card.innerHTML = `<div class="art-box" style="background-image:url('${song.artwork}')"><div class="play-overlay"><i class="fa-solid fa-play"></i></div></div><div class="song-info"><h3>${song.trackName}</h3><p>${song.artistName}</p></div>`;
            card.onclick = () => { state.currentIndex = idx; playTrack(song); };
            grid.appendChild(card);
        });
        applyMagnetic();
    } catch (e) {
        console.error(e);
        if (loader) loader.classList.add('hidden');
    }
}

function playTrack(song) {
    if (!song) return;
    const setText = (id, txt) => { const el = document.getElementById(id); if(el) el.innerText = txt; };
    const setBg = (id, url) => { const el = document.getElementById(id); if(el) el.style.backgroundImage = `url('${url}')`; };
    setText('trackTitle', song.trackName); setText('trackArtist', song.artistName);
    setText('fullTrackTitle', song.trackName); setText('fullTrackArtist', song.artistName);
    setBg('albumArt', song.artwork); setBg('fullAlbumArt', song.artwork);
    document.getElementById('musicPlayerBar').classList.add('active');
    
    initAudioEngine();
    if (state.audio) { state.audio.src = song.previewUrl; state.audio.play(); }
}

function setupControls() {
    const { audio } = state;
    if (!audio) return;
    const toggle = () => audio.paused ? audio.play() : audio.pause();
    document.getElementById('playBtn').onclick = toggle;
    document.getElementById('fullPlayBtn').onclick = toggle;
    
    document.getElementById('miniPlayerInfo').onclick = () => document.getElementById('fullPlayer').classList.add('active');
    document.getElementById('closeFullPlayer').onclick = () => document.getElementById('fullPlayer').classList.remove('active');
}

// --- VISUALIZER ---
function initAudioEngine() {
    if(state.audioCtx) { if(state.audioCtx.state === 'suspended') state.audioCtx.resume(); return; }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    state.audioCtx = new AudioContext();
    state.analyser = state.audioCtx.createAnalyser();
    state.source = state.audioCtx.createMediaElementSource(state.audio);
    state.source.connect(state.analyser);
    state.analyser.connect(state.audioCtx.destination);
    initDiscoVisualizer();
}

function initDiscoVisualizer(autoAnimate = false) {
    const canvas = document.getElementById('bgCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    function animate() {
        requestAnimationFrame(animate);
        let bass = 100;
        if (state.analyser) {
            const bufferLen = state.analyser.frequencyBinCount;
            const data = new Uint8Array(bufferLen);
            state.analyser.getByteFrequencyData(data);
            bass = data[0]; 
        } else {
             bass = 100 + Math.sin(Date.now() * 0.002) * 50;
        }

        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        ctx.fillStyle = '#000'; ctx.fillRect(0,0,canvas.width, canvas.height);
        
        const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
        grad.addColorStop(0, `hsla(200, 100%, 50%, ${bass/300})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,canvas.width,canvas.height);
    }
    animate();
}

// --- DOWNLOADER ---
function setupDownloader() {
    const fetchBtn = document.getElementById('fetchVideoBtn');
    if(fetchBtn) fetchBtn.onclick = () => {
        document.getElementById('videoLoader').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('videoLoader').classList.add('hidden');
            document.getElementById('dlResult').classList.remove('hidden');
            document.getElementById('thumbPreview').src = "https://picsum.photos/600/340?r="+Math.random();
        }, 1500);
    };
    const pasteBtn = document.getElementById('pasteBtn');
    if(pasteBtn) pasteBtn.onclick = async () => {
        try { document.getElementById('videoUrl').value = await navigator.clipboard.readText(); } catch(e) {}
    };
}
