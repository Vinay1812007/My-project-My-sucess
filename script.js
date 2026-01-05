document.addEventListener('DOMContentLoaded', () => {
    
    // --- CUSTOM CURSOR ---
    const cursorDot = document.getElementById('cursorDot');
    const cursorOutline = document.getElementById('cursorOutline');
    
    if (cursorDot && cursorOutline) {
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;
            
            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        });

        // Magnetic Effect
        document.querySelectorAll('.magnetic').forEach(btn => {
            btn.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
            btn.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
        });
    }

    // --- PARALLAX BACKGROUND ---
    const layer1 = document.getElementById('layer1');
    if (layer1) {
        document.addEventListener('mousemove', (e) => {
            const x = (window.innerWidth - e.pageX * 2) / 100;
            const y = (window.innerHeight - e.pageY * 2) / 100;
            layer1.style.transform = `translate(${x}px, ${y}px)`;
        });
    }

    // ============================================
    // PAGE SPECIFIC LOGIC
    // ============================================

    // --- 1. MUSIC PAGE LOGIC ---
    const grid = document.getElementById('musicGrid');
    if (grid) {
        // We are on index.html (Music)
        const searchInput = document.getElementById('searchInput');
        const audio = document.getElementById('audioPlayer');
        const playBtn = document.getElementById('playBtn');
        const playIcon = document.getElementById('playIcon');
        const progressBar = document.getElementById('progressBar');
        const albumArt = document.getElementById('albumArt');
        const beatBg = document.getElementById('beatBg');
        const gridTitle = document.getElementById('gridTitle');
        const loader = document.getElementById('loader');
        const downloadLink = document.getElementById('downloadLink');
        const lyricsBtn = document.getElementById('lyricsBtn');
        const lyricsPanel = document.getElementById('lyricsPanel');
        const closeLyrics = document.getElementById('closeLyrics');
        const lyricsText = document.getElementById('lyricsText');
        const fullLyricsBtn = document.getElementById('fullLyricsBtn');

        let currentSong = null;

        searchSongs('Top Indian Hits');

        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if(e.target.value) searchSongs(e.target.value);
            }, 800);
        });

        async function searchSongs(query) {
            grid.innerHTML = '';
            grid.appendChild(loader);
            loader.classList.remove('hidden');
            gridTitle.innerText = `Results for "${query}"`;
            
            try {
                const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=24`);
                const data = await res.json();
                loader.classList.add('hidden');
                
                if(data.results.length) {
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
                    grid.innerHTML = '<h3>No songs found.</h3>';
                }
            } catch(e) { console.error(e); }
        }

        function playTrack(song, img) {
            currentSong = song;
            document.getElementById('trackTitle').innerText = song.trackName;
            document.getElementById('trackArtist').innerText = song.artistName;
            albumArt.style.backgroundImage = `url('${img}')`;
            
            const h = Math.abs((song.trackName.length * 37) % 360);
            document.documentElement.style.setProperty('--neon-main', `hsl(${h}, 100%, 50%)`);

            audio.src = song.previewUrl;
            audio.play();
            beatBg.classList.add('active');
            albumArt.classList.add('spinning');
            playIcon.className = 'fa-solid fa-pause';
            downloadLink.href = song.previewUrl;
        }

        playBtn.addEventListener('click', () => {
            if(audio.src) {
                if(audio.paused) { 
                    audio.play(); 
                    playIcon.className = 'fa-solid fa-pause'; 
                    albumArt.classList.add('spinning');
                } else { 
                    audio.pause(); 
                    playIcon.className = 'fa-solid fa-play'; 
                    albumArt.classList.remove('spinning');
                }
            }
        });

        // Lyrics
        lyricsBtn.addEventListener('click', () => {
            if(!currentSong) return alert("Play a song first!");
            lyricsPanel.classList.remove('hidden');
            lyricsText.innerHTML = `<p style="color:var(--neon-main)">Connecting AI...</p>`;
            setTimeout(() => {
                lyricsText.innerHTML = `<h3>${currentSong.trackName}</h3><p>Full lyrics found via Google Search.</p>`;
            }, 1000);
            fullLyricsBtn.onclick = () => window.open(`https://www.google.com/search?q=${encodeURIComponent(currentSong.trackName + " lyrics")}`, '_blank');
        });
        closeLyrics.addEventListener('click', () => lyricsPanel.classList.add('hidden'));

        // Progress
        audio.addEventListener('timeupdate', () => {
            if(audio.duration) progressBar.value = (audio.currentTime/audio.duration)*100;
        });
        progressBar.addEventListener('input', (e) => {
            audio.currentTime = (audio.duration/100)*e.target.value;
        });
    }

    // --- 2. VIDEO DOWNLOADER LOGIC ---
    const fetchBtn = document.getElementById('fetchVideoBtn');
    if (fetchBtn) {
        // We are on videodownloader.html
        const dlResult = document.getElementById('dlResult');
        const previewPlayer = document.getElementById('previewPlayer');
        
        fetchBtn.addEventListener('click', () => {
            const url = document.getElementById('videoUrl').value;
            if(!url) return alert("Paste a link first!");
            
            fetchBtn.innerText = "Fetching Info...";
            
            setTimeout(() => {
                fetchBtn.innerText = "Fetch";
                dlResult.classList.remove('hidden');
                
                // Demo Logic
                previewPlayer.src = "https://www.w3schools.com/html/mov_bbb.mp4"; 
                document.getElementById('vidTitle').innerText = "Video Ready for Download";
                document.getElementById('vidDuration').innerText = "03:45 • Source Detected";
            }, 1500);
        });

        document.getElementById('finalDownloadBtn').addEventListener('click', () => {
            const url = document.getElementById('videoUrl').value;
            window.open(`https://savefrom.net/${url}`, '_blank');
        });
    }
});
