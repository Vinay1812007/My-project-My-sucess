window['__onGCastApiAvailable'] = function(isAvailable) { if (isAvailable) { cast.framework.CastContext.getInstance().setOptions({ receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID, autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED }); if(document.getElementById('castBtn')) document.getElementById('castBtn').style.display = 'inline-block'; } };
window.searchMood = function(query) { const i = document.getElementById('searchInput'); if(i){ i.value = query; i.dispatchEvent(new Event('input')); } };

// --- NEW: Fix for Language Buttons ---
window.setLanguage = function(lang) {
    // 1. Update visual buttons
    document.querySelectorAll('.lang-chip').forEach(c => c.classList.remove('active'));
    // Try to find the button that was clicked. 
    // Note: 'event' global is widely supported, but cleaner to pass 'this' in HTML. 
    // For now, we rely on the global event or just updating the class.
    if(event && event.target) {
        event.target.classList.add('active');
    }

    // 2. Set Search Query
    let query = "Top Indian Hits";
    if (lang !== 'All') {
        query = `${lang} Super Hits`; // Optimized query for iTunes
    }

    // 3. Trigger Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = query;
        searchInput.dispatchEvent(new Event('input')); // This triggers the search listener below
    }
};

document.addEventListener('DOMContentLoaded', () => {
    
    // --- THEME & CURSOR ---
    const themeBtn = document.getElementById('themeToggle'); const icon = themeBtn ? themeBtn.querySelector('i') : null;
    const applyTheme = (theme) => { if(theme==='system'){document.documentElement.removeAttribute('data-theme');localStorage.removeItem('neon_theme');if(icon)icon.className='fa-solid fa-desktop';}else{document.documentElement.setAttribute('data-theme',theme);localStorage.setItem('neon_theme',theme);if(icon)icon.className=theme==='dark'?'fa-solid fa-moon':'fa-solid fa-sun';} };
    applyTheme(localStorage.getItem('neon_theme')||'system');
    if(themeBtn) themeBtn.addEventListener('click', () => { let c = document.documentElement.getAttribute('data-theme'); applyTheme(c==='dark'?'light':(c==='light'?'system':'dark')); });
    const cursorDot = document.getElementById('cursorDot'); const cursorOutline = document.getElementById('cursorOutline');
    window.addEventListener('mousemove', (e) => { if(cursorDot){ cursorDot.style.left=`${e.clientX}px`; cursorDot.style.top=`${e.clientY}px`; cursorOutline.animate({left:`${e.clientX}px`,top:`${e.clientY}px`},{duration:500,fill:"forwards"}); } });
    document.querySelectorAll('.magnetic').forEach(btn => { btn.addEventListener('mouseenter', ()=>document.body.classList.add('hovering')); btn.addEventListener('mouseleave', ()=>document.body.classList.remove('hovering')); });

    // --- LANDING PAGE LOGIC ---
    const landingGoBtn = document.getElementById('landingGoBtn');
    if (landingGoBtn) {
        const landingInput = document.getElementById('landingUrl');
        landingGoBtn.addEventListener('click', () => { const url = landingInput.value.trim(); if(url){ window.location.href = `/videodownloader?url=${encodeURIComponent(url)}`; } else { alert("Please paste a link."); } });
        landingInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') landingGoBtn.click(); });
    }

    // --- MUSIC LOGIC ---
    const grid = document.getElementById('musicGrid');
    if (grid) {
        const searchInput = document.getElementById('searchInput');
        const audio = document.getElementById('audioPlayer'); 
        const playBtn = document.getElementById('playBtn'), playIcon = document.getElementById('playIcon'), albumArt = document.getElementById('albumArt'), loader = document.getElementById('loader'), canvas = document.getElementById('visualizerCanvas'), neonBg = document.getElementById('neonBg');
        const likeBtn = document.getElementById('likeBtn'), qrBtn = document.getElementById('qrBtn'), speedBtn = document.getElementById('speedBtn'), downloadBtn = document.getElementById('downloadBtn'), sleepBtn = document.getElementById('sleepBtn'), airplayBtn = document.getElementById('airplayBtn'), pipBtn = document.getElementById('pipBtn'), bassBtn = document.getElementById('bassBtn'), audio8dBtn = document.getElementById('audio8dBtn');
        const progressBar = document.getElementById('progressBar'), currTime = document.getElementById('currTime'), totalTime = document.getElementById('totalTime');
        const fullPlayer = document.getElementById('fullPlayer'), closeFull = document.getElementById('closeFullPlayer'), fullArt = document.getElementById('fullAlbumArt'), fullTitle = document.getElementById('fullTrackTitle'), fullArtist = document.getElementById('fullTrackArtist'), fullPlay = document.getElementById('fullPlayBtn'), fullIcon = document.getElementById('fullPlayIcon'), fullNext = document.getElementById('fullNextBtn'), fullPrev = document.getElementById('fullPrevBtn'), fullBar = document.getElementById('fullProgressBar'), fullCurr = document.getElementById('fullCurrTime'), fullTot = document.getElementById('fullTotalTime');
        const qrPanel = document.getElementById('qrPanel'), closeQr = document.getElementById('closeQr'), qrContainer = document.getElementById('qrCodeContainer');
        const voiceBtn = document.getElementById('voiceBtn');

        let currentSong = null, songQueue = [], currentIndex = 0, audioContext, analyser, source, bassFilter, pannerNode, isBassBoosted = false, is8dActive = false, pannerInterval, sleepTimer = null, speeds = [1.0, 1.25, 1.5, 0.8], speedIndex = 0;

        const urlParams = new URLSearchParams(window.location.search);
        if(urlParams.get('song')) { document.getElementById('searchInput').value = urlParams.get('song'); searchSongs(urlParams.get('song'), true, parseFloat(urlParams.get('t'))); window.history.replaceState({}, document.title, window.location.pathname); } else searchSongs('Top Indian Hits');

        let debounceTimer;
        document.getElementById('searchInput').addEventListener('input', (e) => { 
            clearTimeout(debounceTimer); 
            debounceTimer = setTimeout(() => { 
                if(e.target.value) searchSongs(e.target.value); 
            }, 800); 
        });

        async function searchSongs(query, autoPlay=false, startTime=0) {
            grid.innerHTML = ''; grid.appendChild(loader); loader.classList.remove('hidden');
            try { 
                // Using iTunes Search API
                const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=30`); 
                const data = await res.json(); 
                loader.classList.add('hidden');
                
                if(data.results.length) { 
                    songQueue = data.results; 
                    if(autoPlay) playTrack(data.results[0], data.results[0].artworkUrl100.replace('100x100','400x400'), startTime);
                    
                    data.results.forEach((song, idx) => { 
                        if(!song.previewUrl) return; 
                        const card = document.createElement('div'); 
                        card.className = 'song-card magnetic'; 
                        const img = song.artworkUrl100.replace('100x100', '400x400'); 
                        card.innerHTML = `<div class="art-box" style="background-image:url('${img}')"><div class="play-overlay"><i class="fa-solid fa-play"></i></div></div><div class="song-info"><h3>${song.trackName}</h3><p>${song.artistName}</p></div>`; 
                        card.addEventListener('click', () => { currentIndex = idx; playTrack(song, img); }); 
                        card.addEventListener('mouseenter', () => document.body.classList.add('hovering')); 
                        card.addEventListener('mouseleave', () => document.body.classList.remove('hovering')); 
                        grid.appendChild(card); 
                    });
                } else { 
                    grid.innerHTML = '<h3>No songs found.</h3>'; 
                } 
            } catch(e) { 
                console.error(e); 
                loader.classList.add('hidden');
                grid.innerHTML = '<h3>Error loading songs.</h3>';
            }
        }

        function playTrack(song, img, startTime=0) {
            currentSong = song; initAudio(); checkLikeStatus(song); saveHistory(song);
            document.getElementById('trackTitle').innerText = song.trackName; document.getElementById('trackArtist').innerText = song.artistName; albumArt.style.backgroundImage = `url('${img}')`;
            fullTitle.innerText = song.trackName; fullArtist.innerText = song.artistName; fullArt.style.backgroundImage = `url('${img}')`;
            const h = Math.abs((song.trackName.length * 37) % 360); document.documentElement.style.setProperty('--neon-main', `hsl(${h}, 100%, 50%)`); neonBg.classList.add('active');
            if('mediaSession' in navigator) { navigator.mediaSession.metadata = new MediaMetadata({ title: song.trackName, artist: song.artistName, artwork: [{ src: img, sizes: '512x512', type: 'image/jpeg' }] }); navigator.mediaSession.setActionHandler('play', togglePlay); navigator.mediaSession.setActionHandler('pause', togglePlay); navigator.mediaSession.setActionHandler('previoustrack', playPrev); navigator.mediaSession.setActionHandler('nexttrack', playNext); }
            audio.src = song.previewUrl;
            if(startTime>0) { audio.currentTime = startTime; } 
            audio.playbackRate = speeds[speedIndex];
            audio.play().then(() => { if(audioContext?.state === 'suspended') audioContext.resume(); playIcon.className = 'fa-solid fa-pause'; fullIcon.className = 'fa-solid fa-pause'; albumArt.classList.add('spinning'); }).catch(console.error);
        }

        function togglePlay() { if(audio.src) { if(audio.paused) { audio.play(); playIcon.className='fa-solid fa-pause'; fullIcon.className='fa-solid fa-pause'; albumArt.classList.add('spinning'); neonBg.classList.add('active'); } else { audio.pause(); playIcon.className='fa-solid fa-play'; fullIcon.className='fa-solid fa-play'; albumArt.classList.remove('spinning'); neonBg.classList.remove('active'); } } }
        playBtn.addEventListener('click', togglePlay); fullPlay.addEventListener('click', togglePlay);

        function initAudio() { if (audioContext) return; audioContext = new (window.AudioContext || window.webkitAudioContext)(); analyser = audioContext.createAnalyser(); source = audioContext.createMediaElementSource(audio); bassFilter = audioContext.createBiquadFilter(); bassFilter.type = "lowshelf"; bassFilter.frequency.value = 200; pannerNode = audioContext.createStereoPanner(); source.connect(bassFilter); bassFilter.connect(pannerNode); pannerNode.connect(analyser); analyser.connect(audioContext.destination); initVisualizer(); }
        bassBtn.addEventListener('click', () => { if(!audioContext) initAudio(); isBassBoosted = !isBassBoosted; bassFilter.gain.value = isBassBoosted ? 15 : 0; bassBtn.classList.toggle('active'); });
        audio8dBtn.addEventListener('click', () => { if(!audioContext) initAudio(); is8dActive = !is8dActive; audio8dBtn.classList.toggle('active'); if(is8dActive) { let angle=0; pannerInterval = setInterval(() => { angle+=0.05; pannerNode.pan.value = Math.sin(angle); }, 50); } else { clearInterval(pannerInterval); pannerNode.pan.value = 0; } });
        speedBtn.addEventListener('click', () => { speedIndex = (speedIndex + 1) % speeds.length; audio.playbackRate = speeds[speedIndex]; speedBtn.innerText = speeds[speedIndex] + "x"; });
        sleepBtn.addEventListener('click', () => { if(sleepTimer) { clearTimeout(sleepTimer); sleepTimer=null; sleepBtn.classList.remove('active'); alert("Timer cancelled"); } else { sleepBtn.classList.add('active'); alert("Stops in 30 mins"); sleepTimer=setTimeout(()=>{audio.pause(); playIcon.className='fa-solid fa-play';}, 30*60000); } });

        function playNext() { if (currentIndex < songQueue.length - 1) { currentIndex++; let s = songQueue[currentIndex]; playTrack(s, s.artworkUrl100.replace('100x100', '400x400')); } }
        function playPrev() { if (currentIndex > 0) { currentIndex--; let s = songQueue[currentIndex]; playTrack(s, s.artworkUrl100.replace('100x100', '400x400')); } }
        audio.addEventListener('ended', playNext);
        document.getElementById('nextBtn').addEventListener('click', playNext); fullNext.addEventListener('click', playNext);
        document.getElementById('prevBtn').addEventListener('click', playPrev); fullPrev.addEventListener('click', playPrev);

        downloadBtn.addEventListener('click', () => { if(!currentSong) return alert("Play a song!"); downloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; fetch(currentSong.previewUrl).then(r=>r.blob()).then(blob=>{ const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.style.display='none'; a.href=url; a.download=currentSong.trackName+".m4a"; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); downloadBtn.innerHTML = '<i class="fa-solid fa-check"></i>'; setTimeout(()=>downloadBtn.innerHTML='<i class="fa-solid fa-download"></i>', 2000); }).catch(()=>{ window.open(currentSong.previewUrl,'_blank'); downloadBtn.innerHTML='<i class="fa-solid fa-download"></i>'; }); });

        audio.addEventListener('timeupdate', () => { if(audio.duration) { const pct = (audio.currentTime/audio.duration)*100; progressBar.value = pct; fullBar.value = pct; let t = formatTime(audio.currentTime); let d = formatTime(audio.duration); currTime.innerText = t; totalTime.innerText = d; fullCurr.innerText = t; fullTot.innerText = d; } });
        progressBar.addEventListener('input', (e) => { audio.currentTime = (audio.duration / 100) * e.target.value; });
        fullBar.addEventListener('input', (e) => { audio.currentTime = (audio.duration / 100) * e.target.value; });
        function formatTime(s) { let m = Math.floor(s/60); let sec = Math.floor(s%60); return `${m}:${sec<10?'0':''}${sec}`; }

        if (window.WebKitPlaybackTargetAvailabilityEvent) { audio.addEventListener('webkitplaybacktargetavailabilitychanged', (e) => { if (e.availability === 'available') airplayBtn.classList.remove('hidden'); }); airplayBtn.addEventListener('click', () => audio.webkitShowPlaybackTargetPicker()); }
        pipBtn.addEventListener('click', async () => { if (document.pictureInPictureElement) await document.exitPictureInPicture(); else if (document.pictureInPictureEnabled) await audio.requestPictureInPicture(); });

        function checkLikeStatus(song) { let f=JSON.parse(localStorage.getItem('neon_favorites'))||[]; const is=f.some(s=>s.trackName===song.trackName); likeBtn.innerHTML=is?'<i class="fa-solid fa-heart"></i>':'<i class="fa-regular fa-heart"></i>'; if(is) likeBtn.classList.add('active'); else likeBtn.classList.remove('active'); }
        likeBtn.addEventListener('click', () => { if(!currentSong) return; let f=JSON.parse(localStorage.getItem('neon_favorites'))||[]; const idx=f.findIndex(s=>s.trackName===currentSong.trackName); if(idx===-1) f.push(currentSong); else f.splice(idx,1); localStorage.setItem('neon_favorites',JSON.stringify(f)); checkLikeStatus(currentSong); renderLibrary('favorites'); });
        qrBtn.addEventListener('click', () => { if(!currentSong) return; qrPanel.classList.remove('hidden'); qrContainer.innerHTML=""; new QRCode(qrContainer, { text: `${window.location.origin}${window.location.pathname}?song=${encodeURIComponent(currentSong.trackName+" "+currentSong.artistName)}&t=${audio.currentTime}`, width:200, height:200 }); });
        closeQr.addEventListener('click', () => qrPanel.classList.add('hidden'));
        albumArt.addEventListener('click', () => fullPlayer.classList.remove('hidden')); closeFull.addEventListener('click', () => fullPlayer.classList.add('hidden'));
        
        function saveHistory(song) { let h=JSON.parse(localStorage.getItem('neon_history'))||[]; h=h.filter(s=>s.trackName!==song.trackName); h.unshift(song); if(h.length>15) h.pop(); localStorage.setItem('neon_history',JSON.stringify(h)); }
        const openLibraryBtn=document.getElementById('openLibraryBtn'); const libraryPanel=document.getElementById('libraryPanel'); const libraryList=document.getElementById('libraryList');
        openLibraryBtn.addEventListener('click',()=>{libraryPanel.classList.remove('hidden');switchLib('favorites');}); document.getElementById('closeLibrary').addEventListener('click',()=>libraryPanel.classList.add('hidden'));
        window.switchLib=function(type){document.querySelectorAll('.lib-tab').forEach(t=>t.classList.remove('active'));event.target.classList.add('active');renderLibrary(type);}
        function renderLibrary(type){ const key=type==='favorites'?'neon_favorites':'neon_history'; const list=JSON.parse(localStorage.getItem(key))||[]; libraryList.innerHTML=''; if(list.length===0){libraryList.innerHTML=`<p style="text-align:center;color:#666">No songs.</p>`;return;} list.forEach(s=>{ const i=s.artworkUrl100.replace('100x100','150x150'); const d=document.createElement('div'); d.className='lib-item'; d.innerHTML=`<img src="${i}"><div><h4>${s.trackName}</h4><p>${s.artistName}</p></div>`; d.addEventListener('click',()=>{playTrack(s,i.replace('150x150','400x400'));libraryPanel.classList.add('hidden');}); libraryList.appendChild(d); }); }

        function initVisualizer() { analyser.fftSize = 256; const bufferLength = analyser.frequencyBinCount; const dataArray = new Uint8Array(bufferLength); const ctx = canvas.getContext('2d'); function animate() { requestAnimationFrame(animate); canvas.width = window.innerWidth; canvas.height = window.innerHeight; analyser.getByteFrequencyData(dataArray); ctx.clearRect(0, 0, canvas.width, canvas.height); const barWidth = (canvas.width / bufferLength) * 2.5; let x = 0; for(let i = 0; i < bufferLength; i++) { const barHeight = dataArray[i] * 1.5; ctx.fillStyle = `rgba(${barHeight + 50}, 250, 50, 0.2)`; ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight); x += barWidth + 1; } } animate(); }
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) { const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; const recognition = new SpeechRecognition(); recognition.continuous=false; recognition.lang='en-US'; voiceBtn.addEventListener('click', () => { recognition.start(); voiceBtn.classList.add('listening'); }); recognition.onresult = (e) => { voiceBtn.classList.remove('listening'); const q = e.results[0][0].transcript; searchInput.value=q; searchSongs(q); }; } else { voiceBtn.style.display='none'; }
        const lyricsBtn = document.getElementById('lyricsBtn'); const lyricsPanel = document.getElementById('lyricsPanel'); const lyricsText = document.getElementById('lyricsText'); const closeLyrics = document.getElementById('closeLyrics'); const fullLyricsBtn = document.getElementById('fullLyricsBtn');
        lyricsBtn.addEventListener('click', () => { if(!currentSong) return alert("Play a song first!"); lyricsPanel.classList.remove('hidden'); lyricsText.innerHTML = `<p style="color:var(--neon-main)">Searching Database...</p>`; setTimeout(() => lyricsText.innerHTML = `<h3>${currentSong.trackName}</h3><p>Lyrics found.</p>`, 800); fullLyricsBtn.onclick = () => window.open(`https://www.google.com/search?q=${encodeURIComponent(currentSong.trackName + " lyrics")}`, '_blank'); });
        closeLyrics.addEventListener('click', () => lyricsPanel.classList.add('hidden'));
    }

    // --- VIDEO DL LOGIC ---
    const fetchBtn = document.getElementById('fetchVideoBtn');
    if (fetchBtn) {
        const dlResult = document.getElementById('dlResult'), thumbPreview = document.getElementById('thumbPreview'), videoInput = document.getElementById('videoUrl'), pasteBtn = document.getElementById('pasteBtn'), dlHistoryList = document.getElementById('dlHistoryList'), dlHistoryPanel = document.getElementById('dlHistoryPanel'), clearHistoryBtn = document.getElementById('clearHistoryBtn'), vidPlatform = document.getElementById('vidPlatform'), vidTitle = document.getElementById('vidTitle'), finalDownloadBtn = document.getElementById('finalDownloadBtn'), formatChips = document.querySelectorAll('.format-chip');
        let selectedFormat = 'mp4'; 
        
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('url')) {
            videoInput.value = decodeURIComponent(urlParams.get('url'));
            setTimeout(() => fetchBtn.click(), 500);
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        renderHistory();
        pasteBtn.addEventListener('click', async () => { try { const text = await navigator.clipboard.readText(); videoInput.value = text; fetchBtn.click(); } catch (err) { alert("Please paste manually."); } });
        fetchBtn.addEventListener('click', () => { const url = videoInput.value.trim(); if(!url) return alert("Paste a link first!"); fetchBtn.innerText = "Scanning..."; dlResult.classList.add('hidden'); setTimeout(() => { fetchBtn.innerText = "Fetch"; dlResult.classList.remove('hidden'); let platform = "Unknown", iconClass = "fa-solid fa-link", thumb = "https://cdn-icons-png.flaticon.com/512/5663/5663364.png"; if (url.includes('youtube.com') || url.includes('youtu.be')) { platform = "YouTube"; iconClass = "fa-brands fa-youtube"; const id = url.match(/(?:v=|youtu\.be\/)([^&]+)/)?.[1]; if(id) thumb = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`; } else if (url.includes('instagram.com')) { platform = "Instagram"; iconClass = "fa-brands fa-instagram"; thumb = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/2048px-Instagram_logo_2016.svg.png"; } else if (url.includes('tiktok.com')) { platform = "TikTok"; iconClass = "fa-brands fa-tiktok"; thumb = "https://sf-tb-sg.ibytedtos.com/obj/eden-sg/uhtyvueh7nulogpoguhm/tiktok-icon2.png"; } else if (url.includes('twitter.com') || url.includes('x.com')) { platform = "Twitter / X"; iconClass = "fa-brands fa-twitter"; thumb = "https://upload.wikimedia.org/wikipedia/commons/5/5a/X_icon_2.svg"; } else if (url.includes('terabox')) { platform = "Terabox"; iconClass = "fa-solid fa-box"; thumb = "https://play-lh.googleusercontent.com/yKq5Xn6XN6jH6J7j9j5j5j5j5j5j5j5j5j5j5j5j5j5j5j5j5j5j5j5j5j5j5j5j"; } thumbPreview.src = thumb; vidPlatform.innerText = platform; vidTitle.innerText = platform + " Video Detected"; saveToHistory(url, platform, iconClass); }, 800); });
        formatChips.forEach(chip => { chip.addEventListener('click', () => { formatChips.forEach(c => c.classList.remove('active')); chip.classList.add('active'); selectedFormat = chip.dataset.quality; }); });
        finalDownloadBtn.addEventListener('click', () => { const url = videoInput.value.trim(); if(url.includes('youtube') || url.includes('youtu.be')) window.open(`https://ssyoutube.com/en/download?url=${url}`, '_blank'); else if(url.includes('instagram')) window.open(`https://savefrom.net/${url}`, '_blank'); else if(url.includes('tiktok')) window.open(`https://snaptik.app/`, '_blank'); else window.open(`https://savefrom.net/${url}`, '_blank'); });
        function saveToHistory(url, platform, icon) { let history = JSON.parse(localStorage.getItem('neon_dl_history')) || []; history = history.filter(h => h.url !== url); history.unshift({ url, platform, icon, date: new Date().toLocaleTimeString() }); if (history.length > 5) history.pop(); localStorage.setItem('neon_dl_history', JSON.stringify(history)); renderHistory(); }
        function renderHistory() { let history = JSON.parse(localStorage.getItem('neon_dl_history')) || []; if (history.length > 0) { dlHistoryPanel.classList.remove('hidden'); dlHistoryList.innerHTML = ''; history.forEach(item => { const div = document.createElement('div'); div.className = 'history-item'; div.innerHTML = `<div class="history-icon"><i class="${item.icon}"></i></div><div class="history-info"><div class="history-link">${item.url}</div><div class="history-date">${item.platform} • ${item.date}</div></div>`; div.addEventListener('click', () => { videoInput.value = item.url; fetchBtn.click(); }); dlHistoryList.appendChild(div); }); } else { dlHistoryPanel.classList.add('hidden'); } }
        clearHistoryBtn.addEventListener('click', () => { localStorage.removeItem('neon_dl_history'); renderHistory(); });
    }
});
