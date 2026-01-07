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

// --- GLOBAL SEARCH FUNCTIONS (Linked to HTML) ---
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
    // Smart Query Construction for iTunes
    if (currentLang === 'All') query = `${currentMood} Songs India`;
    else query = `${currentLang} ${currentMood} Songs`;
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = query; // Visual update
        fetchSongs(query); // Actual Fetch
    }
}

// --- INITIALIZATION ---
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

    // Manual Search
    let debounceTimer;
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => { fetchSongs(e.target.value); }, 800);
        });
    }

    // --- APPLE ITUNES API SEARCH ---
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
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=30&country=IN`);
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
                    card.addEventListener('click', () => { currentIndex = idx; playTrack(song); });
                    grid.appendChild(card);
                });
                
                if(autoPlay) playTrack(songQueue[0]);

            } else {
                grid.innerHTML = '<h3 style="text-align:center;width:100%;margin-top:50px;color:var(--text-secondary);">No songs found.</h3>';
            }
        } catch (e) {
            loader.classList.add('hidden');
            console.error("API Error", e);
        }
    }

    function playTrack(song) {
        currentSong = song;
        initAudioEngine();

        // Reveal Player Bar
        playerBar.classList.add('active');
        playerBar.classList.add('edge-glow'); 

        // Update UI
        document.getElementById('trackTitle').innerText = song.trackName;
        document.getElementById('trackArtist').innerText = song.artistName;
        albumArt.style.backgroundImage = `url('${song.artwork}')`;
        document.getElementById('fullTrackTitle').innerText = song.trackName;
        document.getElementById('fullTrackArtist').innerText = song.artistName;
        document.getElementById('fullAlbumArt').style.backgroundImage = `url('${song.artwork}')`;
        
        // Update Full Player BG
        const fullBg = document.querySelector('.full-bg-blur');
        if(fullBg) fullBg.style.backgroundImage = `url('${song.artwork}')`;

        // Theme Color
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
        if(isPartyActive) { try { const s = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}}); trackStream = s.getVideoTracks()[0]; } catch(e){} } 
        else { if(trackStream) trackStream.stop(); document.getElementById('partyOverlay').style.opacity = 0; }
    });

    // --- LYRICS ---
    const lyrBtn = document.getElementById('lyricsBtn');
    if(lyrBtn) lyrBtn.addEventListener('click', () => {
        if(!currentSong) return;
        document.getElementById('lyricsPanel').classList.add('active');
        const body = document.getElementById('lyricsText');
        body.innerHTML = `
            <div style="text-align:center; padding-top:50px;">
                <h2 style="color:var(--neon-main); margin-bottom:10px;">${currentSong.trackName}</h2>
                <p>Syncing Lyrics...</p><br>
                <div id="simLyrics" style="font-size:1.5rem; line-height:2.5;">
                    <span style="opacity:0.5">Fetching database...</span>
                </div>
            </div>
        `;
        setTimeout(() => {
            fetch(`https://api.lyrics.ovh/v1/${currentSong.artistName}/${currentSong.trackName}`)
            .then(r=>r.json())
            .then(d => {
                if(d.lyrics) {
                    const lines = d.lyrics.split('\n').map(l => `<span class="lyrics-highlight">${l}</span>`).join('<br>');
                    document.getElementById('simLyrics').innerHTML = lines;
                } else throw new Error();
            }).catch(() => document.getElementById('simLyrics').innerHTML = "Lyrics not found in public database.<br>Enjoy the music!");
        }, 1500);
    });
    const clsLyr = document.getElementById('closeLyrics');
    if(clsLyr) clsLyr.addEventListener('click', () => document.getElementById('lyricsPanel').classList.remove('active'));
});

