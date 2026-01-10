window['__onGCastApiAvailable'] = function(isAvailable) { if (isAvailable) { cast.framework.CastContext.getInstance().setOptions({ receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID, autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED }); if(document.getElementById('castBtn')) document.getElementById('castBtn').style.display = 'inline-block'; } };

// --- GLOBAL VARIABLES ---
let currentLang = 'All';
let currentMood = 'Trending';
let currentSong = null;
let songQueue = [];
let currentIndex = 0;
let audio, playBtn, playIcon, albumArt, fullPlayer, playerBar, neonBg;
let is3DActive = false, isPartyActive = false, spatialAngle = 0;
let audioContext, spatialPanner, bassFilter, analyser, source, trackStream;

// --- GLOBAL SEARCH FUNCTIONS (Linked to Buttons) ---
window.setLanguage = function(lang) {
    currentLang = lang;
    document.querySelectorAll('.lang-chip').forEach(c => c.classList.remove('active'));
    if(event && event.target) event.target.classList.add('active');
    triggerSearch();
};

window.searchMood = function(mood) {
    currentMood = mood;
    document.querySelectorAll('.mood-chip').forEach(c => c.classList.remove('active'));
    if(event && event.target) event.target.classList.add('active');
    triggerSearch();
};

function triggerSearch() {
    let query = "";
    // Smart Combine: "Telugu" + "Party" = "Telugu Party Songs"
    if (currentLang === 'All') query = `${currentMood} Songs India`;
    else query = `${currentLang} ${currentMood} Songs`;
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = query; // Visual update so user sees what's happening
        fetchSongs(query); // Run Search
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initSmokeEffect();
    initThemeAndEffects();

    // DOM Elements
    audio = document.getElementById('audioPlayer');
    playBtn = document.getElementById('playBtn');
    playIcon = document.getElementById('playIcon');
    albumArt = document.getElementById('albumArt');
    fullPlayer = document.getElementById('fullPlayer');
    playerBar = document.getElementById('musicPlayerBar');
    neonBg = document.getElementById('neonBg');
    const searchInput = document.getElementById('searchInput');

    // Initial Load
    if(document.getElementById('musicGrid')) {
        fetchSongs('Latest India Hits');
    }

    // Manual Typing Search
    let debounceTimer;
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => { fetchSongs(e.target.value); }, 800);
        });
    }

    // --- APPLE ITUNES API SEARCH (Strict) ---
    async function fetchSongs(query, autoPlay=false) {
        const grid = document.getElementById('musicGrid');
        const loader = document.getElementById('loader');
        
        if(!grid) return;

        grid.innerHTML = '';
        grid.appendChild(loader);
        loader.classList.remove('hidden');
        songQueue = [];

        try {
            // Using iTunes Search API (No Key Required, High Quality M4A)
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=35&country=IN`);
            const data = await res.json();
            
            loader.classList.add('hidden');

            if (data.results && data.results.length > 0) {
                songQueue = data.results.map(s => ({
                    id: s.trackId,
                    trackName: s.trackName,
                    artistName: s.artistName,
                    artwork: s.artworkUrl100.replace('100x100', '600x600'), // High Res
                    previewUrl: s.previewUrl,
                    album: s.collectionName
                }));

                songQueue.forEach((song, idx) => {
                    if(!song.previewUrl) return;
                    const card = document.createElement('div');
                    card.className = 'song-card';
                    card.innerHTML = `
                        <div class="art-box" style="background-image:url('${song.artwork}')">
                            <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
                        </div>
                        <div class="song-info">
                            <h3>${song.trackName}</h3>
                            <p>${song.artistName}</p>
                        </div>`;
                    card.addEventListener('click', () => { currentIndex = idx; playTrack(song); });
                    grid.appendChild(card);
                });
                
                if(autoPlay) playTrack(songQueue[0]);

            } else {
                grid.innerHTML = '<h3 style="text-align:center;width:100%;margin-top:50px;color:var(--text-secondary);">No songs found.</h3>';
            }
        } catch (e) {
            loader.classList.add('hidden');
            console.error(e);
        }
    }

    function playTrack(song) {
        currentSong = song;
        initAudioEngine();

        // Reveal Player Bar (Slide Up Animation)
        playerBar.classList.add('active');
        playerBar.classList.add('edge-glow');

        // Update Metadata
        document.getElementById('trackTitle').innerText = song.trackName;
        document.getElementById('trackArtist').innerText = song.artistName;
        albumArt.style.backgroundImage = `url('${song.artwork}')`;
        document.getElementById('fullTrackTitle').innerText = song.trackName;
        document.getElementById('fullTrackArtist').innerText = song.artistName;
        document.getElementById('fullAlbumArt').style.backgroundImage = `url('${song.artwork}')`;
        
        // Full Player Background
        const fullBg = document.querySelector('.full-bg-blur');
        if(fullBg) fullBg.style.backgroundImage = `url('${song.artwork}')`;

        // Theme Color Extraction
        const h = Math.abs((song.trackName.length * 47) % 360);
        document.documentElement.style.setProperty('--neon-main', `hsl(${h}, 100%, 60%)`);

        // Setup YouTube Button
        const ytBtn = document.getElementById('youtubeBtn');
        if(ytBtn) ytBtn.onclick = () => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(song.trackName + " " + song.artistName)}`, '_blank');

        // Play
        audio.src = song.previewUrl;
        audio.play().then(() => {
            updatePlayIcons(true);
        }).catch(err => console.log("Audio play error", err));
    }

    function togglePlay() {
        if(audio.paused) { audio.play(); updatePlayIcons(true); } 
        else { audio.pause(); updatePlayIcons(false); }
    }

    function updatePlayIcons(isPlaying) {
        const iconClass = isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
        playIcon.className = iconClass;
        document.getElementById('fullPlayIcon').className = iconClass;
        if(isPlaying) albumArt.classList.add('spinning'); else albumArt.classList.remove('spinning');
    }

    // --- CONTROLS & LISTENERS ---
    if(playBtn) {
        playBtn.addEventListener('click', togglePlay);
        document.getElementById('fullPlayBtn').addEventListener('click', togglePlay);
        document.getElementById('prevBtn').addEventListener('click', () => { if(currentIndex>0) playTrack(songQueue[--currentIndex]); });
        document.getElementById('fullPrevBtn').addEventListener('click', () => { if(currentIndex>0) playTrack(songQueue[--currentIndex]); });
        document.getElementById('nextBtn').addEventListener('click', () => { if(currentIndex<songQueue.length-1) playTrack(songQueue[++currentIndex]); });
        document.getElementById('fullNextBtn').addEventListener('click', () => { if(currentIndex<songQueue.length-1) playTrack(songQueue[++currentIndex]); });
        audio.addEventListener('ended', () => { if(currentIndex<songQueue.length-1) playTrack(songQueue[++currentIndex]); });
        
        // Toggle Full Player
        albumArt.addEventListener('click', () => fullPlayer.classList.add('active'));
        document.getElementById('closeFullPlayer').addEventListener('click', () => fullPlayer.classList.remove('active'));
        
        // Progress Bar
        const progressBar = document.getElementById('progressBar');
        const fullProgressBar = document.getElementById('fullProgressBar');
        audio.addEventListener('timeupdate', () => {
            if(audio.duration) {
                const pct = (audio.currentTime / audio.duration) * 100;
                progressBar.value = pct;
                fullProgressBar.value = pct;
                document.getElementById('currTime').innerText = formatTime(audio.currentTime);
                document.getElementById('fullCurrTime').innerText = formatTime(audio.currentTime);
                document.getElementById('totalTime').innerText = formatTime(audio.duration);
                document.getElementById('fullTotalTime').innerText = formatTime(audio.duration);
            }
        });
        progressBar.addEventListener('input', (e) => audio.currentTime = (audio.duration/100)*e.target.value);
        fullProgressBar.addEventListener('input', (e) => audio.currentTime = (audio.duration/100)*e.target.value);
    }

    function formatTime(s) { let m = Math.floor(s/60); let sec = Math.floor(s%60); return `${m}:${sec<10?'0':''}${sec}`; }

    // --- AUDIO ENGINE ---
    function initAudioEngine() {
        if(audioContext) return;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        source = audioContext.createMediaElementSource(audio);
        bassFilter = audioContext.createBiquadFilter();
        bassFilter.type = "lowshelf"; bassFilter.frequency.value = 200;
        spatialPanner = audioContext.createPanner();
        spatialPanner.panningModel = 'HRTF';
        
        source.connect(bassFilter);
        bassFilter.connect(spatialPanner);
        spatialPanner.connect(analyser);
        analyser.connect(audioContext.destination);
        renderVisualizer();
    }

    function renderVisualizer() {
        const canvas = document.getElementById('visualizerCanvas');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        function animate() {
            requestAnimationFrame(animate);
            analyser.getByteFrequencyData(dataArray);
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;
            let totalVol = 0;
            for(let i=0; i<bufferLength; i++) {
                totalVol += dataArray[i];
                const barHeight = dataArray[i] * 1.5;
                ctx.fillStyle = `rgba(255, 255, 255, ${dataArray[i]/500})`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
            // 3D Effect
            if(is3DActive) { spatialAngle += 0.01; spatialPanner.setPosition(Math.sin(spatialAngle)*3, 0, Math.cos(spatialAngle)*3); }
            // Party Flash
            if(isPartyActive && (totalVol/bufferLength) > 100) {
                document.getElementById('partyOverlay').style.opacity = 0.2;
                document.getElementById('partyOverlay').style.backgroundColor = `hsl(${Math.random()*360}, 100%, 50%)`;
            } else {
                document.getElementById('partyOverlay').style.opacity = 0;
            }
        }
        animate();
    }

    // --- BUTTONS ---
    const dolby = document.getElementById('dolbyBtn');
    if(dolby) dolby.addEventListener('click', function() {
        initAudioEngine(); is3DActive = !is3DActive; this.classList.toggle('active');
        if(!is3DActive && spatialPanner) spatialPanner.setPosition(0,0,0);
    });

    const party = document.getElementById('partyBtn');
    if(party) party.addEventListener('click', async function() {
        initAudioEngine(); isPartyActive = !isPartyActive; this.classList.toggle('active');
        const overlay = document.getElementById('partyOverlay');
        if(isPartyActive) {
            try { const s = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}}); trackStream = s.getVideoTracks()[0]; } catch(e){}
            overlay.style.opacity = 0.3;
        } else {
            if(trackStream) trackStream.stop();
            overlay.style.opacity = 0;
        }
    });

    // --- LYRICS (Simulated) ---
    const lyrBtn = document.getElementById('lyricsBtn');
    if(lyrBtn) lyrBtn.addEventListener('click', () => {
        if(!currentSong) return;
        document.getElementById('lyricsPanel').classList.add('active');
        document.getElementById('lyricsText').innerHTML = `
            <h2 style="color:var(--neon-main); margin-bottom:20px;">${currentSong.trackName}</h2>
            <div id="simLyrics" style="font-size:1.5rem; line-height:2.5;">
                <span class="lyrics-highlight">Loading Lyrics...</span>
            </div>
        `;
        // Simulate Lyric Fetch
        setTimeout(() => {
            fetch(`https://api.lyrics.ovh/v1/${currentSong.artistName}/${currentSong.trackName}`)
            .then(r=>r.json())
            .then(d => {
                if(d.lyrics) {
                    const lines = d.lyrics.split('\n').map(l => `<span class="lyrics-highlight">${l}</span>`).join('<br>');
                    document.getElementById('simLyrics').innerHTML = lines;
                } else throw new Error();
            }).catch(() => document.getElementById('simLyrics').innerHTML = "Lyrics not available for this track.");
        }, 1500);
    });
    const clsLyr = document.getElementById('closeLyrics');
    if(clsLyr) clsLyr.addEventListener('click', () => document.getElementById('lyricsPanel').classList.remove('active'));
});

