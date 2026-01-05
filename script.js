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
        const beatBg = document.getElementById('beatBg');
        const loader = document.getElementById('loader');
        const canvas = document.getElementById('visualizerCanvas');
        const voiceBtn = document.getElementById('voiceBtn');
        const bassBtn = document.getElementById('bassBtn');
        
        // Full Screen Elements
        const fullPlayer = document.getElementById('fullPlayer');
        const closeFullPlayer = document.getElementById('closeFullPlayer');
        const fullAlbumArt = document.getElementById('fullAlbumArt');
        const fullTrackTitle = document.getElementById('fullTrackTitle');
        const fullTrackArtist = document.getElementById('fullTrackArtist');
        const fullPlayBtn = document.getElementById('fullPlayBtn');
        const fullPlayIcon = document.getElementById('fullPlayIcon');

        let currentSong = null;
        let audioContext, analyser, source, bassFilter;
        let isBassBoosted = false;

        // 1. VOICE SEARCH
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            voiceBtn.addEventListener('click', () => {
                recognition.start();
                voiceBtn.classList.add('listening');
            });
            recognition.onresult = (event) => {
                voiceBtn.classList.remove('listening');
                const query = event.results[0][0].transcript;
                searchInput.value = query;
                searchSongs(query);
            };
            recognition.onerror = () => voiceBtn.classList.remove('listening');
        } else { voiceBtn.style.display = 'none'; }

        // 2. AUDIO & BASS BOOST SETUP
        function initAudio() {
            if (audioContext) return;
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            source = audioContext.createMediaElementSource(audio);
            
            // Bass Filter
            bassFilter = audioContext.createBiquadFilter();
            bassFilter.type = "lowshelf";
            bassFilter.frequency.value = 200; // Bass freq
            bassFilter.gain.value = 0; // Default off

            // Chain: Source -> Bass -> Analyser -> Destination
            source.connect(bassFilter);
            bassFilter.connect(analyser);
            analyser.connect(audioContext.destination);

            initVisualizer();
        }

        bassBtn.addEventListener('click', () => {
            if(!audioContext) initAudio();
            isBassBoosted = !isBassBoosted;
            bassFilter.gain.value = isBassBoosted ? 15 : 0; // Boost by 15dB
            bassBtn.classList.toggle('active');
        });

        // 3. VISUALIZER
        function initVisualizer() {
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            const ctx = canvas.getContext('2d');
            function animate() {
                requestAnimationFrame(animate);
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                analyser.getByteFrequencyData(dataArray);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const barWidth = (canvas.width / bufferLength) * 2.5;
                let x = 0;
                for(let i = 0; i < bufferLength; i++) {
                    const barHeight = dataArray[i] * 1.5;
                    ctx.fillStyle = `rgba(${barHeight + 50}, 250, 50, 0.2)`;
                    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                    x += barWidth + 1;
                }
            }
            animate();
        }

        // 4. SEARCH & PLAY
        searchSongs('Top Indian Hits');
        let debounceTimer;
        searchInput.addEventListener('input', (e) => { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { if(e.target.value) searchSongs(e.target.value); }, 800); });

        async function searchSongs(query) {
            grid.innerHTML = ''; grid.appendChild(loader); loader.classList.remove('hidden');
            try {
                const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=24`);
                const data = await res.json();
                loader.classList.add('hidden');
                if(data.results.length) {
                    data.results.forEach(song => {
                        if(!song.previewUrl) return;
                        const card = document.createElement('div'); card.className = 'song-card magnetic';
                        const img = song.artworkUrl100.replace('100x100', '400x400');
                        card.innerHTML = `<div class="art-box" style="background-image:url('${img}')"><div class="play-overlay"><i class="fa-solid fa-play"></i></div></div><div class="song-info"><h3>${song.trackName}</h3><p>${song.artistName}</p></div>`;
                        card.addEventListener('click', () => playTrack(song, img));
                        grid.appendChild(card);
                    });
                } else { grid.innerHTML = '<h3>No songs found.</h3>'; }
            } catch(e) { console.error(e); }
        }

        function playTrack(song, img) {
            currentSong = song;
            initAudio();

            // Update UI
            document.getElementById('trackTitle').innerText = song.trackName;
            document.getElementById('trackArtist').innerText = song.artistName;
            albumArt.style.backgroundImage = `url('${img}')`;
            
            // Full Player UI
            fullTrackTitle.innerText = song.trackName;
            fullTrackArtist.innerText = song.artistName;
            fullAlbumArt.style.backgroundImage = `url('${img}')`;

            // Lock Screen Metadata (MediaSession)
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: song.trackName,
                    artist: song.artistName,
                    artwork: [{ src: img, sizes: '512x512', type: 'image/jpeg' }]
                });
                navigator.mediaSession.setActionHandler('play', togglePlay);
                navigator.mediaSession.setActionHandler('pause', togglePlay);
                navigator.mediaSession.setActionHandler('previoustrack', () => audio.currentTime -= 10);
                navigator.mediaSession.setActionHandler('nexttrack', () => audio.currentTime += 10);
            }

            const h = Math.abs((song.trackName.length * 37) % 360);
            document.documentElement.style.setProperty('--neon-main', `hsl(${h}, 100%, 50%)`);

            audio.src = song.previewUrl;
            audio.play().then(() => { if(audioContext?.state === 'suspended') audioContext.resume(); });
            
            beatBg.classList.add('active');
            albumArt.classList.add('spinning');
            playIcon.className = 'fa-solid fa-pause';
            fullPlayIcon.className = 'fa-solid fa-pause';
        }

        function togglePlay() {
            if(audio.src) {
                if(audio.paused) { 
                    audio.play(); 
                    playIcon.className = 'fa-solid fa-pause'; 
                    fullPlayIcon.className = 'fa-solid fa-pause';
                    albumArt.classList.add('spinning'); 
                } else { 
                    audio.pause(); 
                    playIcon.className = 'fa-solid fa-play'; 
                    fullPlayIcon.className = 'fa-solid fa-play';
                    albumArt.classList.remove('spinning'); 
                }
            }
        }
        playBtn.addEventListener('click', togglePlay);
        fullPlayBtn.addEventListener('click', togglePlay);

        // Full Screen Toggle
        albumArt.addEventListener('click', () => fullPlayer.classList.remove('hidden'));
        closeFullPlayer.addEventListener('click', () => fullPlayer.classList.add('hidden'));

        // Progress Bar
        const progressBar = document.getElementById('progressBar');
        audio.addEventListener('timeupdate', () => { if(audio.duration) progressBar.value = (audio.currentTime/audio.duration)*100; });
        progressBar.addEventListener('input', (e) => audio.currentTime = (audio.duration/100)*e.target.value);
    }
    
    // Video DL Logic preserved...
    const fetchBtn = document.getElementById('fetchVideoBtn');
    if (fetchBtn) {
        const dlResult = document.getElementById('dlResult');
        const thumbPreview = document.getElementById('thumbPreview');
        const videoInput = document.getElementById('videoUrl');
        fetchBtn.addEventListener('click', () => {
            const url = videoInput.value.trim();
            if(!url) return alert("Paste a link first!");
            fetchBtn.innerText = "Fetching...";
            setTimeout(() => {
                fetchBtn.innerText = "Fetch";
                dlResult.classList.remove('hidden');
                let thumb = "https://cdn-icons-png.flaticon.com/512/5663/5663364.png";
                if(url.includes('youtube') || url.includes('youtu.be')) {
                    const id = url.match(/(?:v=|youtu\.be\/)([^&]+)/)?.[1];
                    if(id) thumb = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
                }
                thumbPreview.src = thumb;
                document.getElementById('vidTitle').innerText = "Media Found";
            }, 1000);
        });
        document.getElementById('finalDownloadBtn').addEventListener('click', () => {
            const url = videoInput.value.trim();
            if(url.includes('youtube') || url.includes('youtu.be')) window.open(`https://ssyoutube.com/en/download?url=${url}`, '_blank');
            else window.open(`https://savefrom.net/${url}`, '_blank');
        });
    }
});
