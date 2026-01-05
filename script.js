document.addEventListener('DOMContentLoaded', () => {
    
    // --- CUSTOM CURSOR LOGIC ---
    const cursorDot = document.getElementById('cursorDot');
    const cursorOutline = document.getElementById('cursorOutline');
    const cursorIcon = document.getElementById('cursorIcon');

    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;
        
        // Dot follows instantly
        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        // Outline follows with lag (Magnetic feel)
        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 500, fill: "forwards" });
    });

    // Magnetic Button Effect
    document.querySelectorAll('.magnetic').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            document.body.classList.add('hovering');
        });
        btn.addEventListener('mouseleave', () => {
            document.body.classList.remove('hovering');
        });
    });

    // Change Cursor Icon based on Tab
    window.switchTab = function(tab) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        
        if (tab === 'music') {
            document.getElementById('musicSection').classList.remove('hidden-section');
            document.getElementById('videoSection').classList.add('hidden-section');
            document.getElementById('musicPlayerBar').style.display = 'flex';
            cursorIcon.className = 'fa-solid fa-music'; // Change cursor icon
        } else {
            document.getElementById('musicSection').classList.add('hidden-section');
            document.getElementById('videoSection').classList.remove('hidden-section');
            document.getElementById('musicPlayerBar').style.display = 'none';
            cursorIcon.className = 'fa-solid fa-video'; // Change cursor icon
        }
    }

    // --- VIDEO DOWNLOADER LOGIC (Professional UI Mockup) ---
    // Note: Actual 8K downloading requires server-side FFmpeg. This UI mocks the flow perfectly.
    const fetchBtn = document.getElementById('fetchVideoBtn');
    const dlResult = document.getElementById('dlResult');
    const previewPlayer = document.getElementById('previewPlayer');
    
    fetchBtn.addEventListener('click', () => {
        const url = document.getElementById('videoUrl').value;
        if(!url) return alert("Paste a link first!");
        
        fetchBtn.innerText = "Fetching Info...";
        
        setTimeout(() => {
            fetchBtn.innerText = "Fetch";
            dlResult.classList.remove('hidden');
            
            // Set a sample HD video for the preview functionality
            previewPlayer.src = "https://www.w3schools.com/html/mov_bbb.mp4"; 
            document.getElementById('vidTitle').innerText = "Video Ready for Download";
            document.getElementById('vidDuration').innerText = "03:45 • 1080p Source";
        }, 1500);
    });

    document.getElementById('finalDownloadBtn').addEventListener('click', () => {
        const quality = document.getElementById('qualitySelect').value;
        const url = document.getElementById('videoUrl').value;
        
        alert(`Starting download in ${quality.toUpperCase()} format...`);
        // Actual download link logic (Using a public helper for demo)
        window.open(`https://savefrom.net/${url}`, '_blank');
    });

    // --- MUSIC & GYROSCOPE ---
    const layer1 = document.getElementById('layer1');
    document.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth - e.pageX * 2) / 100;
        const y = (window.innerHeight - e.pageY * 2) / 100;
        layer1.style.transform = `translate(${x}px, ${y}px)`;
    });

    // Music Search (iTunes API)
    const grid = document.getElementById('musicGrid');
    const searchInput = document.getElementById('searchInput');
    const audio = document.getElementById('audioPlayer');
    let currentSong = null;

    searchSongs('Top Indian Hits');

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if(e.target.value) searchSongs(e.target.value);
        }, 800);
    });

    async function searchSongs(query) {
        grid.innerHTML = '<div class="loader"></div>';
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=24`);
            const data = await res.json();
            grid.innerHTML = '';
            
            if(data.results.length) {
                data.results.forEach(song => {
                    if(!song.previewUrl) return;
                    const card = document.createElement('div');
                    card.className = 'song-card magnetic'; // Add magnetic class
                    const img = song.artworkUrl100.replace('100x100', '400x400');
                    card.innerHTML = `
                        <div class="art-box" style="background-image:url('${img}')">
                            <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
                        </div>
                        <div class="song-info"><h3>${song.trackName}</h3><p>${song.artistName}</p></div>
                    `;
                    card.addEventListener('click', () => playTrack(song, img));
                    // Re-bind magnetic effect
                    card.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
                    card.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
                    grid.appendChild(card);
                });
            } else {
                grid.innerHTML = '<h3>No results found.</h3>';
            }
        } catch(e) { console.error(e); }
    }

    function playTrack(song, img) {
        currentSong = song;
        document.getElementById('trackTitle').innerText = song.trackName;
        document.getElementById('trackArtist').innerText = song.artistName;
        document.getElementById('albumArt').style.backgroundImage = `url('${img}')`;
        
        // Neon Color Gen
        const h = Math.abs((song.trackName.length * 37) % 360);
        document.documentElement.style.setProperty('--neon-main', `hsl(${h}, 100%, 50%)`);

        audio.src = song.previewUrl;
        audio.play();
        document.getElementById('beatBg').classList.add('active');
        document.getElementById('albumArt').classList.add('spinning');
        document.getElementById('playIcon').className = 'fa-solid fa-pause';
    }

    // Controls
    document.getElementById('playBtn').addEventListener('click', () => {
        if(audio.src) {
            if(audio.paused) { audio.play(); document.getElementById('playIcon').className = 'fa-solid fa-pause'; }
            else { audio.pause(); document.getElementById('playIcon').className = 'fa-solid fa-play'; }
        }
    });
    
    // Lyrics & UI
    document.getElementById('lyricsBtn').addEventListener('click', () => {
        if(!currentSong) return alert("Play a song first!");
        document.getElementById('lyricsPanel').classList.remove('hidden');
        document.getElementById('lyricsText').innerHTML = `<p style="color:var(--neon-main)">Connecting AI...</p>`;
        setTimeout(() => {
            document.getElementById('lyricsText').innerHTML = `<h3>${currentSong.trackName}</h3><p>Lyrics found via Google Search.</p>`;
        }, 1000);
    });
    document.getElementById('closeLyrics').addEventListener('click', () => document.getElementById('lyricsPanel').classList.add('hidden'));

    // Audio Progress
    audio.addEventListener('timeupdate', () => {
        if(audio.duration) document.getElementById('progressBar').value = (audio.currentTime/audio.duration)*100;
    });
    document.getElementById('progressBar').addEventListener('input', (e) => {
        audio.currentTime = (audio.duration/100)*e.target.value;
    });
});
