document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SETUP AUDIO PLAYER ---
    const audioPlayer = new Audio();
    // Reliable, fast-loading test track (Copyright Free)
    const TEST_TRACK = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

    // --- 2. SONG LIBRARY ---
    const songs = [
        { title: "Seet Lehar", artist: "Filmy, Riyaazi", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80" },
        { title: "End of Beginning", artist: "Djo", img: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=500&q=80" },
        { title: "Starboy", artist: "The Weeknd", img: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80" },
        { title: "Espresso", artist: "Sabrina Carpenter", img: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=500&q=80" },
        { title: "Softly", artist: "Karan Aujla", img: "https://images.unsplash.com/photo-1459749411177-0473ef71607b?w=500&q=80" },
        { title: "Midnight City", artist: "M83", img: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80" },
        { title: "Levitating", artist: "Dua Lipa", img: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=500&q=80" },
        { title: "Blinding Lights", artist: "The Weeknd", img: "https://images.unsplash.com/photo-1621360841012-3f6e2b95b81a?w=500&q=80" },
        { title: "Heat Waves", artist: "Glass Animals", img: "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=500&q=80" },
        { title: "As It Was", artist: "Harry Styles", img: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&q=80" },
        { title: "Bad Habit", artist: "Steve Lacy", img: "https://images.unsplash.com/photo-1621112904891-5af48742420d?w=500&q=80" },
        { title: "Anti-Hero", artist: "Taylor Swift", img: "https://images.unsplash.com/photo-1496293455970-f8581aae0e3c?w=500&q=80" }
    ];

    // DOM Elements
    const grid = document.getElementById('musicGrid');
    const searchInput = document.getElementById('searchInput');
    const playBtn = document.getElementById('playBtn');
    const playIcon = document.getElementById('playIcon');
    const neonBg = document.getElementById('neonBg'); // The Beat Background
    const nowPlayingImg = document.getElementById('nowPlayingImg'); // The CD
    const trackTitle = document.getElementById('trackTitle');
    const trackArtist = document.getElementById('trackArtist');
    const progressBar = document.getElementById('progressBar');
    const currentTimeEl = document.querySelector('.time.current');
    const totalTimeEl = document.querySelector('.time.total');

    let isPlaying = false;

    // --- 3. RENDER & SEARCH FUNCTION ---
    function renderSongs(data) {
        grid.innerHTML = ''; // Clear grid
        
        if (data.length === 0) {
            grid.innerHTML = '<p style="color:white; font-size:1.2rem; text-align:center; grid-column:1/-1;">No songs found</p>';
            return;
        }

        data.forEach(song => {
            const card = document.createElement('div');
            card.className = 'song-card';
            card.innerHTML = `
                <div class="album-art" style="background-image: url('${song.img}')"></div>
                <div class="song-info">
                    <h3>${song.title}</h3>
                    <p>${song.artist}</p>
                </div>
            `;
            // Click to Play
            card.addEventListener('click', () => loadAndPlay(song));
            grid.appendChild(card);
        });
    }

    // Initialize with all songs
    renderSongs(songs);

    // Search Listener
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = songs.filter(s => 
            s.title.toLowerCase().includes(query) || 
            s.artist.toLowerCase().includes(query)
        );
        renderSongs(filtered);
    });

    // --- 4. PLAYBACK LOGIC ---
    function loadAndPlay(song) {
        // Update UI Text & Image
        trackTitle.textContent = song.title;
        trackArtist.textContent = song.artist;
        nowPlayingImg.style.backgroundImage = `url('${song.img}')`;

        // Load Audio
        audioPlayer.src = TEST_TRACK;
        
        // Play
        playMusic();
    }

    function playMusic() {
        audioPlayer.play().then(() => {
            isPlaying = true;
            updateVisuals(true);
        }).catch(err => console.error("Play error:", err));
    }

    function pauseMusic() {
        audioPlayer.pause();
        isPlaying = false;
        updateVisuals(false);
    }

    // Toggle Button
    playBtn.addEventListener('click', () => {
        if (!audioPlayer.src || audioPlayer.src === "") {
            // If no song loaded, pick the first one
            loadAndPlay(songs[0]);
        } else {
            if (isPlaying) pauseMusic();
            else playMusic();
        }
    });

    // --- 5. VISUAL EFFECTS (Glass + Neon + Beat) ---
    function updateVisuals(active) {
        if (active) {
            playIcon.className = 'fa-solid fa-pause';
            nowPlayingImg.classList.add('spinning'); // Spin CD
            if(neonBg) neonBg.classList.add('active'); // Start Beat Animation
        } else {
            playIcon.className = 'fa-solid fa-play';
            nowPlayingImg.classList.remove('spinning'); // Stop CD
            if(neonBg) neonBg.classList.remove('active'); // Stop Beat Animation
        }
    }

    // --- 6. PROGRESS BAR ---
    audioPlayer.addEventListener('timeupdate', () => {
        if (audioPlayer.duration) {
            const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressBar.value = percent;
            currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
            totalTimeEl.textContent = formatTime(audioPlayer.duration);
        }
    });

    progressBar.addEventListener('input', (e) => {
        const seekTime = (audioPlayer.duration / 100) * e.target.value;
        audioPlayer.currentTime = seekTime;
    });

    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }
});
