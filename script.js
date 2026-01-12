// --- STATE MANAGEMENT ---
const state = {
    audio: document.getElementById('audioPlayer'),
    queue: [],
    originalQueue: [], // For un-shuffling
    currentIndex: 0,
    isPlaying: false,
    isShuffle: false,
    repeatMode: 'off', // off, all, one
    audioCtx: null,
    analyser: null,
    source: null,
    theme: 'dark'
};

// --- DOM ELEMENTS ---
const els = {
    playBtn: document.getElementById('playBtn'),
    fullPlayIcon: document.getElementById('fullPlayIcon'),
    nextBtn: document.getElementById('nextBtn'),
    prevBtn: document.getElementById('prevBtn'),
    shuffleBtn: document.getElementById('shuffleBtn'),
    repeatBtn: document.getElementById('repeatBtn'),
    progressBar: document.getElementById('progressBar'),
    progressFill: document.getElementById('progressFill'),
    fullProgressBar: document.getElementById('fullProgressBar'),
    fullProgressFill: document.getElementById('fullProgressFill'),
    queuePanel: document.getElementById('queuePanel'),
    queueList: document.getElementById('queueList'),
    likeBtnMini: document.getElementById('likeBtnMini'),
    likeBtnFull: document.getElementById('likeBtnFull')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Only fetch songs if we are on the music page
    if (document.getElementById('musicGrid')) {
        fetchSongs('Top Hits India');
    }
    
    setupEventListeners();
    setupVisualizer();
    setupCursor();
    setupAI();
    
    // Theme Init
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
});

