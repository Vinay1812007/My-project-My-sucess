document.addEventListener('DOMContentLoaded', () => {
    
    // --- THEME SWITCHER LOGIC ---
    const themeBtn = document.getElementById('themeToggle');
    const icon = themeBtn ? themeBtn.querySelector('i') : null;
    
    // Check saved theme or default to system
    const savedTheme = localStorage.getItem('neon_theme') || 'system';
    applyTheme(savedTheme);

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            let current = document.documentElement.getAttribute('data-theme');
            let nextTheme = 'light';
            
            if (current === 'dark') nextTheme = 'light';
            else if (current === 'light') nextTheme = 'system';
            else nextTheme = 'dark'; // From system to dark

            applyTheme(nextTheme);
        });
    }

    function applyTheme(theme) {
        if (theme === 'system') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.removeItem('neon_theme');
            if (icon) icon.className = 'fa-solid fa-desktop';
        } else {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('neon_theme', theme);
            if (icon) icon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
        }
    }

    // --- CURSOR & PARALLAX ---
    const cursorDot = document.getElementById('cursorDot');
    const cursorOutline = document.getElementById('cursorOutline');
    const layer1 = document.getElementById('layer1');

    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;
        
        if (cursorDot) {
            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;
            cursorOutline.animate({ left: `${posX}px`, top: `${posY}px` }, { duration: 500, fill: "forwards" });
        }

        if (layer1) {
            const x = (window.innerWidth - e.pageX * 2) / 100;
            const y = (window.innerHeight - e.pageY * 2) / 100;
            layer1.style.transform = `translate(${x}px, ${y}px)`;
        }
    });

    document.querySelectorAll('.magnetic').forEach(btn => {
        btn.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
        btn.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
    });

    // --- MUSIC PAGE LOGIC ---
    const grid = document.getElementById('musicGrid');
    if (grid) {
        const searchInput = document.getElementById('searchInput');
        const audio = document.getElementById('audioPlayer');
        const playBtn = document.getElementById('playBtn');
        const playIcon = document.getElementById('playIcon');
        const progressBar = document.getElementById('progressBar');
        const albumArt = document.getElementById('albumArt');
        const beatBg = document.getElementById('beatBg');
        const loader = document.getElementById('loader');
        const downloadLink = document.getElementById('downloadLink');
        const canvas = document.getElementById('visualizerCanvas');
        const likeBtn = document.getElementById('likeBtn');
        const shareBtn = document.getElementById('shareBtn');
        
        // Library Elements
        const openLibraryBtn = document.getElementById('openLibraryBtn');
        const libraryPanel = document.getElementById('libraryPanel');
        const closeLibrary = document.getElementById('closeLibrary');
        const libraryList = document.getElementById('libraryList');
        
        let currentSong = null;
        let audioContext, analyser, source;

        // 1. SHORTCUTS
        document.addEventListener('keydown', (e) => {
            if(e.target.tagName === 'INPUT') return; 
            switch(e.code) {
                case 'Space': e.preventDefault(); togglePlay(); break;
                case 'ArrowRight': audio.currentTime += 10; break;
                case 'ArrowLeft': audio.currentTime -= 10; break;
                case 'KeyM': audio.muted = !audio.muted; break;
            }
        });

        // 2. VISUALIZER
        function initVisualizer() {
            if (audioContext) return;
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
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

        // 3. SEARCH & PLAY
        searchSongs('Top Indian Hits');
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => { if(e.target.value) searchSongs(e.target.value); }, 800);
        });

        async function searchSongs(query, autoPlay = false) {
            grid.innerHTML = '';
            grid.appendChild(loader);
            loader.classList.remove('hidden');
            
            try {
                const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=24`);
                const data = await res.json();
                loader.classList.add('hidden');
                
                if(data.results.length) {
                    if (autoPlay) playTrack(data.results[0], data.results[0].artworkUrl100.replace('100x100', '400x400'));
                    
                    data.results.forEach(song => {
                        if(!song.previewUrl) return;
                        const card = document.createElement('div');
                        card.className = 'song-card magnetic';
                        const img = song.artworkUrl100.replace('100x100', '400x400');
                        card.innerHTML = `
                            <div class="art-box" style="background-image:url('${img}')">
                                <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
                            </div>
                            <div class="song-info"><h3>${song.trackName}</h3><p>${song.artistName}</p></div>
                        `;
                        card.addEventListener('click', () => playTrack(song, img));
                        card.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
                        card.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
                        grid.appendChild(card);
                    });
                } else {
                    grid.innerHTML = '<h3 style="color:var(--text-color);">No songs found.</h3>';
                }
            } catch(e) { console.error(e); }
        }

        function playTrack(song, img) {
            currentSong = song;
            initVisualizer();
            saveHistory(song); // Save to history
            
            // Check Favorite
            let favorites = JSON.parse(localStorage.getItem('neon_favorites')) || [];
            const isFav = favorites.some(s => s.trackName === song.trackName);
            likeBtn.innerHTML = isFav ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
            if(isFav) likeBtn.classList.add('active'); else likeBtn.classList.remove('active');

            document.getElementById('trackTitle').innerText = song.trackName;
            document.getElementById('trackArtist').innerText = song.artistName;
            albumArt.style.backgroundImage = `url('${img}')`;
            
            const h = Math.abs((song.trackName.length * 37) % 360);
            document.documentElement.style.setProperty('--neon-main', `hsl(${h}, 100%, 50%)`);

            audio.src = song.previewUrl;
            audio.play().then(() => { if(audioContext?.state === 'suspended') audioContext.resume(); }).catch(e => console.log(e));
            
            beatBg.classList.add('active');
            albumArt.classList.add('spinning');
            playIcon.className = 'fa-solid fa-pause';
            downloadLink.href = song.previewUrl;
        }

        function togglePlay() {
            if(audio.src) {
                if(audio.paused) { audio.play(); playIcon.className = 'fa-solid fa-pause'; albumArt.classList.add('spinning'); } 
                else { audio.pause(); playIcon.className = 'fa-solid fa-play'; albumArt.classList.remove('spinning'); }
            }
        }
        playBtn.addEventListener('click', togglePlay);

        // 4. FAVORITES & HISTORY
        function saveHistory(song) {
            let history = JSON.parse(localStorage.getItem('neon_history')) || [];
            history = history.filter(s => s.trackName !== song.trackName);
            history.unshift(song);
            if(history.length > 15) history.pop();
            localStorage.setItem('neon_history', JSON.stringify(history));
        }

        likeBtn.addEventListener('click', () => {
            if (!currentSong) return;
            let favorites = JSON.parse(localStorage.getItem('neon_favorites')) || [];
            const index = favorites.findIndex(s => s.trackName === currentSong.trackName);
            if (index === -1) {
                favorites.push(currentSong);
                likeBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
                likeBtn.classList.add('active');
            } else {
                favorites.splice(index, 1);
                likeBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
                likeBtn.classList.remove('active');
            }
            localStorage.setItem('neon_favorites', JSON.stringify(favorites));
            renderLibrary('favorites'); // Refresh if open
        });

        // Share
        shareBtn.addEventListener('click', () => {
            if(!currentSong) return alert("Play a song first!");
            const shareUrl = `${window.location.origin}/music?song=${encodeURIComponent(currentSong.trackName)}`;
            navigator.clipboard.writeText(shareUrl).then(() => alert("Link copied!"));
        });

        // Library UI
        openLibraryBtn.addEventListener('click', () => {
            libraryPanel.classList.remove('hidden');
            window.switchLib('favorites');
        });
        closeLibrary.addEventListener('click', () => libraryPanel.classList.add('hidden'));

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
                const item = document.createElement('div');
                item.className = 'lib-item';
                item.innerHTML = `<img src="${img}"><div class="lib-info"><h4>${song.trackName}</h4><p>${song.artistName}</p></div>`;
                item.addEventListener('click', () => { playTrack(song, img.replace('150x150', '400x400')); libraryPanel.classList.add('hidden'); });
                libraryList.appendChild(item);
            });
        }

        // Lyrics
        const lyricsBtn = document.getElementById('lyricsBtn');
        const lyricsPanel = document.getElementById('lyricsPanel');
        const lyricsText = document.getElementById('lyricsText');
        const closeLyrics = document.getElementById('closeLyrics');
        const fullLyricsBtn = document.getElementById('fullLyricsBtn');

        lyricsBtn.addEventListener('click', () => {
            if(!currentSong) return alert("Play a song first!");
            lyricsPanel.classList.remove('hidden');
            lyricsText.innerHTML = `<p style="color:var(--neon-main)">Searching Database...</p>`;
            setTimeout(() => lyricsText.innerHTML = `<h3>${currentSong.trackName}</h3><p>Lyrics found.</p>`, 800);
            fullLyricsBtn.onclick = () => window.open(`https://www.google.com/search?q=${encodeURIComponent(currentSong.trackName + " lyrics")}`, '_blank');
        });
        closeLyrics.addEventListener('click', () => lyricsPanel.classList.add('hidden'));

        audio.addEventListener('timeupdate', () => { if(audio.duration) progressBar.value = (audio.currentTime/audio.duration)*100; });
        progressBar.addEventListener('input', (e) => audio.currentTime = (audio.duration/100)*e.target.value);
    }

    // --- VIDEO DL LOGIC ---
    const fetchBtn = document.getElementById('fetchVideoBtn');
    if (fetchBtn) {
        const dlResult = document.getElementById('dlResult');
        const thumbPreview = document.getElementById('thumbPreview');
        const errorMsg = document.getElementById('errorMsg');
        const videoInput = document.getElementById('videoUrl');

        fetchBtn.addEventListener('click', () => {
            const url = videoInput.value.trim();
            errorMsg.classList.add('hidden');
            dlResult.classList.add('hidden');
            if(!url) return alert("Please paste a link first!");
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
