const app = {
    user: null,
    currentTab: 'chat',
    
    init: () => {
        // Check Session
        const session = localStorage.getItem('chatgram_user');
        if (session) {
            app.user = JSON.parse(session);
            app.loadWorkspace();
        } else {
            document.getElementById('authScreen').classList.remove('hidden');
        }
    },

    // --- AUTHENTICATION (Simulated) ---
    login: (provider) => {
        const btn = document.querySelector(`.social-btn.${provider}`);
        if(btn) btn.style.opacity = '0.7';
        
        // Simulate Network Delay
        setTimeout(() => {
            const mockUser = {
                name: "Vinay Sirimilla",
                email: "vinay@chatgram.com",
                avatar: "https://ui-avatars.com/api/?name=Vinay+Sirimilla&background=0088cc&color=fff",
                id: "user_" + Date.now()
            };
            
            localStorage.setItem('chatgram_user', JSON.stringify(mockUser));
            app.user = mockUser;
            document.getElementById('authScreen').style.display = 'none';
            app.loadWorkspace();
        }, 1000);
    },

    logout: () => {
        localStorage.removeItem('chatgram_user');
        window.location.reload();
    },

    // --- WORKSPACE LOGIC ---
    loadWorkspace: () => {
        document.getElementById('workspace').classList.remove('hidden');
        document.getElementById('userAvatar').src = app.user.avatar;
        app.switchTab('chat');
        app.loadChats();
        app.loadEmails();
        app.showToast(`Welcome back, ${app.user.name}`);
    },

    switchTab: (tab) => {
        // Update UI
        document.querySelectorAll('.app-icon').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.app-view').forEach(el => el.classList.add('hidden'));
        
        // Find button index roughly
        const icons = document.querySelectorAll('.app-icon');
        if(tab === 'chat') icons[0].classList.add('active');
        if(tab === 'call') icons[1].classList.add('active');
        if(tab === 'email') icons[2].classList.add('active');

        document.getElementById(`view-${tab}`).classList.remove('hidden');
        app.currentTab = tab;
        
        // Special init for video
        if(tab === 'call') app.initCamera();
    },

    // --- DATA MOCKING ---
    loadChats: () => {
        const chats = [
            { name: "Elon Musk", msg: "Rocket launch successful!", time: "10:02 AM", unread: 2 },
            { name: "Team Alpha", msg: "Meeting at 3 PM?", time: "Yesterday", unread: 0 },
            { name: "Support Bot", msg: "Ticket #9283 resolved.", time: "Mon", unread: 5 }
        ];
        const list = document.getElementById('chatList');
        list.innerHTML = chats.map(c => `
            <div class="chat-preview-card">
                <img src="https://ui-avatars.com/api/?name=${c.name}&background=random" class="avatar">
                <div style="flex:1">
                    <div style="display:flex; justify-content:space-between">
                        <b>${c.name}</b>
                        <small style="opacity:0.6">${c.time}</small>
                    </div>
                    <div style="font-size:0.9rem; opacity:0.8; margin-top:2px;">${c.msg}</div>
                </div>
            </div>
        `).join('');
    },

    loadEmails: () => {
        const emails = [
            { from: "Google Security", subject: "New sign-in detected", time: "11:30 AM" },
            { from: "Netlify", subject: "Build successful: chatgram-v2", time: "10:15 AM" },
            { from: "HR Department", subject: "Holiday Calendar 2026", time: "Yesterday" }
        ];
        const list = document.getElementById('emailList');
        list.innerHTML = emails.map(e => `
            <div class="email-item">
                <div class="email-sender">${e.from}</div>
                <div class="email-subject">${e.subject}</div>
                <div class="email-time">${e.time}</div>
            </div>
        `).join('');
    },

    // --- WEBRTC (Real Camera) ---
    initCamera: async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            document.getElementById('localVideo').srcObject = stream;
        } catch (e) {
            app.showToast("Camera access denied or unavailable");
        }
    },

    toggleCam: () => {
        const video = document.getElementById('localVideo');
        video.srcObject.getVideoTracks()[0].enabled = !video.srcObject.getVideoTracks()[0].enabled;
    },

    toggleMic: () => app.showToast("Microphone toggled"),
    shareScreen: () => app.showToast("Screen sharing started"),

    // --- UTILS ---
    showToast: (msg) => {
        const t = document.getElementById('toast');
        t.innerText = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }
};

document.addEventListener('DOMContentLoaded', app.init);
