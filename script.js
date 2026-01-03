document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CONFIGURATION ---
    // Reliable test audio source
    const MP3_SOURCE = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    
    // Song Data
    const songLibrary = [
        { title: "Starboy", artist: "The Weeknd", img: "https://images.unsplash.com/photo-1619983081563-430f63602796?w=500&q=80" },
        { title: "Espresso", artist: "Sabrina Carpenter", img: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=500&q=80" },
        { title: "Midnight City", artist: "M83", img: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=500&q=80" },
        { title: "Levitating", artist: "Dua Lipa", img: "https://images.unsplash.com/photo-1496293455970-f8581aae0e3c?w=500&q=80" },
        { title: "Heat Waves", artist: "Glass Animals", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80" },
        { title: "As It Was", artist: "Harry Styles", img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80" },
        { title: "Rich Flex", artist: "Drake", img: "https://images.unsplash.com/photo-1621360841012-3f6e2b95b81a?w=500&q=80" },
        { title: "Bad Habit", artist: "Steve Lacy", img: "https://images.unsplash.com/photo-1459749411177-0473ef71607b?w=500&q=80" },
        { title: "Kill Bill", artist: "SZA", img: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&q=80" },
        { title: "Flowers", artist: "Miley Cyrus", img: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=500&q=80" }
    ];

    // --- 2. ELEMENTS ---
    const grid = document.getElementById('musicGrid');
    const searchInput = document.getElementById('searchInput');
    const playBtn = document.getElementById('playBtn');
    const playIcon = document.getElementById('playIcon');
    const beatBg = document.getElementById('beatBg');
    const albumArt = document.getElementById('albumArt');
    const trackTitle = document.getElementById('trackTitle');
    const trackArtist = document.getElementById('trackArtist');
    const progressBar = document.getElementById('progressBar');
    
    // Audio Player
    const audio = new Audio();
    let isPlaying = false;

    // --- 3. RENDER FUNCTION (Fix for Empty Grid) ---
    function render(songs) {
        grid.innerHTML = '';
        
        if (!songs || songs.length === 0) {
            grid.innerHTML = '<h3 style="color:white; grid-column:1/-1; text-align:center;">No songs found.</h3>';
            return;
        }

        songs.forEach(song => {
            const card = document.createElement('div');
            card.className = 'song-card';
            card.innerHTML = `
                <div class="art-box" style="background-image: url('${song.img}');"></div>
                <div class="song-info">
                    <h3>${song.title}</h3>
                    <p>${song.artist}</p>
                </div>
            `;
            card.addEventListener('click', () => loadTrack(song));
            grid.appendChild(card);
        });
    }

    // Call render immediately to show songs
    render(songLibrary);

    // --- 4. SEARCH FUNCTION (Fix for Search) ---
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtered = songLibrary.filter(song => 
            song.title.toLowerCase().includes(term) || 
            song.artist.toLowerCase().includes(term)
        );
        render(filtered);
    });

    // --- 5. PLAYER LOGIC ---
    function loadTrack(song) {
        trackTitle.innerText = song.title;
        trackArtist.innerText = song.artist;
        albumArt.style.backgroundImage = `url('${song.img}')`;
        
        audio.src = MP3_SOURCE;
        audio.load();
        togglePlay(true);
    }

    function togglePlay(forcePlay = null) {
        if (forcePlay === true) {
            audio.play().catch(e => console.error("Play Error:", e));
            isPlaying = true;
        } else if (forcePlay === false) {
            audio.pause();
            isPlaying = false;
        } else {
            if (isPlaying) audio.pause();
            else audio.play().catch(e => console.error("Play Error:", e));
            isPlaying = !isPlaying;
        }
        updateUI();
    }

    function updateUI() {
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

    playBtn.addEventListener('click', () => {
        if (!audio.src) loadTrack(songLibrary[0]);
        else togglePlay();
    });

    // Progress Bar
    audio.addEventListener('timeupdate', () => {
        if(audio.duration) {
            const pct = (audio.currentTime / audio.duration) * 100;
            progressBar.value = pct;
        }
    });

    progressBar.addEventListener('input', (e) => {
        if(audio.duration) {
            const time = (audio.duration / 100) * e.target.value;
            audio.currentTime = time;
        }
    });
});
