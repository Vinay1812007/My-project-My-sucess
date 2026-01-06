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
    
    // --- MUSIC PAGE LOGIC ---
    const grid = document.getElementById('musicGrid');
    if (grid) {
        const searchInput = document.getElementById('searchInput');
        const audio = document.getElementById('audioPlayer');
        const playBtn = document.getElementById('playBtn');
        const playIcon = document.getElementById('playIcon');
        const albumArt = document.getElementById('albumArt');
        const loader = document.getElementById('loader');
        const canvas = document.getElementById('visualizerCanvas');
        const voiceBtn = document.getElementById('voiceBtn');
        const bassBtn = document.getElementById('bassBtn');
        const neonGlass = document.getElementById('neonGlass');
        
        // Buttons
        const likeBtn = document.getElementById('likeBtn');
        const shareBtn = document.getElementById('shareBtn');
        const speedBtn = document.getElementById('speedBtn');
        const sleepBtn = document.getElementById('sleepBtn');

        // Full Player
        const fullPlayer = document.getElementById('fullPlayer');
        const closeFullPlayer = document.getElementById('closeFullPlayer');
        const fullPlayBtn = document.getElementById('fullPlayBtn');
        const fullPlayIcon = document.getElementById('fullPlayIcon');

        let currentSong = null;
        let audioContext, analyser, source, bassFilter;
        let isBassBoosted = false;
        let sleepTimer = null;
        
        // Speed Variables
        const speeds = [1.0, 1.25, 1.5, 0.8];
        let speedIndex = 0;

        // 1. URL SHARE CHECK (Run immediately)
        const urlParams = new URLSearchParams(window.location.search);
        const sharedSong = urlParams.get('song');
        if (sharedSong) {
            searchInput.value = sharedSong;
            searchSongs(sharedSong, true);
            // Clear URL so refresh doesn't replay
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            searchSongs('Top Indian Hits');
        }

        // 2. AUDIO SETUP
        function initAudio() {
            if (audioContext) return;
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            source = audioContext.createMediaElementSource(audio);
            
            bassFilter = audioContext.createBiquadFilter();
            bassFilter.type = "lowshelf";
            bassFilter.frequency.value = 200; 
            bassFilter.gain.value = 0; 

            source.connect(bassFilter);
            bassFilter.connect(analyser);
            analyser.connect(audioContext.destination);

            initVisualizer();
        }

        bassBtn.addEventListener('click', () => {
            if(!audioContext) initAudio();
            isBassBoosted = !isBassBoosted;
            bassFilter.gain.value = isBassBoosted ? 15 : 0;
            bassBtn.classList.toggle('active');
        });

        // 3. SPEED CONTROL (FIXED)
        speedBtn.addEventListener('click', () => {
            speedIndex = (speedIndex + 1) % speeds.length;
            const newSpeed = speeds[speedIndex];
            audio.playbackRate = newSpeed;
            speedBtn.innerText = newSpeed + "x";
        });

        // 4. LIKE / FAVORITE (FIXED)
        function checkLikeStatus(song) {
            let favorites = JSON.parse(localStorage.getItem('neon_favorites')) || [];
            // Use trackId if possible, else name+artist
            const isFav = favorites.some(s => s.trackName === song.trackName && s.artistName === song.artistName);
            likeBtn.innerHTML = isFav ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
            if(isFav) likeBtn.classList.add('active'); else likeBtn.classList.remove('active');
        }

        likeBtn.addEventListener('click', () => {
            if (!currentSong) return alert("Play a song first!");
            let favorites = JSON.parse(localStorage.getItem('neon_favorites')) || [];
            const index = favorites.findIndex(s => s.trackName === currentSong.trackName && s.artistName === currentSong.artistName);
            
            if (index === -1) {
                favorites.push(currentSong);
                likeBtn.classList.add('active');
                likeBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
            } else {
                favorites.splice(index, 1);
                likeBtn.classList.remove('active');
                likeBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
            }
            localStorage.setItem('neon_favorites', JSON.stringify(favorites));
            renderLibrary('favorites');
        });

        // 5. SHARE BUTTON (FIXED)
        shareBtn.addEventListener('click', () => {
            if(!currentSong) return alert("Play a song first!");
            // Use current origin + pathname
            const shareUrl = `${window.location.origin}${window.location.pathname}?song=${encodeURIComponent(currentSong.trackName + " " + currentSong.artistName)}`;
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    alert("Link copied! Share it with friends.");
                }).catch(() => {
                    prompt("Copy this link manually:", shareUrl);
                });
            } else {
                prompt("Copy this link manually:", shareUrl);
            }
        });

        // 6. SEARCH & PLAY
        let debounceTimer;
        searchInput.addEventListener('input', (e) => { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { if(e.target.value) searchSongs(e.target.value); }, 800); });

        async function searchSongs(query, autoPlay = false) {
            grid.innerHTML = ''; grid.appendChild(loader); loader.classList.remove('hidden');
            try {
                const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=24`);
                const data = await res.json();
                loader.classList.add('hidden');
                if(data.results.length) {
                    if (autoPlay) playTrack(data.results[0], data.results[0].artworkUrl100.replace('100x100', '400x400'));
                    data.results.forEach(song => {
                        if(!song.previewUrl) return;
                        const card = document.createElement('div'); card.className = 'song-card magnetic';
                        const img = song.artworkUrl100.replace('100x100', '400x400');
                        card.innerHTML = `<div class="art-box" style="background-image:url('${img}')"><div class="play-overlay"><i class="fa-solid fa-play"></i></div></div><div class="song-info"><h3>${song.trackName}</h3><p>${song.artistName}</p></div>`;
                        card.addEventListener('click', () => playTrack(song, img));
                        card.addEventListener('mouseenter', () => document.body.classList.add('hovering')); 
                        card.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
                        grid.appendChild(card);
                    });
                } else { grid.innerHTML = '<h3>No songs found.</h3>'; }
            } catch(e) { console.error(e); }
        }

        function playTrack(song, img) {
            currentSong = song;
            initAudio();
            checkLikeStatus(song);
            saveHistory(song);

            // Update UI
            document.getElementById('trackTitle').innerText = song.trackName;
            document.getElementById('trackArtist').innerText = song.artistName;
            albumArt.style.backgroundImage = `url('${img}')`;
            document.getElementById('fullTrackTitle').innerText = song.trackName;
            document.getElementById('fullTrackArtist').innerText = song.artistName;
            document.getElementById('fullAlbumArt').style.backgroundImage = `url('${img}')`;

            // Color & Background
            const h = Math.abs((song.trackName.length * 37) % 360);
            document.documentElement.style.setProperty('--neon-main', `hsl(${h}, 100%, 50%)`);
            neonGlass.classList.add('active'); // Activate new background

            // Audio Logic
            audio.src = song.previewUrl;
            audio.playbackRate = speeds[speedIndex]; // Apply current speed
            
            audio.play().then(() => { 
                if(audioContext?.state === 'suspended') audioContext.resume(); 
                playIcon.className = 'fa-solid fa-pause';
                fullPlayIcon.className = 'fa-solid fa-pause';
                albumArt.classList.add('spinning');
            }).catch(e => console.log(e));
        }

        function togglePlay() {
            if(audio.src) {
                if(audio.paused) { 
                    audio.play(); 
                    playIcon.className = 'fa-solid fa-pause'; fullPlayIcon.className = 'fa-solid fa-pause';
                    albumArt.classList.add('spinning'); neonGlass.classList.add('active');
                } else { 
                    audio.pause(); 
                    playIcon.className = 'fa-solid fa-play'; fullPlayIcon.className = 'fa-solid fa-play';
                    albumArt.classList.remove('spinning'); neonGlass.classList.remove('active');
                }
            }
        }
        playBtn.addEventListener('click', togglePlay);
        fullPlayBtn.addEventListener('click', togglePlay);

        // 7. VISUALIZER
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

        // Library & History
        function saveHistory(song) {
            let history = JSON.parse(localStorage.getItem('neon_history')) || [];
            history = history.filter(s => s.trackName !== song.trackName);
            history.unshift(song);
            if(history.length > 15) history.pop();
            localStorage.setItem('neon_history', JSON.stringify(history));
        }
        const openLibraryBtn = document.getElementById('openLibraryBtn');
        const libraryPanel = document.getElementById('libraryPanel');
        const libraryList = document.getElementById('libraryList');
        openLibraryBtn.addEventListener('click', () => { libraryPanel.classList.remove('hidden'); switchLib('favorites'); });
        document.getElementById('closeLibrary').addEventListener('click', () => libraryPanel.classList.add('hidden'));

        window.switchLib = function(type) {
            document.querySelectorAll('.lib-tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            renderLibrary(type);
        }
        function renderLibrary(type) {
            const key = type === 'favorites' ? 'neon_favorites' : 'neon_history';
            const list = JSON.parse(localStorage.getItem(key)) || [];
            libraryList.innerHTML = '';
            if(list.length === 0) { libraryList.innerHTML = `<p style="text-align:center;color:#666;margin-top:20px">No songs in ${type}.</p>`; return; }
            list.forEach(song => {
                const img = song.artworkUrl100.replace('100x100', '150x150');
                const item = document.createElement('div'); item.className = 'lib-item';
                item.innerHTML = `<img src="${img}"><div class="lib-info"><h4>${song.trackName}</h4><p>${song.artistName}</p></div>`;
                item.addEventListener('click', () => { playTrack(song, img.replace('150x150', '400x400')); libraryPanel.classList.add('hidden'); });
                libraryList.appendChild(item);
            });
        }

        // Voice Search
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false; recognition.lang = 'en-US';
            voiceBtn.addEventListener('click', () => { recognition.start(); voiceBtn.classList.add('listening'); });
            recognition.onresult = (event) => { voiceBtn.classList.remove('listening'); const query = event.results[0][0].transcript; searchInput.value = query; searchSongs(query); };
        } else { voiceBtn.style.display = 'none'; }

        // Full Screen
        albumArt.addEventListener('click', () => fullPlayer.classList.remove('hidden'));
        closeFullPlayer.addEventListener('click', () => fullPlayer.classList.add('hidden'));

        // Progress
        const progressBar = document.getElementById('progressBar');
        audio.addEventListener('timeupdate', () => { if(audio.duration) progressBar.value = (audio.currentTime/audio.duration)*100; });
        progressBar.addEventListener('input', (e) => audio.currentTime = (audio.duration/100)*e.target.value);
    }

    // --- VIDEO DOWNLOADER (Updated Links) ---
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
            }, 1000);
        });

        document.getElementById('finalDownloadBtn').addEventListener('click', () => {
            const url = videoInput.value.trim();
            // Robust external downloader link
            if(url.includes('youtube') || url.includes('youtu.be')) {
               window.open(`https://ssyoutube.com/en/download?url=${url}`, '_blank');
            } else {
               window.open(`https://savefrom.net/${url}`, '_blank');
            }
        });
    }
});
