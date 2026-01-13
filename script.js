// --- APP STATE ---
const state = {
    user: JSON.parse(localStorage.getItem('chatUser')) || null,
    activeChat: null,
    stream: null
};

// --- CORE APP MODULE ---
const app = {
    init: () => {
        app.setupTheme();
        
        // Router Logic based on page presence
        if(document.getElementById('chatApp')) app.initChatgram();
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

    // --- CHATGRAM LOGIC ---
    initChatgram: () => {
        if (state.user) {
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('chatApp').classList.remove('hidden');
            app.renderChats();
        } else {
            document.getElementById('loginScreen').classList.remove('hidden');
            document.getElementById('chatApp').classList.add('hidden');
        }
        
        const input = document.getElementById('chatInput');
        if(input) input.addEventListener('keypress', (e) => { if(e.key === 'Enter') app.sendMessage(); });
    },

    // Called by Google Library on success
    handleCredentialResponse: (response) => {
        // In a real backend, you verify 'response.credential' here.
        // For static site, we decode the JWT locally to get user info.
        const responsePayload = app.parseJwt(response.credential);
        
        state.user = { 
            name: responsePayload.name, 
            avatar: responsePayload.picture, 
            id: responsePayload.sub 
        };
        localStorage.setItem('chatUser', JSON.stringify(state.user));
        app.initChatgram();
    },

    // Helper to decode Google JWT
    parseJwt: (token) => {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    },

    loginDemo: () => {
        state.user = { name: "Guest User", avatar: "logo.png", id: "guest" };
        localStorage.setItem('chatUser', JSON.stringify(state.user));
        app.initChatgram();
    },

    renderChats: () => {
        // Load chats from LocalStorage or use default
        const savedChats = JSON.parse(localStorage.getItem('myChats')) || [
            { id: 1, name: "Elon Musk", msg: "Mars update?", time: "10:00", img: "https://upload.wikimedia.org/wikipedia/commons/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg" },
            { id: 2, name: "Team Group", msg: "Meeting at 3PM", time: "Mon", img: "logo.png" }
        ];

        const list = document.getElementById('chatList');
        list.innerHTML = '';
        savedChats.forEach(chat => {
            const el = document.createElement('div');
            el.className = 'chat-item';
            el.innerHTML = `
                <div class="avatar" style="background-image:url('${chat.img}')"></div>
                <div class="chat-content">
                    <div class="chat-top"><span class="chat-name">${chat.name}</span><span class="chat-time">${chat.time}</span></div>
                    <div class="chat-bottom"><span class="chat-msg">${chat.msg}</span></div>
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
        document.body.classList.add('chat-open'); // Mobile toggle

        // Load Messages from Storage
        const msgs = JSON.parse(localStorage.getItem(`msgs_${chat.id}`)) || [];
        const area = document.getElementById('msgArea');
        area.innerHTML = '<div class="encrypted-notice"><i class="fa-solid fa-lock"></i> Chat is secure</div>';
        
        msgs.forEach(m => {
            area.innerHTML += `<div class="msg-bubble msg-${m.type}">${m.text}</div>`;
        });
    },

    closeChat: () => {
        document.body.classList.remove('chat-open');
    },

    sendMessage: () => {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if(!text || !state.activeChat) return;
        
        const area = document.getElementById('msgArea');
        area.innerHTML += `<div class="msg-bubble msg-out">${text}</div>`;
        input.value = '';
        area.scrollTop = area.scrollHeight;

        // Save to Storage
        const chatId = state.activeChat.id;
        const msgs = JSON.parse(localStorage.getItem(`msgs_${chatId}`)) || [];
        msgs.push({ type: 'out', text: text });
        
        // Mock Reply
        setTimeout(() => {
            const reply = "This is an automated reply.";
            area.innerHTML += `<div class="msg-bubble msg-in">${reply}</div>`;
            area.scrollTop = area.scrollHeight;
            msgs.push({ type: 'in', text: reply });
            localStorage.setItem(`msgs_${chatId}`, JSON.stringify(msgs));
        }, 1000);
    },

    // --- REAL CAMERA ACCESS (WebRTC) ---
    startCall: async () => {
        const overlay = document.getElementById('callOverlay');
        const video = document.getElementById('localVideo');
        overlay.classList.add('active');

        try {
            // Request Camera & Mic
            state.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            video.srcObject = state.stream;
        } catch (err) {
            alert("Camera access denied or not available: " + err);
            overlay.classList.remove('active');
        }
    },

    endCall: () => {
        const overlay = document.getElementById('callOverlay');
        overlay.classList.remove('active');
        
        // Stop Camera
        if (state.stream) {
            state.stream.getTracks().forEach(track => track.stop());
            state.stream = null;
        }
    }
};

// --- GLOBAL GOOGLE CALLBACK ---
// Google needs this function to be global
window.handleCredentialResponse = app.handleCredentialResponse;

// --- OTHER PAGES LOGIC ---
function setupMusic() {
    // Music Logic from previous steps
    console.log("Music loaded");
}
function setupAI() {
    const btn = document.getElementById('generateBtn');
    if(btn) btn.onclick = async () => {
        const input = document.getElementById('aiPrompt');
        const container = document.getElementById('chatContainer');
        const text = input.value;
        if(!text) return;
        
        container.innerHTML += `<div class="message user"><div class="bubble">${text}</div></div>`;
        input.value = '';
        
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
    console.log("Downloader Loaded");
}

document.addEventListener('DOMContentLoaded', app.init);
