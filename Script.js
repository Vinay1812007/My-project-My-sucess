document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SETUP AUDIO PLAYER ---
    const audioPlayer = new Audio();
    // Sample copyright-free track for testing
    const SAMPLE_MP3 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

    // --- 2. MOCK DATA (With Reliable Images) ---
    // Note: Real Spotify/Saavn images require an API Key to avoid blocking.
    // I have used high-quality placeholders here. 
    const mockSongs = [
        { 
            title: "Seet Lehar", 
            artist: "Filmy, Riyaazi", 
            img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80",
            file: SAMPLE_MP3 
        },
        { 
            title: "End of Beginning", 
            artist: "Djo", 
            img: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=500&q=80",
            file: SAMPLE_MP3
        },
        { 
            title: "Aadat (feat. AP)", 
            artist: "Yo Yo Honey Singh", 
            img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80",
            file: SAMPLE_MP3
        },
        { 
            title: "Starboy", 
            artist: "The Weeknd", 
            img: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80",
            file: SAMPLE_MP3
        },
        { 
            title: "Softly", 
            artist: "Karan Aujla", 
            img: "https://images.unsplash.com/photo-1459749411177-0473ef71607b?w=500&q=80",
            file: SAMPLE_MP3
        },
        { 
            title: "Espresso", 
            artist: "Sabrina Carpenter", 
            img: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=500&q=80",
            file: SAMPLE_MP3
        }
    ];

    const grid = document.getElementById('musicGrid');
    const playBtn = document.getElementById('playBtn');
    const playIcon = document.getElementById('playIcon');
    const neonBg = document.getElementById('neonBg');
    const progressBar = document.getElementById('progressBar');
    const currentTimeEl = document.querySelector('.time.current');
    const totalTimeEl = document.querySelector('.time.total');
    
    let isPlaying = false;

    // --- 3. RENDER SONGS ---
    function renderSongs(songs) {
        grid.innerHTML = '';
        songs.forEach((song, index) => {
            const card = document.createElement('div');
            card.className = 'song-card';
            // Store index to identify song
            card.dataset.index = index;
            card.innerHTML = `
                <div class="album-art" style="background-image: url('${song.img}')"></div>
                <div class="song-info">
                    <h3>${song.title}</h3>
                    <p>${song.artist}</p>
                </div>
            `;
            // Click card to play specific song
            card.addEventListener('click', () => loadAndPlaySong(song));
            grid.appendChild(card);
        });
    }

    renderSongs(mockSongs);

    // --- 4. PLAYER LOGIC ---
    
    function loadAndPlaySong(song) {
        // Stop current if playing
        if (isPlaying) {
            audioPlayer.pause();
        }

        // Set source
        audioPlayer.src = song.file;
        console.log(`Loading: ${song.title}`);
        
        // Play
        audioPlayer.play();
        isPlaying = true;
        updatePlayButtonUI();
        neonBg.classList.add('active'); // Turn ON Neon Theme
    }

    // Toggle Play/Pause on main button
    playBtn.addEventListener('click', () => {
        if (!audioPlayer.src) {
            // If no song loaded, load the first one
            loadAndPlaySong(mockSongs[0]);
        } else {
            if (isPlaying) {
                audioPlayer.pause();
                isPlaying = false;
                neonBg.classList.remove('active');
            } else {
                audioPlayer.play();
                isPlaying = true;
                neonBg.classList.add('active');
            }
            updatePlayButtonUI();
        }
    });

    function updatePlayButtonUI() {
        if (isPlaying) {
            playIcon.className = 'fa-solid fa-pause';
        } else {
            playIcon.className = 'fa-solid fa-play';
        }
    }

    // --- 5. PROGRESS BAR ---
    
    // Update progress bar as song plays
    audioPlayer.addEventListener('timeupdate', () => {
        const { currentTime, duration } = audioPlayer;
        if (isNaN(duration)) return;

        const progressPercent = (currentTime / duration) * 100;
        progressBar.value = progressPercent;

        // Update Time Text
        currentTimeEl.textContent = formatTime(currentTime);
        totalTimeEl.textContent = formatTime(duration);
    });

    // Seek functionality
    progressBar.addEventListener('input', () => {
        const duration = audioPlayer.duration;
        const seekTime = (progressBar.value / 100) * duration;
        audioPlayer.currentTime = seekTime;
    });

    // Helper: Format seconds to MM:SS
    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    // Search Feature
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = mockSongs.filter(s => 
            s.title.toLowerCase().includes(query) || 
            s.artist.toLowerCase().includes(query)
        );
        renderSongs(filtered);
    });
});
