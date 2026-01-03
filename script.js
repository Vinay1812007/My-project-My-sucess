document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CONFIGURATION ---
    // Reliable test audio that works without API keys for demo purposes
    const MP3_SOURCE = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    
    // --- 2. MULTI-LANGUAGE LIBRARY (Telugu, Hindi, English) ---
    const songLibrary = [
        // --- TELUGU HITS ---
        { title: "Pushpa Pushpa", artist: "Pushpa 2 (DSP)", img: "https://images.unsplash.com/photo-1621360841012-3f6e2b95b81a?w=500&q=80", lang: "telugu" },
        { title: "Chuttamalle", artist: "Devara (Anirudh)", img: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=500&q=80", lang: "telugu" },
        { title: "Naatu Naatu", artist: "RRR (Keeravani)", img: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=500&q=80", lang: "telugu" },
        { title: "Hukum", artist: "Jailer (Anirudh)", img: "https://images.unsplash.com/photo-1619983081563-430f63602796?w=500&q=80", lang: "telugu" },
        { title: "Kurchi Madathapetti", artist: "Guntur Kaaram", img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80", lang: "telugu" },
        { title: "Tillu Square", artist: "Ram Miriyala", img: "https://images.unsplash.com/photo-1459749411177-0473ef71607b?w=500&q=80", lang: "telugu" },
        { title: "Samajavaragamana", artist: "Ala Vaikunthapurramuloo", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80", lang: "telugu" },
        
        // --- HINDI HITS ---
        { title: "Arjan Vailly", artist: "Animal", img: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=500&q=80", lang: "hindi" },
        { title: "Pehle Bhi Main", artist: "Animal", img: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80", lang: "hindi" },
        { title: "Chaleya", artist: "Jawan", img: "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=500&q=80", lang: "hindi" },
        { title: "Kesariya", artist: "Brahmastra", img: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&q=80", lang: "hindi" },
        { title: "Apna Bana Le", artist: "Bhediya", img: "https://images.unsplash.com/photo-1496293455970-f8581aae0e3c?w=500&q=80", lang: "hindi" },
        { title: "Tum Hi Ho", artist: "Aashiqui 2", img: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&q=80", lang: "hindi" },
        { title: "Sher Khul Gaye", artist: "Fighter", img: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=500&q=80", lang: "hindi" },

        // --- ENGLISH HITS ---
        { title: "Starboy", artist: "The Weeknd", img: "https://images.unsplash.com/photo-1619983081563-430f63602796?w=500&q=80", lang: "english" },
        { title: "Espresso", artist: "Sabrina Carpenter", img: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=500&q=80", lang: "english" },
        { title: "Levitating", artist: "Dua Lipa", img: "https://images.unsplash.com/photo-1496293455970-f8581aae0e3c?w=500&q=80", lang: "english" },
        { title: "Heat Waves", artist: "Glass Animals", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80", lang: "english" },
        { title: "Blinding Lights", artist: "The Weeknd", img: "https://images.unsplash.com/photo-1621360841012-3f6e2b95b81a?w=500&q=80", lang: "english" },
        { title: "Rich Flex", artist: "Drake", img: "https://images.unsplash.com/photo-1621360841012-3f6e2b95b81a?w=500&q=80", lang: "english" },
        { title: "Bad Habit", artist: "Steve Lacy", img: "https://images.unsplash.com/photo-1459749411177-0473ef71607b?w=500&q=80", lang: "english" },
        { title: "Kill Bill", artist: "SZA", img: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&q=80", lang: "english" },
        { title: "Flowers", artist: "Miley Cyrus", img: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=500&q=80", lang: "english" }
    ];

    // --- 3. DOM ELEMENTS ---
    const grid = document.getElementById('musicGrid');
    const searchInput = document.getElementById('searchInput');
    const playBtn = document.getElementById('playBtn');
    const playIcon = document.getElementById('playIcon');
    const beatBg = document.getElementById('beatBg');
    const albumArt = document.getElementById('albumArt');
    const trackTitle = document.getElementById('trackTitle');
    const trackArtist = document.getElementById('trackArtist');
    const progressBar = document.getElementById('progressBar');
    
    // Audio Player Object
    const audio = new Audio();
    let isPlaying = false;

    // --- 4. RENDER FUNCTION ---
    function render(songs) {
        grid.innerHTML = '';
        
        if (!songs || songs.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #aaa; padding: 2rem;"><h3>No songs found.</h3></div>';
            return;
        }

        songs.forEach(song => {
            const card = document.createElement('div');
            card.className = 'song-card';
            card.innerHTML = `
                <div class="art-box" style="background-image: url('${song.img}');">
                    <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
                </div>
                <div class="song-info">
                    <h3>${song.title}</h3>
                    <p>${song.artist}</p>
                    <span class="lang-tag">${song.lang.toUpperCase()}</span>
                </div>
            `;
            // Click to Play
            card.addEventListener('click', () => loadTrack(song));
            grid.appendChild(card);
        });
    }

    // Load songs immediately
    render(songLibrary);

    // --- 5. SEARCH LOGIC ---
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtered = songLibrary.filter(song => 
            song.title.toLowerCase().includes(term) || 
            song.artist.toLowerCase().includes(term) ||
            song.lang.toLowerCase().includes(term)
        );
        render(filtered);
    });

    // --- 6. PLAYER LOGIC ---
    function loadTrack(song) {
        trackTitle.innerText = song.title;
        trackArtist.innerText = song.artist;
        albumArt.style.backgroundImage = `url('${song.img}')`;
        
        audio.src = MP3_SOURCE;
        audio.load();
        
        // Auto play on click
        togglePlay(true);
    }

    function togglePlay(forcePlay = null) {
        if (forcePlay === true) {
            audio.play().catch(e => console.error("Play error:", e));
            isPlaying = true;
        } else if (forcePlay === false) {
            audio.pause();
            isPlaying = false;
        } else {
            if (isPlaying) audio.pause();
            else audio.play().catch(e => console.error("Play error:", e));
            isPlaying = !isPlaying;
        }
        updateUI();
    }

    function updateUI() {
        if (isPlaying) {
            playIcon.className = 'fa-solid fa-pause';
            beatBg.classList.add('active'); // Turn ON background flash
            albumArt.classList.add('spinning'); // Turn ON spin
        } else {
            playIcon.className = 'fa-solid fa-play';
            beatBg.classList.remove('active');
            albumArt.classList.remove('spinning');
        }
    }

    playBtn.addEventListener('click', () => {
        if (!audio.src) loadTrack(songLibrary[0]); // Play first song if none loaded
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
