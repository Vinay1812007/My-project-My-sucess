document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
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
    
    // Background Layers
    const layer1 = document.getElementById('layer1');
    const layer2 = document.getElementById('layer2');

    let currentSong = null;

    // --- GYROSCOPIC / PARALLAX EFFECT ---
    // PC: Mouse Movement
    document.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth - e.pageX * 2) / 100;
        const y = (window.innerHeight - e.pageY * 2) / 100;
        
        layer1.style.transform = `translate(${x}px, ${y}px)`;
        layer2.style.transform = `translate(${x * 2}px, ${y * 2}px)`;
    });

    // Mobile: Device Orientation (Tilt)
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (e) => {
            const x = e.gamma / 5; // Left-to-right tilt
            const y = e.beta / 5;  // Front-to-back tilt
            
            layer1.style.transform = `translate(${x}px, ${y}px)`;
            layer2.style.transform = `translate(${x * 2}px, ${y * 2}px)`;
        });
    }

    // --- TAB SWITCHER ---
    window.switchTab = function(tab) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('main').forEach(m => {
            m.classList.remove('active-section');
            m.classList.add('hidden-section');
        });

        if (tab === 'music') {
            document.querySelector("button[onclick=\"switchTab('music')\"]").classList.add('active');
            document.getElementById('musicSection').classList.remove('hidden-section');
            document.getElementById('musicSection').classList.add('active-section');
            document.getElementById('musicPlayerBar').style.display = 'flex';
        } else {
            document.querySelector("button[onclick=\"switchTab('video')\"]").classList.add('active');
            document.getElementById('videoSection').classList.remove('hidden-section');
            document.getElementById('videoSection').classList.add('active-section');
            document.getElementById('musicPlayerBar').style.display = 'none';
        }
    }

    // --- MUSIC SEARCH LOGIC ---
    searchSongs('Top Indian Hits');

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
        document.querySelector('.seo-placeholder').style.display = 'none'; // Hide SEO text
        gridTitle.innerText = `Results for "${query}"`;
        
        try {
            const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=24`);
            const data = await response.json();
            loader.classList.add('hidden');
            
            if (data.results && data.results.length > 0) {
                renderGrid(data.results);
            } else {
                grid.innerHTML = '<h3 style="color:#aaa; text-align:center; grid-column:1/-1;">No songs found.</h3>';
            }
        } catch (error) {
            console.error("Search error:", error);
            grid.innerHTML = '<h3 style="color:#ff5555; text-align:center; grid-column:1/-1;">Connection Error. Check internet.</h3>';
        }
    }

    function renderGrid(songs) {
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

    // --- PLAYBACK ---
    function playTrack(song, img) {
        currentSong = song;
        document.getElementById('trackTitle').innerText = song.trackName;
        document.getElementById('trackArtist').innerText = song.artistName;
        albumArt.style.backgroundImage = `url('${img}')`;

        // Dynamic Neon Color
        const h = Math.abs((song.trackName.length * 37) % 360);
        document.documentElement.style.setProperty('--neon-main', `hsl(${h}, 100%, 50%)`);

        audio.src = song.previewUrl;
        audio.play().catch(e => console.log(e));
        
        // Update Download Link
        downloadLink.href = song.previewUrl;

        updatePlayState(true);
    }

    playBtn.addEventListener('click', () => {
        if (audio.paused && audio.src) {
            audio.play();
            updatePlayState(true);
        } else if (audio.src) {
            audio.pause();
            updatePlayState(false);
        }
    });

    function updatePlayState(playing) {
        if (playing) {
            playIcon.className = 'fa-solid fa-pause';
            beatBg.classList.add('active');
            albumArt.classList.add('spinning');
        } else {
            playIcon.className = 'fa-solid fa-play';
            beatBg.classList.remove('active');
            albumArt.classList.remove('spinning');
        }
    }
    
    // --- AUTO LYRICS (Simulated) ---
    lyricsBtn.addEventListener('click', () => {
        if (!currentSong) return alert("Play a song first!");
        lyricsPanel.classList.remove('hidden');
        
        lyricsText.innerHTML = `<p style="color:var(--neon-main);">Connecting to Lyrics AI...</p>`;
        
        // Simulate "Generating"
        setTimeout(() => {
            lyricsText.innerHTML = `
                <p>Generating lyrics for <strong>${currentSong.trackName}</strong>...</p>
                <br>
                <p style="opacity:0.7;">(Note: Due to copyright, we auto-redirect to the full licensed lyrics below)</p>
            `;
        }, 1000);

        fullLyricsBtn.onclick = () => {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(currentSong.trackName + " " + currentSong.artistName + " lyrics")}`, '_blank');
        };
    });

    closeLyrics.addEventListener('click', () => lyricsPanel.classList.add('hidden'));

    // --- VIDEO DOWNLOADER LOGIC ---
    document.getElementById('downloadVideoBtn').addEventListener('click', () => {
        const url = document.getElementById('videoUrl').value;
        const status = document.getElementById('videoStatus');
        
        if (!url) return alert("Please paste a URL!");
        
        status.innerHTML = '<p style="color:var(--neon-main);">Processing video...</p>';
        
        // Simulating process then redirect to a helper service
        setTimeout(() => {
            status.innerHTML = '<p style="color:#0f0;">Link generated! Opening downloader...</p>';
            // Redirect to a common public downloader helper
            window.open(`https://savefrom.net/${url}`, '_blank');
            status.innerHTML = '';
        }, 1500);
    });

    // Standard Audio Events
    audio.addEventListener('timeupdate', () => {
        if(audio.duration) progressBar.value = (audio.currentTime/audio.duration)*100;
    });
    progressBar.addEventListener('input', (e) => {
        audio.currentTime = (audio.duration/100)*e.target.value;
    });
});
