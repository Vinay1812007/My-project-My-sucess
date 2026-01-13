// --- APP STATE ---
const state = {
    user: JSON.parse(localStorage.getItem('chatUser')) || null,
    activeChat: null
};

// --- CORE APP MODULE ---
const app = {
    init: () => {
        app.setupTheme();
        if(document.getElementById('chatApp')) app.initChatgram();
        // Init other pages if elements exist
        if(document.getElementById('musicGrid')) setupMusic();
        if(document.getElementById('chatContainer')) setupAI();
        if(document.getElementById('videoUrl')) setupDownloader();
    },

    setupTheme: () => {
        const saved = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
        const btn = document.getElementById('themeToggle');
        if(btn) btn.onclick = () => {
            const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
        };
    },

    // --- CHATGRAM FUNCTIONS ---
    initChatgram: () => {
        if (state.user) {
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('chatApp').classList.remove('hidden');
            app.renderChats();
        } else {
            document.getElementById('loginScreen').classList.remove('hidden');
            document.getElementById('chatApp').classList.add('hidden');
        }
        
        // Input Listener
        const input = document.getElementById('chatInput');
        if(input) input.addEventListener('keypress', (e) => { if(e.key === 'Enter') app.sendMessage(); });
    },

    loginGoogle: () => {
        const btn = document.querySelector('.google-btn');
        const span = btn.querySelector('span');
        span.innerText = "Connecting to Google...";
        setTimeout(() => {
            state.user = { name: "Vinay (You)", avatar: "logo.png", id: "g_123" };
            localStorage.setItem('chatUser', JSON.stringify(state.user));
            app.initChatgram();
        }, 1500);
    },

    loginPhone: () => {
        const phone = document.getElementById('phoneInput').value;
        if(phone.length < 5) return alert("Invalid Number");
        state.user = { name: "Mobile User", avatar: "logo.png", phone };
        localStorage.setItem('chatUser', JSON.stringify(state.user));
        app.initChatgram();
    },

    renderChats: () => {
        const chats = [
            { id: 1, name: "Elon Musk", msg: "Mars rocket testing 🚀", time: "10:00", unread: 2, img: "https://upload.wikimedia.org/wikipedia/commons/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg", online: true },
            { id: 2, name: "Saved Messages", msg: "Project_Final.pdf", time: "Yesterday", unread: 0, img: "logo.png", online: true },
            { id: 3, name: "Telegram News", msg: "New Update Features...", time: "Mon", unread: 5, img: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg", online: false },
            { id: 4, name: "Team Group", msg: "Meeting at 4PM", time: "Sun", unread: 0, img: "https://ui-avatars.com/api/?name=Team+Work", online: false }
        ];

        const list = document.getElementById('chatList');
        list.innerHTML = '';
        chats.forEach(chat => {
            const el = document.createElement('div');
            el.className = 'chat-item';
            el.innerHTML = `
                <div class="avatar" style="background-image:url('${chat.img}')">
                    ${chat.online ? '<div class="online-badge"></div>' : ''}
                </div>
                <div class="chat-content">
                    <div class="chat-top"><span class="chat-name">${chat.name}</span><span class="chat-time">${chat.time}</span></div>
                    <div class="chat-bottom">
                        <span class="chat-msg">${chat.msg}</span>
                        ${chat.unread ? `<span class="unread-count">${chat.unread}</span>` : ''}
                    </div>
                </div>
            `;
            el.onclick = () => app.openChat(chat);
            list.appendChild(el);
        });
    },

    openChat: (chat) => {
        state.activeChat = chat;
        document.getElementById('headerName').innerText = chat.name;
        document.getElementById('headerAvatar').style.backgroundImage = `url('${chat.img}')`;
        document.getElementById('callName').innerText = chat.name;
        document.getElementById('callAvatar').style.backgroundImage = `url('${chat.img}')`;
        
        // MOBILE LOGIC: Add class to body to slide views
        document.body.classList.add('chat-open');

        // Fake Messages
        const area = document.getElementById('msgArea');
        area.innerHTML = '<div class="encrypted-notice"><i class="fa-solid fa-lock"></i> End-to-end encrypted</div>';
        area.innerHTML += `<div class="msg-bubble msg-in">Hello! This is ${chat.name}.</div>`;
        area.innerHTML += `<div class="msg-bubble msg-in">${chat.msg}</div>`;
    },

    closeChat: () => {
        // MOBILE LOGIC: Remove class to slide back
        document.body.classList.remove('chat-open');
    },

    sendMessage: () => {
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
    },

    startCall: (type) => {
        document.getElementById('callOverlay').classList.add('active');
        document.getElementById('callStatus').innerText = type === 'video' ? "Video Calling..." : "Calling...";
    },

    endCall: () => {
        document.getElementById('callOverlay').classList.remove('active');
    }
};

// --- STANDARD PAGE FUNCTIONS (Mock implementations) ---
function setupMusic() {
    console.log("Music Initialized");
    const btn = document.getElementById('searchBtn');
    if(btn) btn.onclick = () => alert("Search Logic Active");
}
function setupAI() {
    const btn = document.getElementById('generateBtn');
    if(btn) btn.onclick = async () => {
        const area = document.getElementById('chatContainer');
        const input = document.getElementById('aiPrompt');
        area.innerHTML += `<div class="message user"><div class="bubble">${input.value}</div></div>`;
        
        // Mock API Call
        setTimeout(() => {
            area.innerHTML += `<div class="message ai"><div class="bubble">I am your AI assistant. (Connected to Logic)</div></div>`;
        }, 1000);
    };
}
function setupDownloader() {
    const btn = document.getElementById('fetchVideoBtn');
    if(btn) btn.onclick = () => {
        document.getElementById('videoLoader').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('videoLoader').classList.add('hidden');
            document.getElementById('dlResult').classList.remove('hidden');
        }, 1500);
    }
}

// Run App
document.addEventListener('DOMContentLoaded', app.init);
