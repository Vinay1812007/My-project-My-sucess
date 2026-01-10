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
    isShuffle: false,
    isRepeat: false,
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
    
    // Theme Toggle
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.onclick = () => {
            const html = document.documentElement;
            html.setAttribute('data-theme', html.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
        };
    }

    // --- PAGE SPECIFIC LOGIC ---
    if (document.getElementById('musicGrid')) {
        setupMusicPlayer();
    } else if (document.getElementById('videoUrl')) {
        setupDownloader();
    } else if (document.getElementById('aiPrompt')) {
        setupAI();
    } else {
        // Index/Home animations could go here
        initDiscoVisualizer(true); 
    }
});

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
        searchInput.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') { 
                clearTimeout(debounce); 
                fetchSongs(e.target.value); 
            }
        });
    }
    if (searchBtn) searchBtn.onclick = () => fetchSongs(searchInput.value || 'Trending');

    document.querySelectorAll('.chip').forEach(chip => {
        chip.onclick = () => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            fetchSongs(chip.dataset.query + ' Songs India');
        };
    });

    const mixBtn = document.getElementById('myMixBtn');
    if (mixBtn) {
        mixBtn.onclick = () => {
            const mixes = ['Best of 2024 India', 'Late Night LoFi', 'Punjabi Party Mix', 'Telugu Melody Hits'];
            fetchSongs(mixes[Math.floor(Math.random() * mixes.length)]);
        };
    }

    setupControls();
    fetchSongs('Latest India Hits');
}

async function fetchSongs(query) {
    if (!query) return;
    const grid = document.getElementById('musicGrid');
    const loader = document.getElementById('loader');
    
    if (!grid) return;

    grid.innerHTML = ''; 
    if (loader) {
        grid.appendChild(loader); 
        loader.classList.remove('hidden');
    }

    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=30&country=IN`);
        const data = await res.json();
        
        if (loader) loader.classList.add('hidden');

        if (data.results && data.results.length > 0) {
            state.songQueue = data.results.map(s => ({
                id: s.trackId, trackName: s.trackName, artistName: s.artistName,
                artwork: s.artworkUrl100.replace('100x100', '600x600'), previewUrl: s.previewUrl
            }));

            state.songQueue.forEach((song, idx) => {
                if (!song.previewUrl) return;
                const card = document.createElement('div');
                card.className = 'song-card magnetic';
                card.innerHTML = `
                    <div class="art-box" style="background-image:url('${song.artwork}')">
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
        } else {
            grid.innerHTML = '<h3 style="text-align:center; padding:20px; color:var(--text-secondary);">No songs found.</h3>';
        }
    } catch (e) {
        console.error(e);
        if (loader) loader.classList.add('hidden');
        grid.innerHTML = '<h3 style="text-align:center; padding:20px; color:red;">Error loading songs.</h3>';
    }
}

