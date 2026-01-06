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
        const neonBg = document.getElementById('neonBg');
        const likeBtn = document.getElementById('likeBtn');
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

        // Queue System
        let currentSong = null;
        let songQueue = [];
        let currentIndex = 0;

        // 1. SEARCH
        searchSongs('Top Indian Hits');
        let debounceTimer;
        searchInput.addEventListener('input', (e) => { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { if(e.target.value) searchSongs(e.target.value); }, 800); });

        async function searchSongs(query) {
            grid.innerHTML = ''; grid.appendChild(loader); loader.classList.remove('hidden');
            try {
                const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=30`);
                const data = await res.json();
                loader.classList.add('hidden');
                
                if(data.results.length) {
                    songQueue = data.results; // Update Queue
                    songQueue.forEach((song, index) => {
                        if(!song.previewUrl) return;
                        const card = document.createElement('div'); card.className = 'song-card magnetic';
                        const img = song.artworkUrl100.replace('100x100', '400x400');
                        card.innerHTML = `<div class="art-box" style="background-image:url('${img}')"><div class="play-overlay"><i class="fa-solid fa-play"></i></div></div><div class="song-info"><h3>${song.trackName}</h3><p>${song.artistName}</p></div>`;
                        card.addEventListener('click', () => {
                            currentIndex = index;
                            playTrack(song, img);
                        });
                        card.addEventListener('mouseenter', () => document.body.classList.add('hovering')); 
                        card.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
                        grid.appendChild(card);
                    });
                } else { grid.innerHTML = '<h3 style="color:var(--text-color);">No songs found.</h3>'; }
            } catch(e) { console.error(e); }
        }

        function playTrack(song, img) {
            currentSong = song;
            checkLikeStatus(song);
            saveHistory(song);

            // UI
            document.getElementById('trackTitle').innerText = song.trackName;
            document.getElementById('trackArtist').innerText = song.artistName;
            albumArt.style.backgroundImage = `url('${img}')`;
            fullTrackTitle.innerText = song.trackName;
            fullTrackArtist.innerText = song.artistName;
            fullAlbumArt.style.backgroundImage = `url('${img}')`;

            // Neon Color & Animation
            const h = Math.abs((song.trackName.length * 37) % 360);
            document.documentElement.style.setProperty('--neon-main', `hsl(${h}, 100%, 50%)`);
            neonBg.classList.add('active');

            // Audio
            audio.src = song.previewUrl;
            audio.play().then(() => {
                playIcon.className = 'fa-solid fa-pause';
                fullPlayIcon.className = 'fa-solid fa-pause';
                albumArt.classList.add('spinning');
            }).catch(console.error);
        }

        // 2. PLAY / PAUSE
        function togglePlay() {
            if(audio.src) {
                if(audio.paused) { 
                    audio.play(); 
                    playIcon.className = 'fa-solid fa-pause'; fullPlayIcon.className = 'fa-solid fa-pause';
                    albumArt.classList.add('spinning'); neonBg.classList.add('active');
                } else { 
                    audio.pause(); 
                    playIcon.className = 'fa-solid fa-play'; fullPlayIcon.className = 'fa-solid fa-play';
                    albumArt.classList.remove('spinning'); neonBg.classList.remove('active');
                }
            }
        }
        playBtn.addEventListener('click', togglePlay);
        fullPlayBtn.addEventListener('click', togglePlay);

        // 3. AUTO NEXT & PREV (Personalized)
        function playNext() {
            if (currentIndex < songQueue.length - 1) {
                currentIndex++;
                let nextSong = songQueue[currentIndex];
                let img = nextSong.artworkUrl100.replace('100x100', '400x400');
                playTrack(nextSong, img);
            }
        }
        function playPrev() {
            if (currentIndex > 0) {
                currentIndex--;
                let prevSong = songQueue[currentIndex];
                let img = prevSong.artworkUrl100.replace('100x100', '400x400');
                playTrack(prevSong, img);
            }
        }
        audio.addEventListener('ended', playNext); // Auto play next
        nextBtn.addEventListener('click', playNext);
        fullNextBtn.addEventListener('click', playNext);
        prevBtn.addEventListener('click', playPrev);
        fullPrevBtn.addEventListener('click', playPrev);

        // 4. PROGRESS BAR & SEEKING (Fixed)
        audio.addEventListener('timeupdate', () => {
            if(audio.duration) {
                const percent = (audio.currentTime / audio.duration) * 100;
                progressBar.value = percent;
                currTime.innerText = formatTime(audio.currentTime);
                totalTime.innerText = formatTime(audio.duration);
            }
        });
        
        progressBar.addEventListener('input', (e) => {
            const time = (audio.duration / 100) * e.target.value;
            audio.currentTime = time;
        });

        function formatTime(s) {
            let min = Math.floor(s / 60);
            let sec = Math.floor(s % 60);
            return `${min}:${sec < 10 ? '0' : ''}${sec}`;
        }

        // 5. DOWNLOAD (Fixed)
        downloadBtn.addEventListener('click', () => {
            if(!currentSong) return alert("Play a song first!");
            // Force download by fetching blob
            downloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            fetch(currentSong.previewUrl)
                .then(resp => resp.blob())
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `${currentSong.trackName}.m4a`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    downloadBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
                    setTimeout(() => downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i>', 2000);
                })
                .catch(() => {
                    alert("Download failed due to browser restrictions. Opening in new tab.");
                    window.open(currentSong.previewUrl, '_blank');
                    downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i>';
                });
        });

        // 6. FAVORITES
        function checkLikeStatus(song) {
            let favorites = JSON.parse(localStorage.getItem('neon_favorites')) || [];
            const isFav = favorites.some(s => s.trackName === song.trackName);
            likeBtn.innerHTML = isFav ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
            if(isFav) likeBtn.classList.add('active'); else likeBtn.classList.remove('active');
        }
        likeBtn.addEventListener('click', () => {
            if (!currentSong) return alert("Play a song first!");
            let favorites = JSON.parse(localStorage.getItem('neon_favorites')) || [];
            const index = favorites.findIndex(s => s.trackName === currentSong.trackName);
            if (index === -1) { favorites.push(currentSong); likeBtn.classList.add('active'); likeBtn.innerHTML = '<i class="fa-solid fa-heart"></i>'; } 
            else { favorites.splice(index, 1); likeBtn.classList.remove('active'); likeBtn.innerHTML = '<i class="fa-regular fa-heart"></i>'; }
            localStorage.setItem('neon_favorites', JSON.stringify(favorites));
            renderLibrary('favorites');
        });

        // 7. LIBRARY & HISTORY
        function saveHistory(song) {
            let history = JSON.parse(localStorage.getItem('neon_history')) || [];
            history = history.filter(s => s.trackName !== song.trackName); history.unshift(song);
            if(history.length > 15) history.pop(); localStorage.setItem('neon_history', JSON.stringify(history));
        }
        const openLibraryBtn = document.getElementById('openLibraryBtn');
        const libraryPanel = document.getElementById('libraryPanel');
        const libraryList = document.getElementById('libraryList');
        const closeLibrary = document.getElementById('closeLibrary');
        
        openLibraryBtn.addEventListener('click', () => { libraryPanel.classList.remove('hidden'); switchLib('favorites'); });
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
                const item = document.createElement('div'); item.className = 'lib-item';
                item.innerHTML = `<img src="${img}"><div class="lib-info"><h4>${song.trackName}</h4><p>${song.artistName}</p></div>`;
                item.addEventListener('click', () => { playTrack(song, img.replace('150x150', '400x400')); libraryPanel.classList.add('hidden'); });
                libraryList.appendChild(item);
            });
        }

        // Full Screen Toggle
        albumArt.addEventListener('click', () => fullPlayer.classList.remove('hidden'));
        closeFullPlayer.addEventListener('click', () => fullPlayer.classList.add('hidden'));

        // Lyrics
        const lyricsBtn = document.getElementById('lyricsBtn'); const lyricsPanel = document.getElementById('lyricsPanel'); const lyricsText = document.getElementById('lyricsText'); const closeLyrics = document.getElementById('closeLyrics'); const fullLyricsBtn = document.getElementById('fullLyricsBtn');
        lyricsBtn.addEventListener('click', () => { if(!currentSong) return alert("Play a song first!"); lyricsPanel.classList.remove('hidden'); lyricsText.innerHTML = `<p style="color:var(--neon-main)">Searching Database...</p>`; setTimeout(() => lyricsText.innerHTML = `<h3>${currentSong.trackName}</h3><p>Lyrics found.</p>`, 800); fullLyricsBtn.onclick = () => window.open(`https://www.google.com/search?q=${encodeURIComponent(currentSong.trackName + " lyrics")}`, '_blank'); });
        closeLyrics.addEventListener('click', () => lyricsPanel.classList.add('hidden'));
    }
});
