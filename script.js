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
    // Smooth lerp
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
    const path = window.location.pathname;
    
    if (path.includes('music.html')) {
        setupMusicPlayer();
    } else if (path.includes('videodownloader.html')) {
        setupDownloader();
    } else {
        // Index/Home animations could go here
        initDiscoVisualizer(true); // Auto start background on home
    }
});

// --- MUSIC PLAYER LOGIC ---
function setupMusicPlayer() {
    state.audio = document.getElementById('audioPlayer');
    
    // Search
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    let debounce;

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounce);
            debounce = setTimeout(() => fetchSongs(e.target.value), 800);
        });
        searchInput.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') { clearTimeout(debounce); fetchSongs(e.target.value); }
        });
    }
    if (searchBtn) searchBtn.onclick = () => fetchSongs(searchInput.value || 'Trending');

    // Chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.onclick = () => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            fetchSongs(chip.dataset.query + ' Songs India');
        };
    });

    document.getElementById('myMixBtn').onclick = () => {
        const mixes = ['Best of 2024 India', 'Late Night LoFi', 'Punjabi Party Mix', 'Telugu Melody Hits'];
        fetchSongs(mixes[Math.floor(Math.random() * mixes.length)]);
    };

    // Controls
    setupControls();
    
    // Load default
    fetchSongs('Latest India Hits');
}