function playTrack(song) {
    if (!song) return;
    
    const setText = (id, txt) => { const el = document.getElementById(id); if(el) el.innerText = txt; };
    const setBg = (id, url) => { const el = document.getElementById(id); if(el) el.style.backgroundImage = `url('${url}')`; };

    setText('trackTitle', song.trackName);
    setText('trackArtist', song.artistName);
    setText('fullTrackTitle', song.trackName);
    setText('fullTrackArtist', song.artistName);
    setBg('albumArt', song.artwork);
    setBg('fullAlbumArt', song.artwork);

    const playerBar = document.getElementById('musicPlayerBar');
    if (playerBar) playerBar.classList.add('active');

    let str = song.trackName + song.artistName;
    let hash = 0; for (let i=0; i<str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    state.colorHash = Math.abs(hash % 100) / 100;

    initAudioEngine();
    
    if (state.audio) {
        state.audio.src = song.previewUrl;
        state.audio.play()
            .then(() => updatePlayIcons(true))
            .catch(e => console.error("Play error:", e));
    }
}

function updatePlayIcons(isPlaying) {
    const icon = isPlaying ? 'fa-pause' : 'fa-play';
    const setIcon = (id) => { 
        const el = document.getElementById(id); 
        if(el) el.innerHTML = `<i class="fa-solid ${icon}"></i>`; 
    };
    setIcon('playIcon');
    setIcon('fullPlayIcon');
    
    const playBtn = document.getElementById('playBtn');
    if (playBtn) playBtn.innerHTML = `<i class="fa-solid ${icon}"></i>`;
    const fullPlayBtn = document.getElementById('fullPlayBtn');
    if (fullPlayBtn) fullPlayBtn.innerHTML = `<i class="fa-solid ${icon}"></i>`;
}

function setupControls() {
    const { audio } = state;
    if (!audio) return;

    const toggle = () => { 
        if (audio.paused) { audio.play(); updatePlayIcons(true); } 
        else { audio.pause(); updatePlayIcons(false); } 
    };
    
    const bindClick = (id, fn) => { const el = document.getElementById(id); if(el) el.onclick = fn; };

    bindClick('playBtn', toggle);
    bindClick('fullPlayBtn', toggle);
    
    const prev = () => { if(state.currentIndex > 0) playTrack(state.songQueue[--state.currentIndex]); };
    const next = () => { if(state.currentIndex < state.songQueue.length - 1) playTrack(state.songQueue[++state.currentIndex]); };

    bindClick('prevBtn', prev);
    bindClick('fullPrevBtn', prev);
    bindClick('nextBtn', next);
    bindClick('fullNextBtn', next);

    audio.onended = next;

    bindClick('miniPlayerInfo', () => document.getElementById('fullPlayer').classList.add('active'));
    bindClick('expandBtn', () => document.getElementById('fullPlayer').classList.add('active'));
    bindClick('closeFullPlayer', () => document.getElementById('fullPlayer').classList.remove('active'));

    bindClick('settingsToggle', () => document.getElementById('settingsPanel').classList.toggle('active'));
    
    const bindInput = (id, fn) => { const el = document.getElementById(id); if(el) el.oninput = fn; };
    bindInput('bassRange', (e) => setFilter('bass', e.target.value));
    bindInput('trebleRange', (e) => setFilter('treble', e.target.value));
    bindInput('volRange', (e) => audio.volume = e.target.value);

    bindClick('btnSeekBack', () => audio.currentTime -= 10);
    bindClick('btnSeekFwd', () => audio.currentTime += 10);
    bindClick('btnParty', () => {
        state.isPartyMode = !state.isPartyMode;
        alert(state.isPartyMode ? "Party Mode ON!" : "Party Mode OFF");
    });

    const pb = document.getElementById('fullProgressBar');
    audio.ontimeupdate = () => {
        if(audio.duration && pb) {
            const pct = (audio.currentTime/audio.duration)*100;
            pb.value = pct;
            const fmt = (t) => { let m=Math.floor(t/60), s=Math.floor(t%60); return `${m}:${s<10?'0':''}${s}`; };
            const currEl = document.getElementById('fullCurrTime');
            const totEl = document.getElementById('fullTotalTime');
            if(currEl) currEl.innerText = fmt(audio.currentTime);
            if(totEl) totEl.innerText = fmt(audio.duration);
        }
    };
    if(pb) pb.oninput = (e) => audio.currentTime = (e.target.value/100)*audio.duration;
}

function initAudioEngine() {
    if(state.audioCtx) { if(state.audioCtx.state === 'suspended') state.audioCtx.resume(); return; }
    
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    state.audioCtx = new AudioContext();
    state.analyser = state.audioCtx.createAnalyser();
    state.analyser.fftSize = 256;
    
    state.source = state.audioCtx.createMediaElementSource(state.audio);
    
    state.filters.bass = state.audioCtx.createBiquadFilter();
    state.filters.bass.type = "lowshelf";
    state.filters.bass.frequency.value = 200;

    state.filters.treble = state.audioCtx.createBiquadFilter();
    state.filters.treble.type = "highshelf";
    state.filters.treble.frequency.value = 2000;

    state.source.connect(state.filters.bass);
    state.filters.bass.connect(state.filters.treble);
    state.filters.treble.connect(state.analyser);
    state.analyser.connect(state.audioCtx.destination);

    initDiscoVisualizer();
}

function setFilter(type, val) {
    if(state.filters[type]) state.filters[type].gain.value = val * 2; 
}

function initDiscoVisualizer(autoAnimate = false) {
    const canvas = document.getElementById('bgCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const overlay = document.getElementById('partyOverlay');
    
    function animate() {
        requestAnimationFrame(animate);
        
        let bass = 0;
        let mids = 0;

        if (state.analyser) {
            const bufferLen = state.analyser.frequencyBinCount;
            const data = new Uint8Array(bufferLen);
            state.analyser.getByteFrequencyData(data);
            
            for(let i=0; i<10; i++) bass += data[i]; bass /= 10;
            for(let i=10; i<50; i++) mids += data[i]; mids /= 40;
        } else {
            bass = 100 + Math.sin(Date.now() * 0.002) * 50;
            mids = 100 + Math.cos(Date.now() * 0.003) * 50;
        }

        if(state.isPartyMode && bass > 220) {
            if(overlay) {
                overlay.style.opacity = 0.8;
                overlay.style.backgroundColor = `hsl(${Math.random()*360}, 100%, 50%)`;
            }
        } else {
            if(overlay) overlay.style.opacity = 0;
        }

        canvas.width = window.innerWidth; 
        canvas.height = window.innerHeight;
        
        ctx.fillStyle = '#000'; 
        ctx.fillRect(0,0,canvas.width, canvas.height);
        
        const baseHue = (state.colorHash * 360) + (bass/5);
        
        const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
        grad.addColorStop(0, `hsla(${baseHue}, 100%, 50%, ${bass/300})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,canvas.width,canvas.height);

        for(let i=0; i<5; i++) {
            const t = Date.now() * 0.001;
            const x = (Math.sin(t + i) * 0.5 + 0.5) * canvas.width;
            const y = (Math.cos(t * 0.8 + i) * 0.5 + 0.5) * canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 30 + (mids/2), 0, Math.PI*2);
            ctx.fillStyle = `hsla(${(baseHue + 180)%360}, 100%, 60%, 0.2)`;
            ctx.fill();
        }
    }
    animate();
}

// --- VIDEO DOWNLOADER ---
function setupDownloader() {
    const fetchBtn = document.getElementById('fetchVideoBtn');
    if(fetchBtn) {
        fetchBtn.onclick = () => {
            const url = document.getElementById('videoUrl').value;
            if(!url) return alert("Please paste a link first");
            
            const loader = document.getElementById('videoLoader');
            const res = document.getElementById('dlResult');
            
            if(loader) loader.classList.remove('hidden');
            if(res) res.classList.add('hidden');
            
            setTimeout(() => {
                if(loader) loader.classList.add('hidden');
                if(res) res.classList.remove('hidden');
                
                const thumb = document.getElementById('thumbPreview');
                const title = document.getElementById('vidTitle');
                if(thumb) thumb.src = "https://picsum.photos/600/340?r=" + Math.random();
                if(title) title.innerText = "Video Found: " + url.substring(0, 20) + "...";
            }, 1500);
        };
    }
    
    const pasteBtn = document.getElementById('pasteBtn');
    if(pasteBtn) {
        pasteBtn.onclick = async () => {
            try {
                const text = await navigator.clipboard.readText();
                const input = document.getElementById('videoUrl');
                if(input) input.value = text;
            } catch(e) { alert("Clipboard permission denied or not supported."); }
        };
    }
    
    const dlBtn = document.getElementById('downloadActionBtn');
    if(dlBtn) dlBtn.onclick = () => alert("Starting Download...");
}

// --- AI PAGE ---
function setupAI() {
    const btn = document.getElementById('generateBtn');
    if(btn) {
        btn.onclick = () => {
            const prompt = document.getElementById('aiPrompt').value;
            if(!prompt) return alert("Enter a prompt");
            
            const loader = document.getElementById('aiLoader');
            const res = document.getElementById('aiResult');
            
            if(loader) loader.classList.remove('hidden');
            if(res) res.classList.add('hidden');
            
            setTimeout(() => {
                if(loader) loader.classList.add('hidden');
                if(res) res.classList.remove('hidden');
                const title = document.getElementById('generatedTitle');
                if(title) title.innerText = "Result: " + prompt;
            }, 2000);
        };
    }
}
