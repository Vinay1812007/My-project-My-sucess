document.addEventListener('DOMContentLoaded', () => {

    const audioPlayer = new Audio();
    // Using a reliable, fast-loading demo track for all songs (Copyright Free)
    const DEMO_TRACK = 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3';

    // --- 1. EXPANDED LIBRARY (18 Albums) ---
    const mockSongs = [
        { title: "Seet Lehar", artist: "Filmy, Riyaazi", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80" },
        { title: "End of Beginning", artist: "Djo", img: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=500&q=80" },
        { title: "Aadat", artist: "Yo Yo Honey Singh", img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80" },
        { title: "Starboy", artist: "The Weeknd", img: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80" },
        { title: "Softly", artist: "Karan Aujla", img: "https://images.unsplash.com/photo-1459749411177-0473ef71607b?w=500&q=80" },
        { title: "Espresso", artist: "Sabrina Carpenter", img: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=500&q=80" },
        { title: "Midnight City", artist: "M83", img: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80" },
        { title: "Levitating", artist: "Dua Lipa", img: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=500&q=80" },
        { title: "Blinding Lights", artist: "The Weeknd", img: "https://images.unsplash.com/photo-1621360841012-3f6e2b95b81a?w=500&q=80" },
        { title: "Heat Waves", artist: "Glass Animals", img: "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=500&q=80" },
        { title: "Stay", artist: "Kid Laroi & Bieber", img: "https://images.unsplash.com/photo-1624471929367-873528b1db77?w=500&q=80" },
        { title: "Peaches", artist: "Justin Bieber", img: "https://images.unsplash.com/photo-1520282498522-6b9872e411c5?w=500&q=80" },
        { title: "As It Was", artist: "Harry Styles", img: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&q=80" },
        { title: "Bad Habit", artist: "Steve Lacy", img: "https://images.unsplash.com/photo-1621112904891-5af48742420d?w=500&q=80" },
        { title: "Anti-Hero", artist: "Taylor Swift", img: "https://images.unsplash.com/photo-1496293455970-f8581aae0e3c?w=500&q=80" },
        { title: "Unholy", artist: "Sam Smith", img: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&q=80" },
        { title: "Rich Flex", artist: "Drake", img: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=500&q=80" },
        { title: "Kill Bill", artist: "SZA", img: "https://images.unsplash.com/photo-1619983081593-e2ba5b543e68?w=500&q=80" }
    ];

    // DOM Elements
    const grid = document.getElementById('musicGrid');
    const searchInput = document.getElementById('searchInput');
    const playBtn = document.getElementById('playBtn');
    const playIcon = document.getElementById('playIcon');
    const neonBg = document.getElementById('neonBg');
    const nowPlayingImg = document.getElementById('nowPlayingImg');
    const trackTitle = document.getElementById('trackTitle');
    const trackArtist = document.getElementById('trackArtist');
    const progressBar = document.getElementById('progressBar');
    const currentTimeEl = document.querySelector('.time.current');
    const totalTimeEl = document.querySelector('.time.total');

    let isPlaying = false;

    // --- 2. RENDER FUNCTION ---
    function renderSongs(songsToRender) {
        grid.innerHTML = ''; // Clear existing
        
        if (songsToRender.length === 0) {
            grid.innerHTML = '<p style="color: #666; font-size: 1.2rem; grid-column: 1/-1; text-align: center;">No songs found.</p>';
            return;
        }

        songsToRender.forEach(song => {
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
            card.addEventListener('click', () => loadSong(song));
            grid.appendChild(card);
        });
    }

    // Initial Load
    renderSongs(mockSongs);

    // --- 3. SEARCH FUNCTIONALITY (FIXED) ---
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        const filteredSongs = mockSongs.filter(song => 
            song.title.toLowerCase().includes(searchTerm) || 
            song.artist.toLowerCase().includes(searchTerm)
        );
        
        renderSongs(filteredSongs);
    });

    // --- 4. PLAYBACK LOGIC ---
    function loadSong(song) {
        // 1. Update Visuals
        trackTitle.textContent = song.title;
        trackArtist.textContent = song.artist;
        nowPlayingImg.style.backgroundImage = `url('${song.img}')`;
        
        // 2. Load Audio
        audioPlayer.src = DEMO_TRACK; 
        audioPlayer.load();
        
        // 3. Play
        playAudio();
    }

    function playAudio() {
        // Attempt play
        const playPromise = audioPlayer.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                isPlaying = true;
                updateUI(true);
            }).catch(error => {
                console.error("Playback prevented:", error);
            });
        }
    }

    function pauseAudio() {
        audioPlayer.pause();
        isPlaying = false;
        updateUI(false);
    }

    // Main Play/Pause Button Toggle
    playBtn.addEventListener('click', () => {
        if (!audioPlayer.src || audioPlayer.src === "") {
            loadSong(mockSongs[0]); // Auto-load first song if nothing ready
        } else {
            if (isPlaying) pauseAudio();
            else playAudio();
        }
    });

    // Update UI Elements (Neon, Spinning CD, Icon)
    function updateUI(active) {
        if (active) {
            playIcon.className = 'fa-solid fa-pause';
            neonBg.classList.add('active');
            nowPlayingImg.classList.add('spinning');
        } else {
            playIcon.className = 'fa-solid fa-play';
            neonBg.classList.remove('active');
            nowPlayingImg.classList.remove('spinning');
        }
    }

    // --- 5. PROGRESS BAR LOGIC ---
    audioPlayer.addEventListener('timeupdate', () => {
        if (audioPlayer.duration) {
            const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressBar.value = percent;
            
            currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
            totalTimeEl.textContent = formatTime(audioPlayer.duration);
        }
    });

    // Allow user to drag progress bar
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