// --- EFFECTS: HOLI & SMOKE ---
function initThemeAndEffects() {
    const themeBtn = document.getElementById('themeToggle');
    const icon = themeBtn ? themeBtn.querySelector('i') : null;
    const applyTheme = (theme) => { 
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('neon_theme', theme);
        if(icon) icon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    };
    applyTheme(localStorage.getItem('neon_theme') || 'dark');
    if(themeBtn) themeBtn.addEventListener('click', () => { 
        let c = document.documentElement.getAttribute('data-theme'); 
        applyTheme(c === 'dark' ? 'light' : 'dark'); 
    });

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

// SMOKE WEBGL CODE
function initSmokeEffect() {
    let canvas = document.getElementById('smokeCanvas');
    if(!canvas) return;
    canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
    let config = { TEXTURE_DOWNSAMPLE: 1, DENSITY_DISSIPATION: 0.98, VELOCITY_DISSIPATION: 0.99, PRESSURE_DISSIPATION: 0.8, PRESSURE_ITERATIONS: 25, CURL: 35, SPLAT_RADIUS: 0.002 };
    let pointers = [];
    let _getWebGLContext = getWebGLContext(canvas);
    let gl = _getWebGLContext.gl, ext = _getWebGLContext.ext, support_linear_float = _getWebGLContext.support_linear_float;
    function getWebGLContext(canvas) {
        let params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
        let gl = canvas.getContext("webgl2", params);
        let isWebGL2 = !!gl;
        if (!isWebGL2) gl = canvas.getContext("webgl", params) || canvas.getContext("experimental-webgl", params);
        let halfFloat = gl.getExtension("OES_texture_half_float");
        let support_linear_float = gl.getExtension("OES_texture_half_float_linear");
        if (isWebGL2) { gl.getExtension("EXT_color_buffer_float"); support_linear_float = gl.getExtension("OES_texture_float_linear"); }
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        return { gl: gl, ext: { internalFormat: isWebGL2 ? gl.RGBA16F : gl.RGBA, internalFormatRG: isWebGL2 ? gl.RG16F : gl.RGBA, formatRG: isWebGL2 ? gl.RG : gl.RGBA, texType: isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES }, support_linear_float: support_linear_float };
    }
    function pointerPrototype() { this.id = -1; this.x = 0; this.y = 0; this.dx = 0; this.dy = 0; this.down = false; this.moved = false; this.color = [30, 0, 300]; }
    pointers.push(new pointerPrototype());
    class GLProgram {
        constructor(vertexShader, fragmentShader) {
            this.uniforms = {}; this.program = gl.createProgram();
            gl.attachShader(this.program, vertexShader); gl.attachShader(this.program, fragmentShader);
            gl.linkProgram(this.program);
            if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw gl.getProgramInfoLog(this.program);
            const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
            for (let i = 0; i < uniformCount; i++) { const uniformName = gl.getActiveUniform(this.program, i).name; this.uniforms[uniformName] = gl.getUniformLocation(this.program, uniformName); }
        }
        bind() { gl.useProgram(this.program); }
    }
    function compileShader(type, source) { const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader); if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(shader); return shader; }
    const baseVertexShader = compileShader(gl.VERTEX_SHADER, "precision highp float; attribute vec2 aPosition; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform vec2 texelSize; void main () { vUv = aPosition * 0.5 + 0.5; vL = vUv - vec2(texelSize.x, 0.0); vR = vUv + vec2(texelSize.x, 0.0); vT = vUv + vec2(0.0, texelSize.y); vB = vUv - vec2(0.0, texelSize.y); gl_Position = vec4(aPosition, 0.0, 1.0); }");
    const clearShader = compileShader(gl.FRAGMENT_SHADER, "precision highp float; precision mediump sampler2D; varying vec2 vUv; uniform sampler2D uTexture; uniform float value; void main () { gl_FragColor = value * texture2D(uTexture, vUv); }");
    const displayShader = compileShader(gl.FRAGMENT_SHADER, "precision highp float; precision mediump sampler2D; varying vec2 vUv; uniform sampler2D uTexture; void main () { gl_FragColor = texture2D(uTexture, vUv); }");
    const splatShader = compileShader(gl.FRAGMENT_SHADER, "precision highp float; precision mediump sampler2D; varying vec2 vUv; uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius; void main () { vec2 p = vUv - point.xy; p.x *= aspectRatio; vec3 splat = exp(-dot(p, p) / radius) * color; vec3 base = texture2D(uTarget, vUv).xyz; gl_FragColor = vec4(base + splat, 1.0); }");
    const advectionShader = compileShader(gl.FRAGMENT_SHADER, "precision highp float; precision mediump sampler2D; varying vec2 vUv; uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 texelSize; uniform float dt; uniform float dissipation; void main () { vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize; gl_FragColor = dissipation * texture2D(uSource, coord); }");
    const divergenceShader = compileShader(gl.FRAGMENT_SHADER, "precision highp float; precision mediump sampler2D; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform sampler2D uVelocity; void main () { float L = texture2D(uVelocity, vL).x; float R = texture2D(uVelocity, vR).x; float T = texture2D(uVelocity, vT).y; float B = texture2D(uVelocity, vB).y; float div = 0.5 * (R - L + T - B); gl_FragColor = vec4(div, 0.0, 0.0, 1.0); }");
    const curlShader = compileShader(gl.FRAGMENT_SHADER, "precision highp float; precision mediump sampler2D; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform sampler2D uVelocity; void main () { float L = texture2D(uVelocity, vL).y; float R = texture2D(uVelocity, vR).y; float T = texture2D(uVelocity, vT).x; float B = texture2D(uVelocity, vB).x; float vorticity = R - L - T + B; gl_FragColor = vec4(vorticity, 0.0, 0.0, 1.0); }");
    const vorticityShader = compileShader(gl.FRAGMENT_SHADER, "precision highp float; precision mediump sampler2D; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt; void main () { float L = texture2D(uCurl, vL).y; float R = texture2D(uCurl, vR).y; float T = texture2D(uCurl, vT).x; float B = texture2D(uCurl, vB).x; float C = texture2D(uCurl, vUv).x; vec2 force = vec2(abs(T) - abs(B), abs(R) - abs(L)); force *= 1.0 / length(force + 0.00001) * curl * C; vec2 vel = texture2D(uVelocity, vUv).xy; gl_FragColor = vec4(vel + force * dt, 0.0, 1.0); }");
    const pressureShader = compileShader(gl.FRAGMENT_SHADER, "precision highp float; precision mediump sampler2D; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform sampler2D uPressure; uniform sampler2D uDivergence; void main () { float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x; float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x; float C = texture2D(uPressure, vUv).x; float divergence = texture2D(uDivergence, vUv).x; float pressure = (L + R + B + T - divergence) * 0.25; gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0); }");
    const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, "precision highp float; precision mediump sampler2D; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform sampler2D uPressure; uniform sampler2D uVelocity; void main () { float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x; float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x; vec2 velocity = texture2D(uVelocity, vUv).xy; velocity.xy -= vec2(R - L, T - B); gl_FragColor = vec4(velocity, 0.0, 1.0); }");

    let textureWidth, textureHeight, density, velocity, divergence, curl, pressure;
    initFramebuffers();
    const clearProgram = new GLProgram(baseVertexShader, clearShader);
    const displayProgram = new GLProgram(baseVertexShader, displayShader);
    const splatProgram = new GLProgram(baseVertexShader, splatShader);
    const advectionProgram = new GLProgram(baseVertexShader, advectionShader);
    const divergenceProgram = new GLProgram(baseVertexShader, divergenceShader);
    const curlProgram = new GLProgram(baseVertexShader, curlShader);
    const vorticityProgram = new GLProgram(baseVertexShader, vorticityShader);
    const pressureProgram = new GLProgram(baseVertexShader, pressureShader);
    const gradienSubtractProgram = new GLProgram(baseVertexShader, gradientSubtractShader);

    function initFramebuffers() {
        textureWidth = gl.drawingBufferWidth >> config.TEXTURE_DOWNSAMPLE; textureHeight = gl.drawingBufferHeight >> config.TEXTURE_DOWNSAMPLE;
        const iFormat = ext.internalFormat, iFormatRG = ext.internalFormatRG, formatRG = ext.formatRG, texType = ext.texType;
        density = createDoubleFBO(0, textureWidth, textureHeight, iFormat, gl.RGBA, texType, support_linear_float ? gl.LINEAR : gl.NEAREST);
        velocity = createDoubleFBO(2, textureWidth, textureHeight, iFormatRG, formatRG, texType, support_linear_float ? gl.LINEAR : gl.NEAREST);
        divergence = createFBO(4, textureWidth, textureHeight, iFormatRG, formatRG, texType, gl.NEAREST);
        curl = createFBO(5, textureWidth, textureHeight, iFormatRG, formatRG, texType, gl.NEAREST);
        pressure = createDoubleFBO(6, textureWidth, textureHeight, iFormatRG, formatRG, texType, gl.NEAREST);
    }
    function createFBO(texId, w, h, internalFormat, format, type, param) { gl.activeTexture(gl.TEXTURE0 + texId); let texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null); let fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0); gl.viewport(0, 0, w, h); gl.clear(gl.COLOR_BUFFER_BIT); return [texture, fbo, texId]; }
    function createDoubleFBO(texId, w, h, internalFormat, format, type, param) { let fbo1 = createFBO(texId, w, h, internalFormat, format, type, param); let fbo2 = createFBO(texId + 1, w, h, internalFormat, format, type, param); return { get first() { return fbo1; }, get second() { return fbo2; }, swap: function() { let temp = fbo1; fbo1 = fbo2; fbo2 = temp; } }; }
    const blit = (() => { gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(0); return (destination) => { gl.bindFramebuffer(gl.FRAMEBUFFER, destination); gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0); }; })();

    let lastTime = Date.now();
    update();
    function update() {
        resizeCanvas(); let dt = Math.min((Date.now() - lastTime) / 1000, 0.016); lastTime = Date.now(); gl.viewport(0, 0, textureWidth, textureHeight);
        advectionProgram.bind(); gl.uniform2f(advectionProgram.uniforms.texelSize, 1.0/textureWidth, 1.0/textureHeight); gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.first[2]); gl.uniform1i(advectionProgram.uniforms.uSource, velocity.first[2]); gl.uniform1f(advectionProgram.uniforms.dt, dt); gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION); blit(velocity.second[1]); velocity.swap();
        gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.first[2]); gl.uniform1i(advectionProgram.uniforms.uSource, density.first[2]); gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION); blit(density.second[1]); density.swap();
        for (let i = 0; i < pointers.length; i++) if (pointers[i].moved) { splat(pointers[i].x, pointers[i].y, pointers[i].dx, pointers[i].dy, pointers[i].color); pointers[i].moved = false; }
        curlProgram.bind(); gl.uniform2f(curlProgram.uniforms.texelSize, 1.0/textureWidth, 1.0/textureHeight); gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.first[2]); blit(curl[1]);
        vorticityProgram.bind(); gl.uniform2f(vorticityProgram.uniforms.texelSize, 1.0/textureWidth, 1.0/textureHeight); gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.first[2]); gl.uniform1i(vorticityProgram.uniforms.uCurl, curl[2]); gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL); gl.uniform1f(vorticityProgram.uniforms.dt, dt); blit(velocity.second[1]); velocity.swap();
        divergenceProgram.bind(); gl.uniform2f(divergenceProgram.uniforms.texelSize, 1.0/textureWidth, 1.0/textureHeight); gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.first[2]); blit(divergence[1]);
        clearProgram.bind(); gl.activeTexture(gl.TEXTURE0 + pressure.first[2]); gl.bindTexture(gl.TEXTURE_2D, pressure.first[0]); gl.uniform1i(clearProgram.uniforms.uTexture, pressure.first[2]); gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE_DISSIPATION); blit(pressure.second[1]); pressure.swap();
        pressureProgram.bind(); gl.uniform2f(pressureProgram.uniforms.texelSize, 1.0/textureWidth, 1.0/textureHeight); gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence[2]);
        for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) { gl.bindTexture(gl.TEXTURE_2D, pressure.first[0]); gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.first[2]); blit(pressure.second[1]); pressure.swap(); }
        gradienSubtractProgram.bind(); gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, 1.0/textureWidth, 1.0/textureHeight); gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.first[2]); gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.first[2]); blit(velocity.second[1]); velocity.swap();
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); displayProgram.bind(); gl.uniform1i(displayProgram.uniforms.uTexture, density.first[2]); blit(null); requestAnimationFrame(update);
    }
    function splat(x, y, dx, dy, color) { splatProgram.bind(); gl.uniform1i(splatProgram.uniforms.uTarget, velocity.first[2]); gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width/canvas.height); gl.uniform2f(splatProgram.uniforms.point, x/canvas.width, 1.0-y/canvas.height); gl.uniform3f(splatProgram.uniforms.color, dx, -dy, 1.0); gl.uniform1f(splatProgram.uniforms.radius, config.SPLAT_RADIUS); blit(velocity.second[1]); velocity.swap(); gl.uniform1i(splatProgram.uniforms.uTarget, density.first[2]); gl.uniform3f(splatProgram.uniforms.color, color[0]*0.3, color[1]*0.3, color[2]*0.3); blit(density.second[1]); density.swap(); }
    function resizeCanvas() { if(canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; initFramebuffers(); } }
    window.addEventListener("mousemove", e => { pointers[0].down = true; pointers[0].color = [Math.random()+0.2, Math.random()+0.2, Math.random()+0.2]; pointers[0].moved = pointers[0].down; pointers[0].dx = (e.clientX - pointers[0].x) * 5.0; pointers[0].dy = (e.clientY - pointers[0].y) * 5.0; pointers[0].x = e.clientX; pointers[0].y = e.clientY; });
    window.addEventListener("touchmove", e => { e.preventDefault(); let touches = e.targetTouches; for(let i=0; i<touches.length; i++){ if(i>=pointers.length) pointers.push(new pointerPrototype()); pointers[i].id = touches[i].identifier; pointers[i].down = true; pointers[i].x = touches[i].pageX; pointers[i].y = touches[i].pageY; pointers[i].color = [Math.random()+0.2, Math.random()+0.2, Math.random()+0.2]; let pointer = pointers[i]; pointer.moved = pointer.down; pointer.dx = (touches[i].pageX - pointer.x) * 8.0; pointer.dy = (touches[i].pageY - pointer.y) * 8.0; pointer.x = touches[i].pageX; pointer.y = touches[i].pageY; } }, false);
}