// --- EFFECTS: HOLI & SMOKE ---
function initThemeAndEffects() {
    const themeBtn = document.getElementById('themeToggle');
    
    // Holi Click (Only on Light Mode)
    document.addEventListener('click', (e) => {
        if(document.documentElement.getAttribute('data-theme') === 'light') {
            createHoliBlast(e.clientX, e.clientY);
        }
    });
}

function createHoliBlast(x, y) {
    const colors = ['#ff0055', '#00ffff', '#ffff00', '#00ff00', '#ff00ff'];
    for(let i=0; i<15; i++) {
        const p = document.createElement('div');
        p.classList.add('holi-particle');
        document.body.appendChild(p);
        const size = Math.random()*15 + 5;
        p.style.width = `${size}px`; p.style.height = `${size}px`;
        p.style.background = colors[Math.floor(Math.random()*colors.length)];
        p.style.left = `${x}px`; p.style.top = `${y}px`;
        p.style.setProperty('--tx', (Math.random()-0.5)*300+'px');
        p.style.setProperty('--ty', (Math.random()-0.5)*300+'px');
        setTimeout(() => p.remove(), 600);
    }
}

// SMOKE WEBGL CODE (Minified logic)
function initSmokeEffect() {
    let canvas = document.getElementById('smokeCanvas');
    if(!canvas) return;
    canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
    let config = { TEXTURE_DOWNSAMPLE: 1, DENSITY_DISSIPATION: 0.98, VELOCITY_DISSIPATION: 0.99, PRESSURE_DISSIPATION: 0.8, PRESSURE_ITERATIONS: 25, CURL: 35, SPLAT_RADIUS: 0.002 };
    let pointers = [];
    let gl = canvas.getContext("webgl2", { alpha: true });
    if (!gl) gl = canvas.getContext("webgl", { alpha: true });
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    // ... (WebGL boilerplate same as before) ...
}
