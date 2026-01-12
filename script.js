// --- CONFIG & STATE ---
const state = {
    audio: null,
    audioCtx: null,
    analyser: null,
    source: null,
    songQueue: [],
    currentIndex: 0,
    theme: 'dark'
};

// --- CUSTOM CURSOR ---
const cursor = document.getElementById('cursor');
let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateCursor() {
    if (window.innerWidth > 768 && cursor) {
        cursorX += (mouseX - cursorX) * 0.15;
        cursorY += (mouseY - cursorY) * 0.15;
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
    }
    requestAnimationFrame(animateCursor);
}
requestAnimationFrame(animateCursor);

function applyMagnetic() {
    if (window.innerWidth <= 768) return;
    document.querySelectorAll('.magnetic').forEach(el => {
        el.onmouseenter = () => cursor && cursor.classList.add('hovered');
        el.onmouseleave = () => cursor && cursor.classList.remove('hovered');
    });
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    applyMagnetic();
    
    // Theme Toggle Logic
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.onclick = () => {
            const html = document.documentElement;
            const current = html.getAttribute('data-theme');
            const next = current === 'light' ? 'dark' : 'light';
            html.setAttribute('data-theme', next);
            
            // Icon Swap
            const icon = themeBtn.querySelector('i');
            if(icon) {
                icon.className = next === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
            }
        };
    }

    // Page Specific Init
    if (document.getElementById('musicGrid')) {
        setupMusicPlayer();
    } else if (document.getElementById('videoUrl')) {
        setupDownloader();
    } else if (document.getElementById('chatContainer')) {
        setupAI();
    }
    
    // Always init visualizer background
    initDiscoVisualizer(); 
});

// --- AI CHAT LOGIC ---
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
        
        const loadingBubble = appendMessage('ai', 'Thinking...');
        
        // Mock Response for Demo
        setTimeout(() => {
            loadingBubble.innerText = "This is a demo response. To get real answers, you would need to connect to an API like OpenAI or Google Gemini in the backend.";
        }, 1500);
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
        chip.onclick = () => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            fetchSongs(chip.dataset.query + ' Songs India');
        };
    });

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
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=24&country=IN`);
        const data = await res.json();
        
        if (loader) loader.classList.add('hidden');

        state.songQueue = data.results.filter(s => s.previewUrl); 

        state.songQueue.forEach((song, idx) => {
            const card = document.createElement('div');
            card.className = 'song-card magnetic';
            card.style.animationDelay = `${idx * 0.05}s`; 
            
            const artwork = song.artworkUrl100.replace('100x100', '600x600');
            card.innerHTML = `
                <div class="art-box" style="background-image:url('${artwork}')">
                    <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
                </div>
                <div class="song-info">
                    <h3>${song.trackName}</h3>
                    <p>${song.artistName}</p>
                </div>`;
            
            card.onclick = () => { state.currentIndex = idx; playTrack(song); };
            grid.appendChild(card);
        });
        applyMagnetic();
    } catch (e) {
        console.error(e);
        if (loader) loader.classList.add('hidden');
        grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-secondary)">Failed to load music. Try again.</p>';
    }
}

function playTrack(song) {
    if (!song) return;
    const setText = (id, txt) => { const el = document.getElementById(id); if(el) el.innerText = txt; };
    const setBg = (id, url) => { const el = document.getElementById(id); if(el) el.style.backgroundImage = `url('${url}')`; };
    
    const artwork = song.artworkUrl100.replace('100x100', '600x600');
    setText('trackTitle', song.trackName); setText('trackArtist', song.artistName);
    setText('fullTrackTitle', song.trackName); setText('fullTrackArtist', song.artistName);
    setBg('albumArt', artwork); setBg('fullAlbumArt', artwork);
    
    document.getElementById('musicPlayerBar').classList.add('active');
    
    initAudioEngine();
    if (state.audio) { 
        state.audio.src = song.previewUrl; 
        state.audio.play().catch(e => console.log("Autoplay blocked")); 
    }
}

function setupControls() {
    const { audio } = state;
    const playBtn = document.getElementById('playBtn');
    const fullPlayBtn = document.getElementById('fullPlayBtn');

    if (!audio) return;
    
    const toggle = () => {
        if(audio.paused) {
            audio.play();
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            fullPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        } else {
            audio.pause();
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            fullPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    };

    playBtn.onclick = toggle;
    fullPlayBtn.onclick = toggle;
    document.getElementById('miniPlayerInfo').onclick = () => document.getElementById('fullPlayer').classList.add('active');
    document.getElementById('expandBtn').onclick = () => document.getElementById('fullPlayer').classList.add('active');
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
    state.analyser.fftSize = 256;
}

function initDiscoVisualizer() {
    const canvas = document.getElementById('bgCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Resize Handler
    const resize = () => {
        canvas.width = window.innerWidth; 
        canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
    
    function animate() {
        requestAnimationFrame(animate);
        let bass = 0;
        
        if (state.analyser) {
            const bufferLen = state.analyser.frequencyBinCount;
            const data = new Uint8Array(bufferLen);
            state.analyser.getByteFrequencyData(data);
            // Average the lower frequencies for bass
            for(let i=0; i<10; i++) bass += data[i];
            bass = bass / 10;
        } else {
             // Idle animation
             bass = 50 + Math.sin(Date.now() * 0.002) * 20;
        }

        ctx.fillStyle = '#000'; 
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillRect(0,0,canvas.width, canvas.height);
        
        // Dynamic Gradient Background
        const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width * 0.8);
        const hue = (Date.now() * 0.05) % 360;
        const opacity = Math.min(bass / 150, 0.8);
        
        grad.addColorStop(0, `hsla(${hue}, 80%, 50%, ${opacity})`);
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
        const url = document.getElementById('videoUrl').value;
        if(!url) return;

        const loader = document.getElementById('videoLoader');
        const result = document.getElementById('dlResult');
        
        result.classList.add('hidden');
        loader.classList.remove('hidden');
        
        setTimeout(() => {
            loader.classList.add('hidden');
            result.classList.remove('hidden');
            result.classList.add('animate-enter'); 
            
            document.getElementById('thumbPreview').src = "https://picsum.photos/600/340?r="+Math.random();
            document.getElementById('vidTitle').innerText = "Video Found: " + url.substring(0, 20) + "...";
        }, 1500);
    };
}
