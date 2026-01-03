document.addEventListener('DOMContentLoaded', () => {

    const audioPlayer = new Audio();
    // Use a reliable MP3 URL. 
    // Note: If this link eventually expires, you can replace it with any direct MP3 link.
    const TEST_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

    // Mock Data with Image placeholders
    const mockSongs = [
        { title: "Seet Lehar", artist: "Filmy, Riyaazi", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80", file: TEST_AUDIO_URL },
        { title: "End of Beginning", artist: "Djo", img: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=500&q=80", file: TEST_AUDIO_URL },
        { title: "Aadat", artist: "Yo Yo Honey Singh", img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80", file: TEST_AUDIO_URL },
        { title: "Starboy", artist: "The Weeknd", img: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80", file: TEST_AUDIO_URL },
        { title: "Softly", artist: "Karan Aujla", img: "https://images.unsplash.com/photo-1459749411177-0473ef71607b?w=500&q=80", file: TEST_AUDIO_URL },
        { title: "Espresso", artist: "Sabrina Carpenter", img: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=500&q=80", file: TEST_AUDIO_URL }
    ];

    const grid = document.getElementById('musicGrid');
    const playBtn = document.getElementById('playBtn');
    const playIcon = document.getElementById('playIcon');
    
    // Elements for Visual Effects
    const neonBg = document.getElementById('neonBg');
    const nowPlayingImg = document.getElementById('nowPlayingImg'); // The CD
    const trackTitle = document.getElementById('trackTitle');
    const trackArtist = document.getElementById('trackArtist');
    const progressBar = document.getElementById('progressBar');
    const currentTimeEl = document.querySelector('.time.current');
    const totalTimeEl = document.querySelector('.time.total');

    let isPlaying = false;

    // Render Songs
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
            card.addEventListener('click', () => loadSong(song));
            grid.appendChild(card);
        });
    }
    renderSongs(mockSongs);

    // Load & Play Logic
    function loadSong(song) {
        audioPlayer.src = song.file;
        
        // Update Player Bar Info
        trackTitle.textContent = song.title;
        trackArtist.textContent = song.artist;
        nowPlayingImg.style.backgroundImage = `url('${song.img}')`;
        
        playAudio();
    }

    function playAudio() {
        audioPlayer.play().then(() => {
            isPlaying = true;
            updateUI(true);
        }).catch(err => console.error("Playback failed:", err));
    }

    function pauseAudio() {
        audioPlayer.pause();
        isPlaying = false;
        updateUI(false);
    }

    playBtn.addEventListener('click', () => {
        if (!audioPlayer.src) {
            loadSong(mockSongs[0]); // Load first song if none selected
        } else {
            if (isPlaying) pauseAudio();
            else playAudio();
        }
    });

    // Update UI (Icons, Animations)
    function updateUI(playing) {
        if (playing) {
            playIcon.className = 'fa-solid fa-pause';
            neonBg.classList.add('active');        // Turn ON Neon Blink
            nowPlayingImg.classList.add('spinning'); // Turn ON CD Spin
        } else {
            playIcon.className = 'fa-solid fa-play';
            neonBg.classList.remove('active');        // Turn OFF Neon Blink
            nowPlayingImg.classList.remove('spinning'); // Turn OFF CD Spin
        }
    }

    // Progress Bar
    audioPlayer.addEventListener('timeupdate', () => {
        if (audioPlayer.duration) {
            const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressBar.value = percent;
            currentTimeEl.innerText = formatTime(audioPlayer.currentTime);
            totalTimeEl.innerText = formatTime(audioPlayer.duration);
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
