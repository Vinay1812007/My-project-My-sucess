document.addEventListener('DOMContentLoaded', () => {

    // DOM Elements
    const grid = document.getElementById('musicGrid');
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

    // Current Song Info
    let currentSong = null;

    // Initial Load
    searchSongs('Top Indian Hits');

    // --- COLOR GENERATOR (Song Based) ---
    // Generates a unique neon HSL color based on the song title string
    function generateNeonColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Force high saturation (80-100%) and lightness (50-60%) for NEON look
        const h = Math.abs(hash % 360);
        return `hsl(${h}, 100%, 50%)`;
    }

    // --- SEARCH LOGIC ---
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = e.target.value.trim();
            if (query.length > 0) searchSongs(query);
            else searchSongs('Top Indian Hits');
        }, 800);
    });

    async function searchSongs(query) {
        grid.innerHTML = '';
        grid.appendChild(loader);
        loader.classList.remove('hidden');
        gridTitle.innerText = `Results for "${query}"`;
        
        try {
            const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=25`);
            const data = await response.json();
            
            loader.classList.add('hidden');
            
            if (data.results && data.results.length > 0) {
                renderGrid(data.results);
            } else {
                grid.innerHTML = '<h3 style="color:#aaa; text-align:center; grid-column:1/-1;">No songs found.</h3>';
            }
        } catch (error) {
            console.error("Search failed:", error);
            grid.innerHTML = '<h3 style="color:#ff5555; text-align:center; grid-column:1/-1;">Connection Error. Check internet.</h3>';
        }
    }

    function renderGrid(songs) {
        grid.innerHTML = '';
        songs.forEach(song => {
            if (!song.previewUrl) return;

            const card = document.createElement('div');
            card.className = 'song-card';
            const highResImg = song.artworkUrl100.replace('100x100', '400x400');
            
            card.innerHTML = `
                <div class="art-box" style="background-image: url('${highResImg}');">
                    <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
                </div>
                <div class="song-info">
                    <h3>${song.trackName}</h3>
                    <p>${song.artistName}</p>
                </div>
            `;
            
            card.addEventListener('click', () => playTrack(song, highResImg));
            grid.appendChild(card);
        });
    }

    // --- PLAYBACK & DYNAMIC NEON ---
    let isPlaying = false;

    function playTrack(song, img) {
        currentSong = song; // Store for lyrics/download

        // 1. Update Text
        document.getElementById('trackTitle').innerText = song.trackName;
        document.getElementById('trackArtist').innerText = song.artistName;
        albumArt.style.backgroundImage = `url('${img}')`;
        
        // 2. Dynamic Neon Color
        const neonColor = generateNeonColor(song.trackName + song.artistName);
        document.documentElement.style.setProperty('--neon-main', neonColor);

        // 3. Audio Source
        audio.src = song.previewUrl;
        audio.play().then(() => {
            isPlaying = true;
            updatePlayState();
        }).catch(err => console.error("Play error", err));

        // 4. Setup Download Link
        // iTunes previews are usually m4a. We allow download.
        downloadLink.href = song.previewUrl;
        // Note: 'download' attribute only works for same-origin, 
        // so it might open in new tab for external links (standard browser security).
        downloadLink.setAttribute('target', '_blank'); 
    }

    playBtn.addEventListener('click', () => {
        if (audio.src) {
            if (audio.paused) {
                audio.play();
                isPlaying = true;
            } else {
                audio.pause();
                isPlaying = false;
            }
            updatePlayState();
        }
    });

    function updatePlayState() {
        if (isPlaying) {
            playIcon.className = 'fa-solid fa-pause';
            beatBg.classList.add('active');
            albumArt.classList.add('spinning');
        } else {
            playIcon.className = 'fa-solid fa-play';
            beatBg.classList.remove('active');
            albumArt.classList.remove('spinning');
        }
    }

    audio.addEventListener('play', () => { isPlaying = true; updatePlayState(); });
    audio.addEventListener('pause', () => { isPlaying = false; updatePlayState(); });
    audio.addEventListener('ended', () => { isPlaying = false; updatePlayState(); });
    
    // --- LYRICS FEATURE ---
    lyricsBtn.addEventListener('click', () => {
        if (!currentSong) return alert("Play a song first!");
        
        lyricsPanel.classList.remove('hidden');
        lyricsText.innerHTML = `<h3>${currentSong.trackName}</h3><p>Lyrics are provided by external search.</p>`;
        
        // Setup the "Find Full Lyrics" button
        fullLyricsBtn.onclick = () => {
            const query = `${currentSong.trackName} ${currentSong.artistName} lyrics`;
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        };
    });

    closeLyrics.addEventListener('click', () => {
        lyricsPanel.classList.add('hidden');
    });

    // --- CONTROLS ---
    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            const percent = (audio.currentTime / audio.duration) * 100;
            progressBar.value = percent;
            document.getElementById('currTime').innerText = formatTime(audio.currentTime);
            document.getElementById('totalTime').innerText = formatTime(audio.duration);
        }
    });

    progressBar.addEventListener('input', (e) => {
        const time = (audio.duration / 100) * e.target.value;
        audio.currentTime = time;
    });

    const volumeBar = document.getElementById('volumeBar');
    volumeBar.addEventListener('input', (e) => {
        audio.volume = e.target.value / 100;
    });

    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }
});
