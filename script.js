// --- CAST API ---
window['__onGCastApiAvailable'] = function(isAvailable) { if (isAvailable) { cast.framework.CastContext.getInstance().setOptions({ receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID, autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED }); if(document.getElementById('castBtn')) document.getElementById('castBtn').style.display = 'inline-block'; } };

// --- SEARCH & LANGUAGE ---
window.searchMood = function(query) { const i = document.getElementById('searchInput'); if(i){ i.value = query; i.dispatchEvent(new Event('input')); } };
window.setLanguage = function(lang) {
    document.querySelectorAll('.lang-chip').forEach(c => c.classList.remove('active'));
    if(event && event.target) event.target.classList.add('active');
    
    // Optimized Queries for Indian Context
    let query = "Trending India";
    if (lang === 'Telugu') query = "Latest Telugu Hits";
    else if (lang === 'Hindi') query = "Top Bollywood Songs";
    else if (lang === 'English') query = "Global Top 50";
    else if (lang === 'Tamil') query = "Kollywood Hits";
    else if (lang === 'Punjabi') query = "Punjabi Party Hits";
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) { searchInput.value = query; searchInput.dispatchEvent(new Event('input')); }
};

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. SMOKE STREAM EFFECT (WEBGL) ---
    initSmokeEffect();

    // --- 2. MAIN APP LOGIC ---
    const themeBtn = document.getElementById('themeToggle'); const icon = themeBtn ? themeBtn.querySelector('i') : null;
    const applyTheme = (theme) => { if(theme==='system'){document.documentElement.removeAttribute('data-theme');localStorage.removeItem('neon_theme');if(icon)icon.className='fa-solid fa-desktop';}else{document.documentElement.setAttribute('data-theme',theme);localStorage.setItem('neon_theme',theme);if(icon)icon.className=theme==='dark'?'fa-solid fa-moon':'fa-solid fa-sun';} };
    applyTheme(localStorage.getItem('neon_theme')||'system');
    if(themeBtn) themeBtn.addEventListener('click', () => { let c = document.documentElement.getAttribute('data-theme'); applyTheme(c==='dark'?'light':(c==='light'?'system':'dark')); });
    
    // Cursor Logic
    const cursorDot = document.getElementById('cursorDot'); const cursorOutline = document.getElementById('cursorOutline');
    if(cursorDot && cursorOutline){
        window.addEventListener('mousemove', (e) => { 
            cursorDot.style.left=`${e.clientX}px`; 
            cursorDot.style.top=`${e.clientY}px`; 
            cursorOutline.animate({left:`${e.clientX}px`,top:`${e.clientY}px`},{duration:500,fill:"forwards"}); 
        });
    }
    document.querySelectorAll('.magnetic').forEach(btn => { 
        btn.addEventListener('mouseenter', ()=>document.body.classList.add('hovering')); 
        btn.addEventListener('mouseleave', ()=>document.body.classList.remove('hovering')); 
    });

    // Landing Page
    const landingGoBtn = document.getElementById('landingGoBtn');
    if (landingGoBtn) {
        const landingInput = document.getElementById('landingUrl');
        landingGoBtn.addEventListener('click', () => { const url = landingInput.value.trim(); if(url){ window.location.href = `/videodownloader?url=${encodeURIComponent(url)}`; } else { alert("Please paste a link."); } });
        landingInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') landingGoBtn.click(); });
    }

    // --- MUSIC PLAYER LOGIC ---
    const grid = document.getElementById('musicGrid');
    if (grid) {
        const searchInput = document.getElementById('searchInput');
        const audio = document.getElementById('audioPlayer'); 
        const playBtn = document.getElementById('playBtn'), playIcon = document.getElementById('playIcon'), albumArt = document.getElementById('albumArt'), loader = document.getElementById('loader'), canvas = document.getElementById('visualizerCanvas'), neonBg = document.getElementById('neonBg');
        const likeBtn = document.getElementById('likeBtn'), qrBtn = document.getElementById('qrBtn'), speedBtn = document.getElementById('speedBtn'), downloadBtn = document.getElementById('downloadBtn'), sleepBtn = document.getElementById('sleepBtn'), airplayBtn = document.getElementById('airplayBtn'), pipBtn = document.getElementById('pipBtn'), bassBtn = document.getElementById('bassBtn');
        const spatialBtn = document.getElementById('spatialBtn'), partyBtn = document.getElementById('partyBtn'), partyOverlay = document.getElementById('partyOverlay');
        const progressBar = document.getElementById('progressBar'), currTime = document.getElementById('currTime'), totalTime = document.getElementById('totalTime');
        const fullPlayer = document.getElementById('fullPlayer'), closeFull = document.getElementById('closeFullPlayer'), fullArt = document.getElementById('fullAlbumArt'), fullTitle = document.getElementById('fullTrackTitle'), fullArtist = document.getElementById('fullTrackArtist'), fullPlay = document.getElementById('fullPlayBtn'), fullIcon = document.getElementById('fullPlayIcon'), fullNext = document.getElementById('fullNextBtn'), fullPrev = document.getElementById('fullPrevBtn'), fullBar = document.getElementById('fullProgressBar'), fullCurr = document.getElementById('fullCurrTime'), fullTot = document.getElementById('fullTotalTime');
        const qrPanel = document.getElementById('qrPanel'), closeQr = document.getElementById('closeQr'), qrContainer = document.getElementById('qrCodeContainer');
        const voiceBtn = document.getElementById('voiceBtn');

        let currentSong = null, songQueue = [], currentIndex = 0, audioContext, analyser, source, bassFilter, pannerNode, spatialPanner;
        let isBassBoosted = false, isSpatialActive = false, isPartyActive = false;
        let sleepTimer = null, speeds = [1.0, 1.25, 1.5, 0.8], speedIndex = 0;
        let spatialAngle = 0, trackStream;

        // Auto-search on load
        const urlParams = new URLSearchParams(window.location.search);
        if(urlParams.get('song')) { 
            document.getElementById('searchInput').value = urlParams.get('song'); 
            searchSongs(urlParams.get('song'), true, parseFloat(urlParams.get('t'))); 
            window.history.replaceState({}, document.title, window.location.pathname); 
        } else {
            searchSongs('Trending India');
        }

        let debounceTimer;
        document.getElementById('searchInput').addEventListener('input', (e) => { 
            clearTimeout(debounceTimer); 
            debounceTimer = setTimeout(() => { 
                if(e.target.value) searchSongs(e.target.value); 
            }, 1000); 
        });

        // --- MULTI-API SEARCH FUNCTION ---
        async function searchSongs(query, autoPlay=false, startTime=0) {
            grid.innerHTML = ''; grid.appendChild(loader); loader.classList.remove('hidden');
            songQueue = []; // Clear queue

            try {
                // 1. Try JioSaavn API (Best for Indian Content & Full Audio)
                const saavnRes = await fetch(`https://saavn.me/search/songs?query=${encodeURIComponent(query)}&page=1&limit=20`);
                const saavnData = await saavnRes.json();

                if (saavnData.data && saavnData.data.results && saavnData.data.results.length > 0) {
                    // Map Saavn Data
                    songQueue = saavnData.data.results.map(song => ({
                        id: song.id,
                        trackName: song.name,
                        artistName: song.primaryArtists || song.singers,
                        // Get highest quality image
                        artworkUrl100: (song.image && song.image.length > 0) ? song.image[song.image.length-1].link : 'https://via.placeholder.com/300',
                        // Get highest quality download link (usually last in array is 320kbps)
                        previewUrl: (song.downloadUrl && song.downloadUrl.length > 0) ? song.downloadUrl[song.downloadUrl.length-1].link : null,
                        lyricsId: song.id // Saavn has lyrics usually
                    }));
                } else {
                    // 2. Fallback to iTunes (Global/Western)
                    const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=20`);
                    const itunesData = await itunesRes.json();
                    
                    if(itunesData.results.length > 0) {
                        songQueue = itunesData.results.map(song => ({
                            id: song.trackId,
                            trackName: song.trackName,
                            artistName: song.artistName,
                            artworkUrl100: song.artworkUrl100.replace('100x100', '400x400'),
                            previewUrl: song.previewUrl, // Note: iTunes is 30s preview
                            lyricsId: null
                        }));
                    }
                }

                // Render Results
                loader.classList.add('hidden');
                if(songQueue.length > 0) {
                    if(autoPlay) playTrack(songQueue[0], songQueue[0].artworkUrl100, startTime);
                    
                    songQueue.forEach((song, idx) => {
                        if(!song.previewUrl) return;
                        const card = document.createElement('div');
                        card.className = 'song-card magnetic';
                        card.innerHTML = `
                            <div class="art-box" style="background-image:url('${song.artworkUrl100}')">
                                <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
                            </div>
                            <div class="song-info">
                                <h3>${song.trackName}</h3>
                                <p>${song.artistName}</p>
                            </div>`;
                        card.addEventListener('click', () => { currentIndex = idx; playTrack(song, song.artworkUrl100); });
                        card.addEventListener('mouseenter', () => document.body.classList.add('hovering')); 
                        card.addEventListener('mouseleave', () => document.body.classList.remove('hovering')); 
                        grid.appendChild(card);
                    });
                } else {
                    grid.innerHTML = '<h3>No songs found.</h3>';
                }

            } catch (e) {
                console.error(e);
                loader.classList.add('hidden');
                grid.innerHTML = '<h3>Error fetching songs.</h3>';
            }
        }

        function playTrack(song, img, startTime=0) {
            currentSong = song; initAudio(); checkLikeStatus(song); saveHistory(song);
            
            // Update UI
            document.getElementById('trackTitle').innerText = song.trackName; 
            document.getElementById('trackArtist').innerText = song.artistName; 
            albumArt.style.backgroundImage = `url('${img}')`;
            fullTitle.innerText = song.trackName; 
            fullArtist.innerText = song.artistName; 
            fullArt.style.backgroundImage = `url('${img}')`;
            
            // Dynamic Neon Color
            const h = Math.abs((song.trackName.length * 37) % 360); 
            document.documentElement.style.setProperty('--neon-main', `hsl(${h}, 100%, 50%)`); 
            neonBg.classList.add('active');

            // Media Session API
            if('mediaSession' in navigator) { 
                navigator.mediaSession.metadata = new MediaMetadata({ title: song.trackName, artist: song.artistName, artwork: [{ src: img, sizes: '512x512', type: 'image/jpeg' }] }); 
                navigator.mediaSession.setActionHandler('play', togglePlay); 
                navigator.mediaSession.setActionHandler('pause', togglePlay); 
                navigator.mediaSession.setActionHandler('previoustrack', playPrev); 
                navigator.mediaSession.setActionHandler('nexttrack', playNext); 
            }

            audio.src = song.previewUrl;
            if(startTime > 0) audio.currentTime = startTime;
            audio.playbackRate = speeds[speedIndex];
            
            audio.play().then(() => { 
                if(audioContext?.state === 'suspended') audioContext.resume(); 
                playIcon.className = 'fa-solid fa-pause'; 
                fullIcon.className = 'fa-solid fa-pause'; 
                albumArt.classList.add('spinning'); 
            }).catch(e => console.log("Auto-play blocked:", e));
        }

        function togglePlay() { 
            if(audio.src) { 
                if(audio.paused) { 
                    audio.play(); 
                    playIcon.className='fa-solid fa-pause'; fullIcon.className='fa-solid fa-pause'; albumArt.classList.add('spinning'); neonBg.classList.add('active'); 
                } else { 
                    audio.pause(); 
                    playIcon.className='fa-solid fa-play'; fullIcon.className='fa-solid fa-play'; albumArt.classList.remove('spinning'); neonBg.classList.remove('active'); 
                } 
            } 
        }
        playBtn.addEventListener('click', togglePlay); fullPlay.addEventListener('click', togglePlay);

        // --- AUDIO ENGINE (DOLBY / 3D / BASS) ---
        function initAudio() { 
            if (audioContext) return; 
            audioContext = new (window.AudioContext || window.webkitAudioContext)(); 
            analyser = audioContext.createAnalyser(); 
            source = audioContext.createMediaElementSource(audio); 
            
            // Bass Filter
            bassFilter = audioContext.createBiquadFilter(); 
            bassFilter.type = "lowshelf"; bassFilter.frequency.value = 200; 
            
            // 3D Spatial Panner (Dolby Simulation)
            spatialPanner = audioContext.createPanner();
            spatialPanner.panningModel = 'HRTF'; // Human Head Transfer Function for realistic 3D
            spatialPanner.distanceModel = 'linear';
            
            // Signal Chain: Source -> Bass -> Spatial -> Analyser -> Speakers
            source.connect(bassFilter); 
            bassFilter.connect(spatialPanner);
            spatialPanner.connect(analyser); 
            analyser.connect(audioContext.destination); 
            
            initVisualizer(); 
        }

        bassBtn.addEventListener('click', () => { if(!audioContext) initAudio(); isBassBoosted = !isBassBoosted; bassFilter.gain.value = isBassBoosted ? 15 : 0; bassBtn.classList.toggle('active'); });
        
        spatialBtn.addEventListener('click', () => {
            if(!audioContext) initAudio();
            isSpatialActive = !isSpatialActive;
            spatialBtn.classList.toggle('active');
            if(!isSpatialActive) spatialPanner.setPosition(0, 0, 0); // Reset center
        });

        // --- PARTY MODE (Flashlight) ---
        partyBtn.addEventListener('click', async () => {
            if(!audioContext) initAudio();
            isPartyActive = !isPartyActive;
            partyBtn.classList.toggle('active');
            if(isPartyActive) {
                try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); trackStream = stream.getVideoTracks()[0]; } catch(e) {}
            } else {
                if(trackStream) { trackStream.stop(); trackStream = null; }
                partyOverlay.style.opacity = 0;
            }
        });

        speedBtn.addEventListener('click', () => { speedIndex = (speedIndex + 1) % speeds.length; audio.playbackRate = speeds[speedIndex]; speedBtn.innerText = speeds[speedIndex] + "x"; });
        
        function playNext() { if (currentIndex < songQueue.length - 1) { currentIndex++; playTrack(songQueue[currentIndex], songQueue[currentIndex].artworkUrl100); } }
        function playPrev() { if (currentIndex > 0) { currentIndex--; playTrack(songQueue[currentIndex], songQueue[currentIndex].artworkUrl100); } }
        audio.addEventListener('ended', playNext);
        document.getElementById('nextBtn').addEventListener('click', playNext); fullNext.addEventListener('click', playNext);
        document.getElementById('prevBtn').addEventListener('click', playPrev); fullPrev.addEventListener('click', playPrev);

        audio.addEventListener('timeupdate', () => { if(audio.duration) { const pct = (audio.currentTime/audio.duration)*100; progressBar.value = pct; fullBar.value = pct; let t = formatTime(audio.currentTime); let d = formatTime(audio.duration); currTime.innerText = t; totalTime.innerText = d; fullCurr.innerText = t; fullTot.innerText = d; } });
        progressBar.addEventListener('input', (e) => { audio.currentTime = (audio.duration / 100) * e.target.value; });
        fullBar.addEventListener('input', (e) => { audio.currentTime = (audio.duration / 100) * e.target.value; });
        function formatTime(s) { let m = Math.floor(s/60); let sec = Math.floor(s%60); return `${m}:${sec<10?'0':''}${sec}`; }

        // --- LYRICS (Auto-Fetch from Saavn) ---
        const lyricsBtn = document.getElementById('lyricsBtn'); 
        const lyricsPanel = document.getElementById('lyricsPanel'); 
        const lyricsText = document.getElementById('lyricsText'); 
        const closeLyrics = document.getElementById('closeLyrics'); 
        const fullLyricsBtn = document.getElementById('fullLyricsBtn');

        lyricsBtn.addEventListener('click', async () => { 
            if(!currentSong) return alert("Play a song first!"); 
            lyricsPanel.classList.remove('hidden'); 
            
            lyricsText.innerHTML = `<div style="text-align:center;margin-top:50px;"><i class="fa-solid fa-robot fa-bounce" style="font-size:2rem;"></i><br>Generating Lyrics...</div>`;

            try {
                // If song came from Saavn, fetch lyrics via Saavn API
                if(currentSong.lyricsId) {
                    const res = await fetch(`https://saavn.me/lyrics?id=${currentSong.lyricsId}`);
                    const data = await res.json();
                    
                    if(data.status === "SUCCESS" && data.data.lyrics) {
                        displayLyrics(data.data.lyrics);
                    } else {
                        throw new Error("No lyrics in Saavn");
                    }
                } else {
                    // Fallback to OVH API
                    const res = await fetch(`https://api.lyrics.ovh/v1/${currentSong.artistName}/${currentSong.trackName}`);
                    const data = await res.json();
                    if(data.lyrics) displayLyrics(data.lyrics);
                    else throw new Error("Not found");
                }
            } catch (e) {
                lyricsText.innerHTML = `<div style="text-align:center;margin-top:50px;">Lyrics not available.<br><br><button onclick="window.open('https://www.google.com/search?q=${encodeURIComponent(currentSong.trackName + " lyrics")}', '_blank')" class="landing-btn">Search Google</button></div>`;
            }
        });

        function displayLyrics(text) {
            lyricsText.innerHTML = `<h3>${currentSong.trackName}</h3><br>`;
            const cleanText = text.replace(/\n/g, "<br>");
            let i = 0;
            function type() {
                if (i < cleanText.length) {
                    // Fast typing effect
                    const chunk = cleanText.substr(i, 5); // Type 5 chars at once for speed
                    lyricsText.innerHTML += chunk;
                    i += 5;
                    lyricsText.scrollTop = lyricsText.scrollHeight;
                    setTimeout(type, 10);
                }
            }
            type();
        }
        
        closeLyrics.addEventListener('click', () => lyricsPanel.classList.add('hidden'));
        albumArt.addEventListener('click', () => fullPlayer.classList.remove('hidden')); 
        closeFull.addEventListener('click', () => fullPlayer.classList.add('hidden'));

        // --- VISUALIZER ---
        function initVisualizer() { 
            analyser.fftSize = 256; 
            const bufferLength = analyser.frequencyBinCount; 
            const dataArray = new Uint8Array(bufferLength); 
            const ctx = canvas.getContext('2d'); 
            
            function animate() { 
                requestAnimationFrame(animate); 
                analyser.getByteFrequencyData(dataArray); 
                
                canvas.width = window.innerWidth; canvas.height = window.innerHeight; 
                ctx.clearRect(0, 0, canvas.width, canvas.height); 
                const barWidth = (canvas.width / bufferLength) * 2.5; 
                let x = 0, avgVolume = 0;

                for(let i = 0; i < bufferLength; i++) { 
                    avgVolume += dataArray[i];
                    const barHeight = dataArray[i] * 1.5; 
                    ctx.fillStyle = `rgba(${barHeight + 50}, 250, 50, 0.2)`; 
                    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight); 
                    x += barWidth + 1; 
                }
                avgVolume /= bufferLength;

                if(isSpatialActive) { spatialAngle += 0.02; spatialPanner.setPosition(Math.sin(spatialAngle)*5, 0, Math.cos(spatialAngle)*5); }
                if(isPartyActive && avgVolume > 110) { 
                    partyOverlay.style.opacity = (avgVolume/255)*0.4; 
                    partyOverlay.style.backgroundColor = `hsl(${Math.random()*360}, 100%, 50%)`;
                    if(trackStream && Math.random()>0.7) { try { trackStream.applyConstraints({advanced:[{torch:true}]}); setTimeout(()=>trackStream.applyConstraints({advanced:[{torch:false}]}), 50); } catch(e){} }
                } else { partyOverlay.style.opacity = 0; }
            } 
            animate(); 
        }
    }

    // Video DL
    const fetchBtn = document.getElementById('fetchVideoBtn');
    if (fetchBtn) {
        const videoInput = document.getElementById('videoUrl'), pasteBtn = document.getElementById('pasteBtn'), dlResult = document.getElementById('dlResult'), thumbPreview = document.getElementById('thumbPreview'), finalDownloadBtn = document.getElementById('finalDownloadBtn');
        pasteBtn.addEventListener('click', async () => { try { const text = await navigator.clipboard.readText(); videoInput.value = text; } catch (err) { alert("Paste manually"); } });
        document.getElementById('fetchVideoBtn').addEventListener('click', () => { if(videoInput.value) { dlResult.classList.remove('hidden'); thumbPreview.src="https://via.placeholder.com/300x200?text=Video+Found"; } });
        finalDownloadBtn.addEventListener('click', () => { if(videoInput.value.includes('youtube')) window.open(`https://ssyoutube.com/en/download?url=${videoInput.value}`, '_blank'); else window.open(`https://savefrom.net/${videoInput.value}`, '_blank'); });
    }
});

// --- SMOKE EFFECT (Optimized) ---
function initSmokeEffect() {
    let canvas = document.getElementById('smokeCanvas');
    if(!canvas) return;
    canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
    let config = { TEXTURE_DOWNSAMPLE: 1, DENSITY_DISSIPATION: 0.98, VELOCITY_DISSIPATION: 0.99, PRESSURE_DISSIPATION: 0.8, PRESSURE_ITERATIONS: 25, CURL: 35, SPLAT_RADIUS: 0.002 };
    let pointers = [], splatStack = [];
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
        if (splatStack.length > 0) for (let m = 0; m < splatStack.pop(); m++) splat(canvas.width*Math.random(), canvas.height*Math.random(), 1000*(Math.random()-0.5), 1000*(Math.random()-0.5), [Math.random()*10, Math.random()*10, Math.random()*10]);
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
