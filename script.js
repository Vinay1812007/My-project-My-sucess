window.searchMood = function(query) {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input'));
};

document.addEventListener('DOMContentLoaded', () => {
    
    // --- THEME ---
    const themeBtn = document.getElementById('themeToggle');
    const icon = themeBtn ? themeBtn.querySelector('i') : null;
    const savedTheme = localStorage.getItem('neon_theme') || 'system';
    applyTheme(savedTheme);
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            let current = document.documentElement.getAttribute('data-theme');
            let nextTheme = current === 'dark' ? 'light' : (current === 'light' ? 'system' : 'dark');
            applyTheme(nextTheme);
        });
    }
    function applyTheme(theme) {
        if (theme === 'system') { document.documentElement.removeAttribute('data-theme'); localStorage.removeItem('neon_theme'); if(icon) icon.className='fa-solid fa-desktop'; }
        else { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('neon_theme', theme); if(icon) icon.className=theme==='dark'?'fa-solid fa-moon':'fa-solid fa-sun'; }
    }

    // --- CURSOR ---
    const cursorDot = document.getElementById('cursorDot');
    const cursorOutline = document.getElementById('cursorOutline');
    window.addEventListener('mousemove', (e) => {
        if(cursorDot){ cursorDot.style.left = `${e.clientX}px`; cursorDot.style.top = `${e.clientY}px`; cursorOutline.animate({ left: `${e.clientX}px`, top: `${e.clientY}px` }, { duration: 500, fill: "forwards" }); }
    });
    
    // --- MUSIC LOGIC ---
    const grid = document.getElementById('musicGrid');
    if (grid) {
        const searchInput = document.getElementById('searchInput');
        const audio = document.getElementById('audioPlayer');
        const playBtn = document.getElementById('playBtn');
        const playIcon = document.getElementById('playIcon');
        const albumArt = document.getElementById('albumArt');
        const loader = document.getElementById('loader');
        const canvas = document.getElementById('visualizerCanvas');
        const neonBg = document.getElementById('neonBg');
        const voiceBtn = document.getElementById('voiceBtn');
        
        // Controls
        const bassBtn = document.getElementById('bassBtn');
        const audio8dBtn = document.getElementById('audio8dBtn');
        const likeBtn = document.getElementById('likeBtn');
        const qrBtn = document.getElementById('qrBtn');
        const speedBtn = document.getElementById('speedBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const progressBar = document.getElementById('progressBar');
        const currTime = document.getElementById('currTime');
        const totalTime = document.getElementById('totalTime');

        // Full Player
        const fullPlayer = document.getElementById('fullPlayer');
        const closeFullPlayer = document.getElementById('closeFullPlayer');
        const fullAlbumArt = document.getElementById('fullAlbumArt');
        const fullTrackTitle = document.getElementById('fullTrackTitle');
        const fullTrackArtist = document.getElementById('fullTrackArtist');
        const fullPlayBtn = document.getElementById('fullPlayBtn');
        const fullPlayIcon = document.getElementById('fullPlayIcon');
        const fullPrevBtn = document.getElementById('fullPrevBtn');
        const fullNextBtn = document.getElementById('fullNextBtn');
        const fullProgressBar = document.getElementById('fullProgressBar');
        const fullCurrTime = document.getElementById('fullCurrTime');
        const fullTotalTime = document.getElementById('fullTotalTime');

        // Overlays
        const qrPanel = document.getElementById('qrPanel');
        const closeQr = document.getElementById('closeQr');
        const qrContainer = document.getElementById('qrCodeContainer');

        // Variables
        let currentSong = null;
        let songQueue = [];
        let currentIndex = 0;
        let audioContext, analyser, source, bassFilter, pannerNode;
        let isBassBoosted = false;
        let is8dActive = false;
        let pannerInterval;
        const speeds = [1.0, 1.25, 1.5, 0.8];
        let speedIndex = 0;

        // 1. SYNC & SEARCH
        const urlParams = new URLSearchParams(window.location.search);
        const sharedSong = urlParams.get('song');
        const sharedTime = parseFloat(urlParams.get('t'));
        if (sharedSong) { searchInput.value = sharedSong; searchSongs(sharedSong, true, sharedTime); window.history.replaceState({}, document.title, window.location.pathname); }
        else { searchSongs('Top Indian Hits'); }

        let debounceTimer;
        searchInput.addEventListener('input', (e) => { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { if(e.target.value) searchSongs(e.target.value); }, 800); });

        async function searchSongs(query, autoPlay = false, startTime = 0) {
            grid.innerHTML = ''; grid.appendChild(loader); loader.classList.remove('hidden');
            try {
                const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=30`);
                const data = await res.json();
                loader.classList.add('hidden');
                if(data.results.length) {
                    songQueue = data.results;
                    if (autoPlay) playTrack(data.results[0], data.results[0].artworkUrl100.replace('100x100', '400x400'), startTime);
                    data.results.forEach((song, index) => {
                        if(!song.previewUrl) return;
                        const card = document.createElement('div'); card.className = 'song-card magnetic';
                        const img = song.artworkUrl100.replace('100x100', '400x400');
                        card.innerHTML = `<div class="art-box" style="background-image:url('${img}')"><div class="play-overlay"><i class="fa-solid fa-play"></i></div></div><div class="song-info"><h3>${song.trackName}</h3><p>${song.artistName}</p></div>`;
                        card.addEventListener('click', () => { currentIndex = index; playTrack(song, img); });
                        card.addEventListener('mouseenter', () => document.body.classList.add('hovering')); 
                        card.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
                        grid.appendChild(card);
                    });
                } else { grid.innerHTML = '<h3>No songs found.</h3>'; }
            } catch(e) { console.error(e); }
        }

        // 2. PLAY LOGIC
        function playTrack(song, img, startTime = 0) {
            currentSong = song;
            initAudio();
            checkLikeStatus(song);
            saveHistory(song);

            document.getElementById('trackTitle').innerText = song.trackName;
            document.getElementById('trackArtist').innerText = song.artistName;
            albumArt.style.backgroundImage = `url('${img}')`;
            fullTrackTitle.innerText = song.trackName;
            fullTrackArtist.innerText = song.artistName;
            fullAlbumArt.style.backgroundImage = `url('${img}')`;

            const h = Math.abs((song.trackName.length * 37) % 360);
            document.documentElement.style.setProperty('--neon-main', `hsl(${h}, 100%, 50%)`);
            neonBg.classList.add('active');

            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({ title: song.trackName, artist: song.artistName, artwork: [{ src: img, sizes: '512x512', type: 'image/jpeg' }] });
                navigator.mediaSession.setActionHandler('play', togglePlay);
                navigator.mediaSession.setActionHandler('pause', togglePlay);
                navigator.mediaSession.setActionHandler('previoustrack', playPrev);
                navigator.mediaSession.setActionHandler('nexttrack', playNext);
            }

            audio.src = song.previewUrl;
            // SYNC TIME
            audio.addEventListener('loadedmetadata', () => { if(startTime > 0) audio.currentTime = startTime; }, { once: true });
            
            audio.playbackRate = speeds[speedIndex];
            audio.play().then(() => { if(audioContext?.state === 'suspended') audioContext.resume(); playIcon.className = 'fa-solid fa-pause'; fullPlayIcon.className = 'fa-solid fa-pause'; albumArt.classList.add('spinning'); }).catch(console.error);
        }

        function togglePlay() {
            if(audio.src) {
                if(audio.paused) { 
                    audio.play(); playIcon.className = 'fa-solid fa-pause'; fullPlayIcon.className = 'fa-solid fa-pause'; albumArt.classList.add('spinning'); neonBg.classList.add('active');
                } else { 
                    audio.pause(); playIcon.className = 'fa-solid fa-play'; fullPlayIcon.className = 'fa-solid fa-play'; albumArt.classList.remove('spinning'); neonBg.classList.remove('active');
                }
            }
        }
        playBtn.addEventListener('click', togglePlay);
        fullPlayBtn.addEventListener('click', togglePlay);

        // 3. AUDIO EFFECTS (Bass + 8D)
        function initAudio() {
            if (audioContext) return;
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            source = audioContext.createMediaElementSource(audio);
            
            bassFilter = audioContext.createBiquadFilter();
            bassFilter.type = "lowshelf";
            bassFilter.frequency.value = 200;
            
            pannerNode = audioContext.createStereoPanner();

            source.connect(bassFilter);
            bassFilter.connect(pannerNode);
            pannerNode.connect(analyser);
            analyser.connect(audioContext.destination);
            initVisualizer();
        }

        bassBtn.addEventListener('click', () => {
            if(!audioContext) initAudio();
            isBassBoosted = !isBassBoosted;
            bassFilter.gain.value = isBassBoosted ? 15 : 0;
            bassBtn.classList.toggle('active');
        });

        audio8dBtn.addEventListener('click', () => {
            if(!audioContext) initAudio();
            is8dActive = !is8dActive;
            audio8dBtn.classList.toggle('active');
            if(is8dActive) {
                let angle = 0;
                pannerInterval = setInterval(() => { angle += 0.05; pannerNode.pan.value = Math.sin(angle); }, 50);
            } else { clearInterval(pannerInterval); pannerNode.pan.value = 0; }
        });

        // 4. SPEED
        speedBtn.addEventListener('click', () => {
            speedIndex = (speedIndex + 1) % speeds.length;
            audio.playbackRate = speeds[speedIndex];
            speedBtn.innerText = speeds[speedIndex] + "x";
        });

        // 5. QUEUE CONTROLS (Main & Full)
        function playNext() { if (currentIndex < songQueue.length - 1) { currentIndex++; let s = songQueue[currentIndex]; playTrack(s, s.artworkUrl100.replace('100x100', '400x400')); } }
        function playPrev() { if (currentIndex > 0) { currentIndex--; let s = songQueue[currentIndex]; playTrack(s, s.artworkUrl100.replace('100x100', '400x400')); } }
        audio.addEventListener('ended', playNext);
        nextBtn.addEventListener('click', playNext); fullNextBtn.addEventListener('click', playNext);
        prevBtn.addEventListener('click', playPrev); fullPrevBtn.addEventListener('click', playPrev);

        // 6. DOWNLOAD
        downloadBtn.addEventListener('click', () => {
            if(!currentSong) return alert("Play a song!");
            downloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            fetch(currentSong.previewUrl).then(r=>r.blob()).then(blob=>{
                const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.style.display='none'; a.href=url; a.download=currentSong.trackName+".m4a"; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url);
                downloadBtn.innerHTML = '<i class="fa-solid fa-check"></i>'; setTimeout(()=>downloadBtn.innerHTML='<i class="fa-solid fa-download"></i>', 2000);
            }).catch(()=>{ alert("Browser blocked download. Opening tab."); window.open(currentSong.previewUrl,'_blank'); downloadBtn.innerHTML='<i class="fa-solid fa-download"></i>'; });
        });

        // 7. SEEKING (Main & Full)
        audio.addEventListener('timeupdate', () => {
            if(audio.duration) {
                const percent = (audio.currentTime / audio.duration) * 100;
                progressBar.value = percent;
                fullProgressBar.value = percent; // Sync full player bar
                let t = formatTime(audio.currentTime);
                let d = formatTime(audio.duration);
                currTime.innerText = t; totalTime.innerText = d;
                fullCurrTime.innerText = t; fullTotalTime.innerText = d;
            }
        });
        progressBar.addEventListener('input', (e) => { audio.currentTime = (audio.duration / 100) * e.target.value; });
        fullProgressBar.addEventListener('input', (e) => { audio.currentTime = (audio.duration / 100) * e.target.value; });
        function formatTime(s) { let m = Math.floor(s/60); let sec = Math.floor(s%60); return `${m}:${sec<10?'0':''}${sec}`; }

        // 8. FAVORITES & QR
        function checkLikeStatus(song) { let f=JSON.parse(localStorage.getItem('neon_favorites'))||[]; const is=f.some(s=>s.trackName===song.trackName); likeBtn.innerHTML=is?'<i class="fa-solid fa-heart"></i>':'<i class="fa-regular fa-heart"></i>'; if(is) likeBtn.classList.add('active'); else likeBtn.classList.remove('active'); }
        likeBtn.addEventListener('click', () => { if(!currentSong) return; let f=JSON.parse(localStorage.getItem('neon_favorites'))||[]; const idx=f.findIndex(s=>s.trackName===currentSong.trackName); if(idx===-1) f.push(currentSong); else f.splice(idx,1); localStorage.setItem('neon_favorites',JSON.stringify(f)); checkLikeStatus(currentSong); renderLibrary('favorites'); });
        
        // QR SYNC
        qrBtn.addEventListener('click', () => { 
            if(!currentSong) return; 
            qrPanel.classList.remove('hidden'); 
            qrContainer.innerHTML=""; 
            // Generate link with Song + Current Time
            new QRCode(qrContainer, { text: `${window.location.origin}${window.location.pathname}?song=${encodeURIComponent(currentSong.trackName+" "+currentSong.artistName)}&t=${audio.currentTime}`, width:200, height:200 }); 
        });
        document.getElementById('closeQr').addEventListener('click', () => qrPanel.classList.add('hidden'));

        // 9. LIBRARY & HISTORY
        function saveHistory(song) { let h=JSON.parse(localStorage.getItem('neon_history'))||[]; h=h.filter(s=>s.trackName!==song.trackName); h.unshift(song); if(h.length>15) h.pop(); localStorage.setItem('neon_history',JSON.stringify(h)); }
        const openLibraryBtn=document.getElementById('openLibraryBtn'); const libraryPanel=document.getElementById('libraryPanel'); const libraryList=document.getElementById('libraryList');
        openLibraryBtn.addEventListener('click',()=>{libraryPanel.classList.remove('hidden');switchLib('favorites');}); document.getElementById('closeLibrary').addEventListener('click',()=>libraryPanel.classList.add('hidden'));
        window.switchLib=function(type){document.querySelectorAll('.lib-tab').forEach(t=>t.classList.remove('active'));event.target.classList.add('active');renderLibrary(type);}
        function renderLibrary(type){ const key=type==='favorites'?'neon_favorites':'neon_history'; const list=JSON.parse(localStorage.getItem(key))||[]; libraryList.innerHTML=''; if(list.length===0){libraryList.innerHTML=`<p style="text-align:center;color:#666">No songs.</p>`;return;} list.forEach(s=>{ const i=s.artworkUrl100.replace('100x100','150x150'); const d=document.createElement('div'); d.className='lib-item'; d.innerHTML=`<img src="${i}"><div><h4>${s.trackName}</h4><p>${s.artistName}</p></div>`; d.addEventListener('click',()=>{playTrack(s,i.replace('150x150','400x400'));libraryPanel.classList.add('hidden');}); libraryList.appendChild(d); }); }

        // Full Screen Toggle
        albumArt.addEventListener('click', () => fullPlayer.classList.remove('hidden'));
        closeFullPlayer.addEventListener('click', () => fullPlayer.classList.add('hidden'));

        // VISUALIZER
        function initVisualizer() {
            analyser.fftSize = 256; const bufferLength = analyser.frequencyBinCount; const dataArray = new Uint8Array(bufferLength); const ctx = canvas.getContext('2d');
            function animate() { requestAnimationFrame(animate); canvas.width = window.innerWidth; canvas.height = window.innerHeight; analyser.getByteFrequencyData(dataArray); ctx.clearRect(0, 0, canvas.width, canvas.height); const barWidth = (canvas.width / bufferLength) * 2.5; let x = 0; for(let i = 0; i < bufferLength; i++) { const barHeight = dataArray[i] * 1.5; ctx.fillStyle = `rgba(${barHeight + 50}, 250, 50, 0.2)`; ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight); x += barWidth + 1; } }
            animate();
        }

        // Voice Search
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; const recognition = new SpeechRecognition(); recognition.continuous=false; recognition.lang='en-US';
            voiceBtn.addEventListener('click', () => { recognition.start(); voiceBtn.classList.add('listening'); });
            recognition.onresult = (e) => { voiceBtn.classList.remove('listening'); const q = e.results[0][0].transcript; searchInput.value=q; searchSongs(q); };
        } else { voiceBtn.style.display='none'; }
    }
});
