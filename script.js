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
    
    // Default search to show something on load
    searchSongs('Top Indian Hits');

    // --- SEARCH ---
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = e.target.value;
            if (query.length > 0) searchSongs(query);
            else searchSongs('Top Indian Hits');
        }, 500); // Wait 500ms after typing stops
    });

    async function searchSongs(query) {
        grid.innerHTML = '<div class="loader"></div>'; // Show loader
        gridTitle.innerText = `Results for "${query}"`;
        
        try {
            // Fetch from OUR Python Backend
            const res = await fetch(`/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            
            if (data.results && data.results.length > 0) {
                renderGrid(data.results);
            } else {
                grid.innerHTML = '<h3 style="color:#aaa; text-align:center;">No songs found.</h3>';
            }
        } catch (error) {
            console.error("Search failed:", error);
            grid.innerHTML = '<h3 style="color:red; text-align:center;">Error connecting to server. Run python app.py</h3>';
        }
    }

    function renderGrid(songs) {
        grid.innerHTML = '';
        songs.forEach(song => {
            // Only show if it has a preview url
            if (!song.previewUrl) return;

            const card = document.createElement('div');
            card.className = 'song-card';
            
            // Get high res image (replace 100x100 with 600x600 in url)
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
    function playTrack(song, img) {
        // UI Updates
        document.getElementById('trackTitle').innerText = song.trackName;
        document.getElementById('trackArtist').innerText = song.artistName;
        albumArt.style.backgroundImage = `url('${img}')`;
        
        // Audio Source
        audio.src = song.previewUrl;
        audio.play();
        
        isPlaying = true;
        updatePlayState();
    }

    let isPlaying = false;
    
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