// --- API & DATA ---
// Makes global for HTML access
window.fetchSongs = async function(query) {
    showToast(`Searching: ${query}...`);
    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=50`);
        const data = await res.json();
        
        // Filter songs that have previews
        state.queue = data.results.filter(song => song.previewUrl);
        state.originalQueue = [...state.queue];
        state.currentIndex = 0;
        
        renderGrid();
        updateQueueUI();
    } catch (e) {
        showToast("Error fetching songs");
        console.error(e);
    }
};

function renderGrid() {
    const grid = document.getElementById('musicGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    state.queue.forEach((song, index) => {
        const card = document.createElement('div');
        card.className = 'song-card magnetic';
        card.style.animationDelay = `${index * 0.05}s`;
        
        const artwork = song.artworkUrl100.replace('100x100', '400x400');
        card.innerHTML = `
            <div class="art-box" style="background-image: url('${artwork}')">
                <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
            </div>
            <div class="track-info">
                <h4>${song.trackName}</h4>
                <p>${song.artistName}</p>
            </div>
        `;
        card.onclick = () => playSong(index);
        grid.appendChild(card);
    });
    addMagneticEffect();
}

// --- PLAYBACK LOGIC ---
function playSong(index) {
    if (state.audioCtx && state.audioCtx.state === 'suspended') state.audioCtx.resume();

    state.currentIndex = index;
    const song = state.queue[index];
    
    // Load Audio
    state.audio.src = song.previewUrl;
    state.audio.play()
        .then(() => {
            state.isPlaying = true;
            updatePlayBtnUI();
            updatePlayerUI(song);
            const bar = document.getElementById('playerBar');
            if(bar) bar.classList.add('active');
        })
        .catch(err => {
            console.error("Playback error", err);
            showToast("Cannot play this track");
        });
}

function togglePlay() {
    if (!state.audio.src) return;
    if (state.audio.paused) {
        state.audio.play();
        state.isPlaying = true;
    } else {
        state.audio.pause();
        state.isPlaying = false;
    }
    updatePlayBtnUI();
}

function nextSong() {
    if (state.repeatMode === 'one') {
        state.audio.currentTime = 0;
        state.audio.play();
        return;
    }
    
    let nextIndex = state.currentIndex + 1;
    if (nextIndex >= state.queue.length) nextIndex = 0;
    playSong(nextIndex);
}

function prevSong() {
    if (state.audio.currentTime > 3) {
        state.audio.currentTime = 0;
        return;
    }
    let prevIndex = state.currentIndex - 1;
    if (prevIndex < 0) prevIndex = state.queue.length - 1;
    playSong(prevIndex);
}

// --- UI UPDATES ---
function updatePlayBtnUI() {
    const icon = state.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    if(els.playBtn) els.playBtn.innerHTML = icon;
    if(els.fullPlayIcon) els.fullPlayIcon.className = state.isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play";
}

function updatePlayerUI(song) {
    // Mini Player
    const miniTitle = document.getElementById('miniTitle');
    const miniArtist = document.getElementById('miniArtist');
    const miniArt = document.getElementById('miniArt');
    
    if (miniTitle) miniTitle.innerText = song.trackName;
    if (miniArtist) miniArtist.innerText = song.artistName;
    if (miniArt) miniArt.style.backgroundImage = `url('${song.artworkUrl100}')`;
    
    // Full Player
    const fullTitle = document.getElementById('fullTitle');
    const fullArtist = document.getElementById('fullArtist');
    const fullArt = document.getElementById('fullArt');

    if (fullTitle) fullTitle.innerText = song.trackName;
    if (fullArtist) fullArtist.innerText = song.artistName;
    if (fullArt) fullArt.style.backgroundImage = `url('${song.artworkUrl100.replace('100x100','600x600')}')`;

    // Check Like Status
    const liked = localStorage.getItem(`liked_${song.trackId}`);
    const heartClass = liked ? "fa-solid fa-heart" : "fa-regular fa-heart";
    const color = liked ? "var(--accent)" : "var(--text-secondary)";
    
    if(els.likeBtnMini) { els.likeBtnMini.innerHTML = `<i class="${heartClass}"></i>`; els.likeBtnMini.style.color = color; }
    if(els.likeBtnFull) { els.likeBtnFull.innerHTML = `<i class="${heartClass}"></i>`; els.likeBtnFull.style.color = color; }
    
    updateQueueUI(); 
}

// --- QUEUE & CONTROLS ---
function updateQueueUI() {
    if (!els.queueList) return;
    els.queueList.innerHTML = '';
    state.queue.forEach((song, idx) => {
        const item = document.createElement('div');
        item.className = `queue-item ${idx === state.currentIndex ? 'active' : ''}`;
        item.innerHTML = `
            <img src="${song.artworkUrl60}" style="width:40px; border-radius:4px;">
            <div style="flex:1;">
                <div style="font-size:0.9rem; font-weight:600; color:${idx === state.currentIndex ? 'var(--accent)' : 'var(--text-primary)'}">${song.trackName}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary);">${song.artistName}</div>
            </div>
            ${idx === state.currentIndex ? '<i class="fa-solid fa-chart-simple"></i>' : ''}
        `;
        item.onclick = () => playSong(idx);
        els.queueList.appendChild(item);
    });
}

function toggleShuffle() {
    state.isShuffle = !state.isShuffle;
    els.shuffleBtn.classList.toggle('active');
    
    if (state.isShuffle) {
        // Shuffle current queue except current song
        const currentSong = state.queue[state.currentIndex];
        const rest = state.queue.filter((_, i) => i !== state.currentIndex);
        for (let i = rest.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rest[i], rest[j]] = [rest[j], rest[i]];
        }
        state.queue = [currentSong, ...rest];
        state.currentIndex = 0;
    } else {
        // Restore original order
        const currentId = state.queue[state.currentIndex].trackId;
        state.queue = [...state.originalQueue];
        const newIndex = state.queue.findIndex(s => s.trackId === currentId);
        state.currentIndex = newIndex !== -1 ? newIndex : 0;
    }
    updateQueueUI();
    showToast(`Shuffle ${state.isShuffle ? 'On' : 'Off'}`);
}

function toggleRepeat() {
    if (state.repeatMode === 'off') {
        state.repeatMode = 'all';
        els.repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
        els.repeatBtn.classList.add('active');
        showToast("Repeat All");
    } else if (state.repeatMode === 'all') {
        state.repeatMode = 'one';
        els.repeatBtn.innerHTML = '<i class="fa-solid fa-1"></i>';
        showToast("Repeat One");
    } else {
        state.repeatMode = 'off';
        els.repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
        els.repeatBtn.classList.remove('active');
        showToast("Repeat Off");
    }
}

function toggleLike() {
    const song = state.queue[state.currentIndex];
    if (!song) return;
    
    const key = `liked_${song.trackId}`;
    if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        showToast("Removed from Liked Songs");
    } else {
        localStorage.setItem(key, "true");
        showToast("Added to Liked Songs");
    }
    updatePlayerUI(song);
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    if (els.playBtn) els.playBtn.onclick = togglePlay;
    if (els.nextBtn) els.nextBtn.onclick = nextSong;
    if (els.prevBtn) els.prevBtn.onclick = prevSong;
    if (els.shuffleBtn) els.shuffleBtn.onclick = toggleShuffle;
    if (els.repeatBtn) els.repeatBtn.onclick = toggleRepeat;
    if (els.likeBtnMini) els.likeBtnMini.onclick = toggleLike;

    const qToggle = document.getElementById('queueToggle');
    if (qToggle) qToggle.onclick = () => els.queuePanel.classList.toggle('open');
    
    const sBtn = document.getElementById('searchBtn');
    if (sBtn) sBtn.onclick = () => {
        const input = document.getElementById('searchInput');
        if(input) fetchSongs(input.value);
    };
    
    const tToggle = document.getElementById('themeToggle');
    if (tToggle) tToggle.onclick = () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        const icon = tToggle.querySelector('i');
        if(icon) icon.className = next === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    };

    // Seek Bar
    if (state.audio) {
        state.audio.ontimeupdate = () => {
            if(!state.audio.duration) return;
            const pct = (state.audio.currentTime / state.audio.duration) * 100;
            if(els.progressFill) els.progressFill.style.width = pct + '%';
            if(els.fullProgressFill) els.fullProgressFill.style.width = pct + '%';
            
            const format = t => {
                const min = Math.floor(t / 60);
                const sec = Math.floor(t % 60).toString().padStart(2, '0');
                return `${min}:${sec}`;
            };
            const curr = document.getElementById('currTime');
            if(curr) curr.innerText = format(state.audio.currentTime);
            const fullCurr = document.getElementById('fullCurrTime');
            if(fullCurr) fullCurr.innerText = format(state.audio.currentTime);
        };
        
        state.audio.onended = nextSong;
    }

    // Click on progress bar to seek
    [els.progressBar, els.fullProgressBar].forEach(bar => {
        if (bar) {
            bar.onclick = (e) => {
                const rect = bar.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                state.audio.currentTime = pct * state.audio.duration;
            };
        }
    });

    // Volume
    const vol = document.getElementById('volSlider');
    if (vol) {
        vol.oninput = (e) => {
            state.audio.volume = e.target.value;
        };
    }
    const mute = document.getElementById('muteBtn');
    if (mute) {
        mute.onclick = () => {
            state.audio.muted = !state.audio.muted;
            const icon = mute.querySelector('i');
            icon.className = state.audio.muted ? "fa-solid fa-volume-xmark" : "fa-solid fa-volume-high";
            showToast(state.audio.muted ? "Muted" : "Unmuted");
        };
    }
}

// --- FULL PLAYER UTILS ---
window.openFullPlayer = () => {
    const fp = document.getElementById('fullPlayer');
    if(fp) fp.classList.add('active');
};
window.closeFullPlayer = () => {
    const fp = document.getElementById('fullPlayer');
    if(fp) fp.classList.remove('active');
};

// --- VISUALIZER ---
function setupVisualizer() {
    const canvas = document.getElementById('bgCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Auto-init context on first click
    document.body.addEventListener('click', () => {
        if (!state.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            state.audioCtx = new AudioContext();
            state.analyser = state.audioCtx.createAnalyser();
            state.source = state.audioCtx.createMediaElementSource(state.audio);
            state.source.connect(state.analyser);
            state.analyser.connect(state.audioCtx.destination);
            state.analyser.fftSize = 256;
        }
    }, { once: true });

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
            const data = new Uint8Array(state.analyser.frequencyBinCount);
            state.analyser.getByteFrequencyData(data);
            // Simple bass average from low frequencies
            bass = (data[0] + data[1] + data[2] + data[3]) / 4; 
        } else {
             bass = 20 + Math.sin(Date.now() * 0.002) * 10;
        }
        
        const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 10, canvas.width/2, canvas.height/2, canvas.width);
        const hue = (Date.now() * 0.02) % 360;
        // Pulse effect based on bass
        const alpha = Math.min(0.2 + (bass / 400), 0.6);
        
        grad.addColorStop(0, `hsla(${hue}, 80%, 50%, ${alpha})`);
        grad.addColorStop(1, 'transparent');
        
        ctx.clearRect(0,0, canvas.width, canvas.height);
        ctx.fillStyle = grad;
        ctx.fillRect(0,0, canvas.width, canvas.height);
    }
    animate();
}

// --- AI CHAT (Secure Vercel Logic) ---
function setupAI() {
    const btn = document.getElementById('generateBtn');
    const input = document.getElementById('aiPrompt');
    const container = document.getElementById('chatContainer');
    let clientHistory = [];

    if(!btn || !input || !container) return;

    function appendMessage(role, text) {
        const div = document.createElement('div');
        div.className = `message ${role}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerHTML = role === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';
        
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.innerText = text;
        
        if (role === 'user') { div.appendChild(bubble); div.appendChild(avatar); } 
        else { div.appendChild(avatar); div.appendChild(bubble); }
        
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
        
        try {
            // Using the secure Vercel API endpoint
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: text, history: clientHistory })
            });

            const data = await response.json();
            
            if (data.error) {
                loadingBubble.innerText = "Error: " + data.error;
            } else {
                loadingBubble.innerText = data.result;
                clientHistory.push({ role: "user", content: text });
                clientHistory.push({ role: "assistant", content: data.result });
            }
        } catch(e) {
            console.error(e);
            loadingBubble.innerText = "Backend not connected. This is a frontend demo.";
        }
    }

    btn.onclick = sendRequest;
    input.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendRequest(); });
}

// --- CURSOR ---
function setupCursor() {
    const cursor = document.getElementById('cursor');
    if(!cursor) return;
    document.addEventListener('mousemove', e => {
        if(window.innerWidth > 768) {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        }
    });
    addMagneticEffect();
}

function addMagneticEffect() {
    document.querySelectorAll('.magnetic').forEach(el => {
        el.onmouseenter = () => {
            const cursor = document.getElementById('cursor');
            if(cursor) {
                cursor.style.transform = "translate(-50%, -50%) scale(2.5)";
                cursor.style.background = "rgba(255,255,255,0.1)";
            }
        };
        el.onmouseleave = () => {
            const cursor = document.getElementById('cursor');
            if(cursor) {
                cursor.style.transform = "translate(-50%, -50%) scale(1)";
                cursor.style.background = "rgba(255,255,255,0.8)";
            }
        };
    });
}

// --- TOAST NOTIFICATION ---
window.showToast = (msg) => {
    const t = document.getElementById('toast');
    if (!t) return;
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
};
