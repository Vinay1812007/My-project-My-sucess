document.addEventListener('DOMContentLoaded', () => {

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
    
    // Initial Load
    searchSongs('Top Indian Hits');

    // --- SEARCH LOGIC (Direct API Access) ---
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
        // Show loader
        grid.innerHTML = '';
        grid.appendChild(loader);
        loader.classList.remove('hidden');
        gridTitle.innerText = `Results for "${query}"`;
        
        try {
            // DIRECT CALL TO ITUNES API (Bypasses backend requirement)
            const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=25`);
            const data = await response.json();
            
            loader.classList.add('hidden');
            
            if (data.results && data.results.length > 0) {
                renderGrid(data.results);
            } else {
                grid.innerHTML = '<h3 style="color:#aaa; text-align:center; grid-column:1/-1;">No songs found. Try a different search.</h3>';
            }
        } catch (error) {
            console.error("Search failed:", error);
            // Fallback if API is blocked (e.g. by strict firewall)
            grid.innerHTML = '<h3 style="color:#ff5555; text-align:center; grid-column:1/-1;">Connection Error. Please check your internet.</h3>';
        }
    }

    function renderGrid(songs) {
        grid.innerHTML = ''; // Clear loader
        songs.forEach(song => {
            // Only show songs with previews
            if (!song.previewUrl) return;

            const card = document.createElement('div');
            card.className = 'song-card';
            
            // Get higher resolution image
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

    // --- PLAYBACK ---
    let isPlaying = false;

    function playTrack(song, img) {
        document.getElementById('trackTitle').innerText = song.trackName;
        document.getElementById('trackArtist').innerText = song.artistName;
        albumArt.style.backgroundImage = `url('${img}')`;
        
        audio.src = song.previewUrl;
        audio.play().then(() => {
            isPlaying = true;
            updatePlayState();
        }).catch(err => console.error("Play error", err));
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

    // Auto update state on audio events
    audio.addEventListener('play', () => { isPlaying = true; updatePlayState(); });
    audio.addEventListener('pause', () => { isPlaying = false; updatePlayState(); });
    audio.addEventListener('ended', () => { isPlaying = false; updatePlayState(); });
    
    // Progress Bar
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

    // Volume
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