async function fetchSongs(query) {
    if (!query) return;
    const grid = document.getElementById('musicGrid');
    const loader = document.getElementById('loader');
    
    grid.innerHTML = ''; 
    grid.appendChild(loader); 
    loader.classList.remove('hidden');

    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=30&country=IN`);
        const data = await res.json();
        loader.classList.add('hidden');

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
    } catch (e) {
        console.error(e);
        loader.classList.add('hidden');
    }
}

function playTrack(song) {
    if (!song) return;
    
    // Update UI
    const updateText = (id, text) => { if(document.getElementById(id)) document.getElementById(id).innerText = text; };
    const updateBg = (id, url) => { if(document.getElementById(id)) document.getElementById(id).style.backgroundImage = `url('${url}')`; };

    updateText('trackTitle', song.trackName);
    updateText('trackArtist', song.artistName);
    updateText('fullTrackTitle', song.trackName);
    updateText('fullTrackArtist', song.artistName);
    updateBg('albumArt', song.artwork);
    updateBg('fullAlbumArt', song.artwork);

    const playerBar = document.getElementById('musicPlayerBar');
    if (playerBar) playerBar.classList.add('active');

    // Audio Color Hash
    let str = song.trackName + song.artistName;
    let hash = 0; for (let i=0; i<str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    state.colorHash = Math.abs(hash % 100) / 100;

    initAudioEngine();
    state.audio.src = song.previewUrl;
    state.audio.play();
    updatePlayIcons(true);
}

function updatePlayIcons(isPlaying) {
    const icon = isPlaying ? 'fa-pause' : 'fa-play';
    const setIcon = (id) => { if(document.getElementById(id)) document.getElementById(id).className = `fa-solid ${icon}`; };
    setIcon('playIcon');
    setIcon('fullPlayIcon'); // Ensure HTML has <i> inside button or adjust selector
    // Actually the button innerHTML changes or class of icon inside
    const playBtn = document.getElementById('playBtn');
    if(playBtn) playBtn.innerHTML = `<i class="fa-solid ${icon}"></i>`;
    const fullPlayBtn = document.getElementById('fullPlayBtn');
    if(fullPlayBtn) fullPlayBtn.innerHTML = `<i class="fa-solid ${icon}"></i>`;
}

function setupControls() {
    const { audio } = state;
    
    const toggle = () => { audio.paused ? audio.play() : audio.pause(); updatePlayIcons(!audio.paused); };
    
    document.getElementById('playBtn').onclick = toggle;
    document.getElementById('fullPlayBtn').onclick = toggle;
    
    const prev = () => { if(state.currentIndex > 0) playTrack(state.songQueue[--state.currentIndex]); };
    const next = () => { if(state.currentIndex < state.songQueue.length - 1) playTrack(state.songQueue[++state.currentIndex]); };

    document.getElementById('prevBtn').onclick = prev;
    document.getElementById('fullPrevBtn').onclick = prev;
    document.getElementById('nextBtn').onclick = next;
    document.getElementById('fullNextBtn').onclick = next;

    audio.onended = next;

    // Full Screen Toggle
    document.getElementById('miniPlayerInfo').onclick = () => document.getElementById('fullPlayer').classList.add('active');
    document.getElementById('expandBtn').onclick = () => document.getElementById('fullPlayer').classList.add('active');
    document.getElementById('closeFullPlayer').onclick = () => document.getElementById('fullPlayer').classList.remove('active');

    // Settings
    document.getElementById('settingsToggle').onclick = () => document.getElementById('settingsPanel').classList.toggle('active');
    
    // EQ Inputs
    document.getElementById('bassRange').oninput = (e) => setFilter('bass', e.target.value);
    document.getElementById('trebleRange').oninput = (e) => setFilter('treble', e.target.value);
    document.getElementById('volRange').oninput = (e) => audio.volume = e.target.value;

    // Seek / Extra
    document.getElementById('btnSeekBack').onclick = () => audio.currentTime -= 10;
    document.getElementById('btnSeekFwd').onclick = () => audio.currentTime += 10;
    document.getElementById('btnParty').onclick = () => {
        state.isPartyMode = !state.isPartyMode;
        alert(state.isPartyMode ? "Party Mode ON!" : "Party Mode OFF");
    };

    // Progress
    const pb = document.getElementById('fullProgressBar');
    audio.ontimeupdate = () => {
        if(audio.duration) {
            const pct = (audio.currentTime/audio.duration)*100;
            pb.value = pct;
            document.getElementById('fullCurrTime').innerText = (audio.currentTime/60).toFixed(2).replace('.',':');
            document.getElementById('fullTotalTime').innerText = (audio.duration/60).toFixed(2).replace('.',':');
        }
    };
    pb.oninput = (e) => audio.currentTime = (e.target.value/100)*audio.duration;
}

// --- AUDIO ENGINE ---
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

// --- VISUALIZER ---
function initDiscoVisualizer(autoAnimate = false) {
    const canvas = document.getElementById('bgCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const overlay = document.getElementById('partyOverlay');
    
    // If running on home page without music, just animate slowly
    // If music page, sync to analyser
    
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
            // Idle animation
            bass = 100 + Math.sin(Date.now() * 0.002) * 50;
            mids = 100 + Math.cos(Date.now() * 0.003) * 50;
        }

        if(state.isPartyMode && bass > 220) {
            overlay.style.opacity = 0.8;
            overlay.style.backgroundColor = `hsl(${Math.random()*360}, 100%, 50%)`;
        } else {
            if(overlay) overlay.style.opacity = 0;
        }

        canvas.width = window.innerWidth; 
        canvas.height = window.innerHeight;
        
        ctx.fillStyle = '#000'; 
        ctx.fillRect(0,0,canvas.width, canvas.height);
        
        const baseHue = (state.colorHash * 360) + (bass/5);
        
        // Gradient BG
        const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
        grad.addColorStop(0, `hsla(${baseHue}, 100%, 50%, ${bass/300})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,canvas.width,canvas.height);

        // Spotlights
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
            
            loader.classList.remove('hidden');
            res.classList.add('hidden');
            
            // Mock API delay
            setTimeout(() => {
                loader.classList.add('hidden');
                res.classList.remove('hidden');
                document.getElementById('thumbPreview').src = "https://picsum.photos/600/340?r=" + Math.random();
                document.getElementById('vidTitle').innerText = "Video Found: " + url.substring(0, 20) + "...";
            }, 1500);
        };
    }
    
    const pasteBtn = document.getElementById('pasteBtn');
    if(pasteBtn) {
        pasteBtn.onclick = async () => {
            try {
                const text = await navigator.clipboard.readText();
                document.getElementById('videoUrl').value = text;
            } catch(e) { alert("Clipboard permission denied"); }
        };
    }
    
    const dlBtn = document.getElementById('downloadActionBtn');
    if(dlBtn) dlBtn.onclick = () => alert("Starting Download...");
}
