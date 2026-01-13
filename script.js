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

    handleCredentialResponse: (response) => {
        const responsePayload = app.parseJwt(response.credential);
        state.user = { 
            name: responsePayload.name, 
            avatar: responsePayload.picture, 
            id: responsePayload.sub 
        };
        localStorage.setItem('chatUser', JSON.stringify(state.user));
        app.initChatgram();
    },

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
        const chats = [
            { id: 1, name: "Elon Musk", msg: "Mars update?", time: "10:00", img: "https://upload.wikimedia.org/wikipedia/commons/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg" },
            { id: 2, name: "Team Group", msg: "Meeting at 3PM", time: "Mon", img: "logo.png" }
        ];
        const list = document.getElementById('chatList');
        list.innerHTML = '';
        chats.forEach(chat => {
            const el = document.createElement('div');
            el.className = 'chat-item';
            el.innerHTML = `<div class="avatar" style="background-image:url('${chat.img}')"></div><div class="chat-content"><div class="chat-top"><span class="chat-name">${chat.name}</span><span class="chat-time">${chat.time}</span></div><div class="chat-bottom"><span class="chat-msg">${chat.msg}</span></div></div>`;
            el.onclick = () => app.openChat(chat);
            list.appendChild(el);
        });
    },

    openChat: (chat) => {
        state.activeChat = chat;
        document.getElementById('headerName').innerText = chat.name;
        document.getElementById('headerAvatar').style.backgroundImage = `url('${chat.img}')`;
        document.body.classList.add('chat-open');
        const area = document.getElementById('msgArea');
        area.innerHTML = '<div class="encrypted-notice"><i class="fa-solid fa-lock"></i> Chat is secure</div>';
    },

    closeChat: () => {
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
            area.innerHTML += `<div class="msg-bubble msg-in">Message Received</div>`;
            area.scrollTop = area.scrollHeight;
        }, 1000);
    },

    startCall: async () => {
        const overlay = document.getElementById('callOverlay');
        const video = document.getElementById('localVideo');
        overlay.classList.add('active');
        try {
            state.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            video.srcObject = state.stream;
        } catch (err) {
            alert("Camera access denied: " + err);
            overlay.classList.remove('active');
        }
    },

    endCall: () => {
        document.getElementById('callOverlay').classList.remove('active');
        if (state.stream) {
            state.stream.getTracks().forEach(track => track.stop());
            state.stream = null;
        }
    }
};

window.handleCredentialResponse = app.handleCredentialResponse;

// Placeholder functions for other pages
function setupMusic() {}
function setupAI() {
    document.getElementById('generateBtn').onclick = async () => {
        const input = document.getElementById('aiPrompt');
        const container = document.getElementById('chatContainer');
        container.innerHTML += `<div class="message user"><div class="bubble">${input.value}</div></div>`;
        try {
            const res = await fetch('/api/generate', { method: 'POST', body: JSON.stringify({prompt:input.value}) });
            const data = await res.json();
            container.innerHTML += `<div class="message ai"><div class="bubble">${data.result}</div></div>`;
        } catch(e) { container.innerHTML += `<div class="message ai"><div class="bubble">Error</div></div>`; }
    };
}
function setupDownloader() {}

document.addEventListener('DOMContentLoaded', app.init);
