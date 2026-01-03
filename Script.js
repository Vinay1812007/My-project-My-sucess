document.addEventListener('DOMContentLoaded', () => {

    // --- 1. MOCK DATA (Simulating Spotify/Saavn API) ---
    // Since real APIs require OAuth tokens, we use this structure.
    // To use real APIs, you would replace this array with a fetch() call.
    const mockSongs = [
        { title: "Seet Lehar", artist: "Filmy, Riyaazi", img: "https://c.saavncdn.com/973/Seet-Lehar-Hindi-2024-20241219150821-500x500.jpg" },
        { title: "End of Beginning", artist: "Djo", img: "https://i.scdn.co/image/ab67616d0000b273b4d4b1c3b1e7c7e6c5d4b4e1" },
        { title: "Aadat (feat. AP)", artist: "Yo Yo Honey Singh", img: "https://c.saavncdn.com/263/Glory-Hindi-2024-20240826105740-500x500.jpg" },
        { title: "Starboy", artist: "The Weeknd", img: "https://i.scdn.co/image/ab67616d0000b2734718e28d24527d9c9dbb050d" },
        { title: "Softly", artist: "Karan Aujla", img: "https://i1.sndcdn.com/artworks-y6q31j1j1j1j-0-t500x500.jpg" },
        { title: "Espresso", artist: "Sabrina Carpenter", img: "https://i.scdn.co/image/ab67616d0000b273659293a9d91834164d142078" }
    ];

    const grid = document.getElementById('musicGrid');

    // --- 2. RENDER FUNCTION ---
    function renderSongs(songs) {
        grid.innerHTML = '';
        songs.forEach(song => {
            const card = document.createElement('div');
            card.className = 'song-card';
            card.innerHTML = `
                <div class="album-art" style="background-image: url('${song.img}')"></div>
                <div class="song-info">
                    <h3>${song.title}</h3>
                    <p>${song.artist}</p>
                </div>
            `;
            // Add click event to play song
            card.addEventListener('click', () => playMusic(song));
            grid.appendChild(card);
        });
    }

    // Initial Load
    renderSongs(mockSongs);

    // --- 3. SEARCH FUNCTIONALITY (Mock) ---
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = mockSongs.filter(s => 
            s.title.toLowerCase().includes(query) || 
            s.artist.toLowerCase().includes(query)
        );
        renderSongs(filtered);
    });

    // --- 4. PLAYER & NEON BACKGROUND LOGIC ---
    const playBtn = document.getElementById('playBtn');
    const playIcon = document.getElementById('playIcon');
    const neonBg = document.getElementById('neonBg');
    const progressBar = document.getElementById('progressBar');
    let isPlaying = false;
    let progressInterval;

    function playMusic(song) {
        // In a real app, this would play audio.
        console.log(`Now playing: ${song.title}`);
        isPlaying = true;
        updateUI();
    }

    playBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        updateUI();
    });

    function updateUI() {
        if (isPlaying) {
            playIcon.className = 'fa-solid fa-pause';
            neonBg.classList.add('active'); // Turn ON Neon
            startProgress();
        } else {
            playIcon.className = 'fa-solid fa-play';
            neonBg.classList.remove('active'); // Turn OFF Neon
            stopProgress();
        }
    }

    function startProgress() {
        stopProgress(); // clear existing
        progressInterval = setInterval(() => {
            let val = parseInt(progressBar.value);
            if (val >= 100) val = 0;
            progressBar.value = val + 1;
        }, 1000);
    }

    function stopProgress() {
        clearInterval(progressInterval);
    }
});
