// --- STATE & CONFIG ---
const state = {
    audio: null, audioCtx: null, analyser: null,
    queue: [], currentIndex: 0, isPlaying: false,
    user: JSON.parse(localStorage.getItem('chatUser')) || null
};

document.addEventListener('DOMContentLoaded', () => {
    setupTheme();
    setupCursor();
    createSnow();
    setupVisualizer();

    // Page Specifics
    if (document.getElementById('musicGrid')) setupMusicPlayer();
    if (document.getElementById('chatContainer')) setupAI();
    if (document.getElementById('videoUrl')) setupDownloader();
    if (document.getElementById('chatApp')) setupChatgram();
});

// --- CHATGRAM LOGIC (Telegram Clone) ---
function setupChatgram() {
    if (!state.user) {
        document.getElementById('loginScreen').classList.remove('hidden');
    } else {
        initChatInterface();
    }

    window.loginUser = () => {
        const phone = document.getElementById('phoneInput').value;
        if (phone.length > 5) {
            state.user = { phone, name: "User" };
            localStorage.setItem('chatUser', JSON.stringify(state.user));
            document.getElementById('loginScreen').classList.add('hidden');
            initChatInterface();
        } else {
            alert("Enter a valid number");
        }
    };
}

function initChatInterface() {
    const chats = [
        { id: 1, name: "Elon Musk", msg: "Mars rocket ready?", img: "https://upload.wikimedia.org/wikipedia/commons/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg" },
        { id: 2, name: "Saved Messages", msg: "File_project_v2.zip", img: "logo.png" },
        { id: 3, name: "Pavel Durov", msg: "Telegram update looks good", img: "https://upload.wikimedia.org/wikipedia/commons/0/06/Pavel_Durov_2017.jpg" }
    ];

    const list = document.getElementById('chatList');
    list.innerHTML = '';
    chats.forEach(chat => {
        const el = document.createElement('div');
        el.className = 'chat-item';
        el.innerHTML = `
            <div class="avatar" style="background-image:url('${chat.img}')"></div>
            <div class="chat-info"><h4>${chat.name}</h4><p>${chat.msg}</p></div>
        `;
        el.onclick = () => openChat(chat);
        list.appendChild(el);
    });
}

function openChat(chat) {
    document.getElementById('headerName').innerText = chat.name;
    document.getElementById('headerAvatar').style.backgroundImage = `url('${chat.img}')`;
    document.getElementById('chatSidebar').classList.add('hidden'); // Mobile logic
    
    const area = document.getElementById('msgArea');
    area.innerHTML = `
        <div class="msg-bubble msg-in">Hello! This is ${chat.name}.</div>
        <div class="msg-bubble msg-in">Encrypted chat started 🔒</div>
    `;
}

window.sendChatMessage = () => {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    
    const area = document.getElementById('msgArea');
    area.innerHTML += `<div class="msg-bubble msg-out">${text}</div>`;
    input.value = '';
    area.scrollTop = area.scrollHeight;
    
    setTimeout(() => {
        area.innerHTML += `<div class="msg-bubble msg-in">Received: ${text}</div>`;
        area.scrollTop = area.scrollHeight;
    }, 1000);
};

window.toggleSidebar = () => {
    document.getElementById('chatSidebar').classList.toggle('hidden');
};

// --- AI LOGIC (Groq Fix) ---
function setupAI() {
    const btn = document.getElementById('generateBtn');
    const input = document.getElementById('aiPrompt');
    const container = document.getElementById('chatContainer');

    async function send() {
        const text = input.value.trim();
        if(!text) return;
        
        container.innerHTML += `<div class="message user"><div class="bubble">${text}</div></div>`;
        input.value = '';
        container.scrollTop = container.scrollHeight;

        const loadId = Date.now();
        container.innerHTML += `<div class="message ai" id="${loadId}"><div class="bubble">...</div></div>`;

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ prompt: text })
            });
            const data = await res.json();
            document.getElementById(loadId).innerHTML = `<div class="bubble">${data.result || data.error}</div>`;
        } catch(e) {
            document.getElementById(loadId).innerHTML = `<div class="bubble">Connection failed.</div>`;
        }
    }
    if(btn) btn.onclick = send;
    if(input) input.addEventListener('keypress', e => { if(e.key==='Enter') send(); });
}

// --- MUSIC LOGIC ---
function setupMusicPlayer() {
    state.audio = document.getElementById('audioPlayer');
    fetchSongs('Top Hits India');
    document.getElementById('playBtn').onclick = togglePlay;
    document.getElementById('searchBtn').onclick = () => fetchSongs(document.getElementById('searchInput').value);
}

async function fetchSongs(query) {
    const grid = document.getElementById('musicGrid');
    grid.innerHTML = '<div style="color:white; text-align:center; padding:20px;">Loading...</div>';
    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=40`);
        const data = await res.json();
        state.queue = data.results.filter(s => s.previewUrl);
        renderGrid();
    } catch(e) { console.error(e); }
}

function renderGrid() {
    const grid = document.getElementById('musicGrid');
    grid.innerHTML = '';
    state.queue.forEach((song, idx) => {
        const card = document.createElement('div');
        card.className = 'song-card magnetic reveal';
        card.innerHTML = `
            <div class="art-box" style="background-image:url('${song.artworkUrl100.replace('100x100','400x400')}')">
                <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
            </div>
            <h4>${song.trackName}</h4>
            <p>${song.artistName}</p>
        `;
        card.onclick = () => playSong(idx);
        grid.appendChild(card);
    });
}

function playSong(idx) {
    state.currentIndex = idx;
    state.audio.src = state.queue[idx].previewUrl;
    state.audio.play();
    state.isPlaying = true;
    updatePlayerUI(state.queue[idx]);
}

function togglePlay() {
    state.audio.paused ? state.audio.play() : state.audio.pause();
    state.isPlaying = !state.audio.paused;
    updatePlayerUI(state.queue[state.currentIndex]);
}

function updatePlayerUI(song) {
    document.getElementById('trackTitle').innerText = song.trackName;
    document.getElementById('trackArtist').innerText = song.artistName;
    document.getElementById('albumArt').style.backgroundImage = `url('${song.artworkUrl100}')`;
    document.getElementById('playBtn').innerHTML = state.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    document.getElementById('musicPlayerBar').classList.add('active');
}

// --- UTILS ---
function createSnow() {
    const container = document.getElementById('snowContainer');
    for(let i=0; i<40; i++) {
        const f = document.createElement('div');
        f.className = 'snowflake';
        f.style.left = Math.random() * 100 + 'vw';
        f.style.animationDuration = Math.random() * 5 + 5 + 's';
        f.style.width = Math.random() * 3 + 2 + 'px';
        f.style.height = f.style.width;
        container.appendChild(f);
    }
}

function setupVisualizer() {
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');
    function loop() {
        requestAnimationFrame(loop);
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
        grad.addColorStop(0, '#111'); grad.addColorStop(1, '#000');
        ctx.fillStyle = grad; ctx.fillRect(0,0,canvas.width,canvas.height);
    }
    loop();
}

function setupTheme() { document.getElementById('themeToggle').onclick = () => document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }
function setupCursor() { 
    if(window.innerWidth < 768) return;
    const c = document.getElementById('cursor'); 
    document.addEventListener('mousemove', e => { c.style.left = e.clientX+'px'; c.style.top = e.clientY+'px'; }); 
}
