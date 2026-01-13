// --- STATE ---
const state = {
    audio: null,
    queue: [],
    user: JSON.parse(localStorage.getItem('chatUser')) || null,
    theme: localStorage.getItem('theme') || 'dark'
};

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme
    document.documentElement.setAttribute('data-theme', state.theme);
    document.getElementById('themeToggle').onclick = toggleTheme;

    // 2. Cursor & Visuals
    setupCursor();
    createSnow();
    setupVisualizer();

    // 3. Page Logic
    if (document.getElementById('chatApp')) setupChatgram();
    if (document.getElementById('musicGrid')) setupMusic();
    if (document.getElementById('chatContainer')) setupAI();
    if (document.getElementById('videoUrl')) setupDownloader();
});

// ==========================================
// 💬 CHATGRAM LOGIC (Authentication & UI)
// ==========================================
function setupChatgram() {
    const loginScreen = document.getElementById('loginScreen');
    const chatApp = document.getElementById('chatApp');

    // Check Auth
    if (state.user) {
        loginScreen.classList.add('hidden');
        chatApp.classList.remove('hidden');
        loadChats();
    } else {
        loginScreen.classList.remove('hidden');
        chatApp.classList.add('hidden');
    }

    // Google Login Simulation
    window.loginGoogle = () => {
        const btn = document.querySelector('.google-btn span');
        const originalText = btn.innerText;
        btn.innerText = "Connecting...";
        
        setTimeout(() => {
            state.user = { name: "Google User", avatar: "https://lh3.googleusercontent.com/a/default-user=s120", id: "g_123" };
            localStorage.setItem('chatUser', JSON.stringify(state.user));
            loginScreen.classList.add('hidden');
            chatApp.classList.remove('hidden');
            loadChats();
        }, 1500);
    };

    // Phone Login Simulation
    window.loginPhone = () => {
        const phone = document.getElementById('phoneInput').value;
        if(phone.length < 5) return alert("Invalid Phone Number");
        state.user = { name: "Mobile User", avatar: "logo.png", phone };
        localStorage.setItem('chatUser', JSON.stringify(state.user));
        loginScreen.classList.add('hidden');
        chatApp.classList.remove('hidden');
        loadChats();
    };
}

function loadChats() {
    const chats = [
        { id: 1, name: "Saved Messages", msg: "File_Report_Final.pdf", time: "12:00", unread: 0, img: "logo.png", online: true },
        { id: 2, name: "Elon Musk", msg: "Rocket launch in 5 mins 🚀", time: "11:45", unread: 2, img: "https://upload.wikimedia.org/wikipedia/commons/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg", online: true },
        { id: 3, name: "Project Team", msg: "Meeting at 4 PM", time: "Yesterday", unread: 5, img: "https://ui-avatars.com/api/?name=Team+Work&background=random", online: false },
        { id: 4, name: "Telegram News", msg: "New Update Features...", time: "Mon", unread: 0, img: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg", online: false }
    ];

    const list = document.getElementById('chatList');
    list.innerHTML = '';
    
    chats.forEach(chat => {
        const div = document.createElement('div');
        div.className = 'chat-item';
        div.onclick = () => openChat(chat);
        div.innerHTML = `
            <div class="chat-img" style="background-image:url('${chat.img}')">
                ${chat.online ? '<div class="online-dot"></div>' : ''}
            </div>
            <div class="chat-content">
                <div class="chat-top">
                    <span class="chat-name">${chat.name}</span>
                    <span class="chat-time">${chat.time}</span>
                </div>
                <div class="chat-bottom">
                    <span class="chat-msg">${chat.msg}</span>
                    ${chat.unread ? `<span class="unread-count">${chat.unread}</span>` : ''}
                </div>
            </div>
        `;
        list.appendChild(div);
    });
}

function openChat(chat) {
    document.getElementById('headerName').innerText = chat.name;
    document.getElementById('headerAvatar').style.backgroundImage = `url('${chat.img}')`;
    document.getElementById('headerStatus').innerText = chat.online ? 'online' : 'last seen recently';
    
    // Set Call Avatar
    document.getElementById('callName').innerText = chat.name;
    document.getElementById('callAvatar').style.backgroundImage = `url('${chat.img}')`;
    document.getElementById('callBg').style.backgroundImage = `url('${chat.img}')`;

    // Toggle Mobile Sidebar
    if (window.innerWidth < 768) {
        document.getElementById('chatSidebar').classList.add('closed');
    }

    // Mock Messages
    const area = document.getElementById('msgArea');
    area.innerHTML = '<div class="encrypted-notice"><i class="fa-solid fa-lock"></i> Messages are end-to-end encrypted</div>';
    
    // Simulating History
    const msgs = [
        { type: 'in', text: `Hi! This is ${chat.name}.` },
        { type: 'in', text: chat.msg }
    ];
    msgs.forEach(m => {
        area.innerHTML += `<div class="msg-bubble msg-${m.type}">${m.text}</div>`;
    });
}

window.sendChatMessage = () => {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if(!text) return;
    
    const area = document.getElementById('msgArea');
    area.innerHTML += `<div class="msg-bubble msg-out">${text}</div>`;
    input.value = '';
    area.scrollTop = area.scrollHeight;
    
    setTimeout(() => {
        area.innerHTML += `<div class="msg-bubble msg-in">👍 Received</div>`;
        area.scrollTop = area.scrollHeight;
    }, 1000);
};

window.toggleSidebar = () => document.getElementById('chatSidebar').classList.toggle('closed');

window.startCall = (type) => {
    const overlay = document.getElementById('callOverlay');
    overlay.classList.add('active');
    document.getElementById('callStatus').innerText = type === 'video' ? "Video Calling..." : "Calling...";
};

window.endCall = () => {
    document.getElementById('callOverlay').classList.remove('active');
};

// ==========================================
// 🎵 MUSIC, AI, UTILS (Standard)
// ==========================================
function setupMusic() {
    // Basic setup for music.html functionality
    const btn = document.getElementById('searchBtn');
    if(btn) btn.onclick = () => alert("Search Logic Here");
}

function setupAI() {
    const btn = document.getElementById('generateBtn');
    if(btn) btn.onclick = async () => {
        const input = document.getElementById('aiPrompt');
        const container = document.getElementById('chatContainer');
        const text = input.value;
        container.innerHTML += `<div class="message user"><div class="bubble">${text}</div></div>`;
        
        try {
            const res = await fetch('/api/generate', { method: 'POST', body: JSON.stringify({prompt:text}) });
            const data = await res.json();
            container.innerHTML += `<div class="message ai"><div class="bubble">${data.result}</div></div>`;
        } catch(e) {
            container.innerHTML += `<div class="message ai"><div class="bubble">Error</div></div>`;
        }
    };
}

function setupDownloader() {
    const btn = document.getElementById('fetchVideoBtn');
    if(btn) btn.onclick = () => {
        document.getElementById('videoLoader').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('videoLoader').classList.add('hidden');
            document.getElementById('dlResult').classList.remove('hidden');
            document.getElementById('thumbPreview').src = "https://picsum.photos/600/350";
        }, 1500);
    };
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
}

function setupCursor() {
    if(window.innerWidth < 768) return;
    const c = document.getElementById('cursor');
    document.addEventListener('mousemove', e => {
        c.style.left = e.clientX + 'px';
        c.style.top = e.clientY + 'px';
    });
}

function createSnow() {
    const container = document.getElementById('snowContainer');
    if(!container) return;
    for(let i=0; i<30; i++) {
        const f = document.createElement('div');
        f.className = 'snowflake';
        f.style.left = Math.random()*100 + 'vw';
        f.style.animationDuration = Math.random()*5 + 5 + 's';
        f.style.width = Math.random()*3 + 2 + 'px';
        f.style.height = f.style.width;
        container.appendChild(f);
    }
}

function setupVisualizer() {
    const canvas = document.getElementById('bgCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    function loop() {
        requestAnimationFrame(loop);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
        grad.addColorStop(0, '#1a1a1a');
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,canvas.width,canvas.height);
    }
    loop();
}
