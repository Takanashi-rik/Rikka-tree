let userData = null;
let currentLyricIndex = -1;
let isPlaying = false;

const elements = {
    profilePic: document.getElementById('profilePic'),
    profileName: document.getElementById('profileName'),
    profileBio: document.getElementById('profileBio'),
    linksContainer: document.getElementById('linksContainer'),
    currentYear: document.getElementById('currentYear'),
    albumArt: document.getElementById('albumArt'),
    songTitle: document.getElementById('songTitle'),
    artist: document.getElementById('artist'),
    lyrics: document.getElementById('lyrics'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    playPauseIcon: document.getElementById('playPauseIcon'),
    progressBar: document.getElementById('progressBar'),
    currentTimeDisplay: document.getElementById('currentTime'),
    totalTimeDisplay: document.getElementById('totalTime'),
    welcomePanel: document.getElementById('welcomePanel'),
    welcomeCloseBtn: document.getElementById('welcomeCloseBtn'),
    audioPlayer: document.getElementById('audioPlayer')
};

function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 70;
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 1.5 + 0.5;
            this.speedX = Math.random() * 0.3 - 0.15;
            this.speedY = Math.random() * 0.3 - 0.15;
            this.alpha = Math.random() * 0.2 + 0.1;
            this.color = '#8a5cf6';
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            if (this.x > canvas.width || this.x < 0) this.speedX *= -0.95;
            if (this.y > canvas.height || this.y < 0) this.speedY *= -0.95;
            
            this.x = Math.max(1, Math.min(canvas.width - 1, this.x));
            this.y = Math.max(1, Math.min(canvas.height - 1, this.y));
            
            this.alpha += (Math.random() - 0.5) * 0.01;
            this.alpha = Math.max(0.05, Math.min(0.3, this.alpha));
        }
        
        draw() {
            ctx.beginPath();
            ctx.fillStyle = this.color.replace(')', `, ${this.alpha})`);
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.fillStyle = this.color.replace(')', `, ${this.alpha * 0.3})`);
            ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

function checkWelcomePanel() {
    const lastVisit = localStorage.getItem('lastVisit');
    const currentTime = new Date().getTime();
    
    if (!lastVisit || (currentTime - lastVisit) > 3600000) {
        elements.welcomePanel.classList.add('visible');
        localStorage.setItem('lastVisit', currentTime);
    }
}

async function loadData() {
    try {
        const response = await fetch('data.json');
        userData = await response.json();
        initializeFromJSON(userData);
    } catch (error) {
        console.error('Error loading data:', error);
        userData = {
            profile: {
                name: "Your Name",
                bio: "Digital creator & content curator.",
                image: "https://files.catbox.moe/3sqivl.png"
            },
            links: [],
            music: {
                title: "LoFi Dreams",
                artist: "Chillhop",
                albumArt: "",
                duration: 180,
                timeSync: []
            }
        };
        initializeFromJSON(userData);
    }
}

function initializeFromJSON(data) {
    elements.profileName.textContent = data.profile.name;
    elements.profileBio.textContent = data.profile.bio;
    elements.profilePic.src = data.profile.image;
    
    elements.linksContainer.innerHTML = '';
    data.links.forEach((link, index) => {
        const linkElement = document.createElement('a');
        linkElement.href = link.url;
        linkElement.className = 'link-item';
        linkElement.target = '_blank';
        linkElement.rel = 'noopener noreferrer';
        
        const icon = document.createElement('i');
        icon.className = link.icon;
        
        const text = document.createElement('span');
        text.textContent = link.title;
        
        linkElement.appendChild(icon);
        linkElement.appendChild(text);
        
        linkElement.style.animationDelay = `${index * 0.1}s`;
        
        elements.linksContainer.appendChild(linkElement);
    });
    
    elements.songTitle.textContent = data.music.title;
    elements.artist.textContent = data.music.artist;
    
    if (data.music.albumArt && data.music.albumArt !== 'YOUR_ALBUM_ART_URL_HERE') {
        elements.albumArt.src = data.music.albumArt;
    } else {
        elements.albumArt.src = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop';
        elements.albumArt.style.opacity = '0.8';
    }
    
    if (data.music.timeSync && data.music.timeSync[0]) {
        const initialLyric = data.music.timeSync[0].text.replace(/\n/g, '<br>');
        elements.lyrics.innerHTML = initialLyric;
    }
    
    if (data.music.audioFile && data.music.audioFile !== 'YOUR_AUDIO_FILE_URL.mp3') {
        elements.audioPlayer.src = data.music.audioFile;
        elements.audioPlayer.volume = 0.3;
        
        elements.audioPlayer.addEventListener('loadedmetadata', function() {
            const duration = elements.audioPlayer.duration || data.music.duration;
            elements.totalTimeDisplay.textContent = formatTime(duration);
        });
        
        elements.audioPlayer.addEventListener('timeupdate', function() {
            const currentTime = elements.audioPlayer.currentTime;
            const duration = elements.audioPlayer.duration || data.music.duration;
            
            elements.currentTimeDisplay.textContent = formatTime(currentTime);
            const percent = (currentTime / duration) * 100;
            elements.progressBar.style.width = `${percent}%`;
            
            updateLyricsDisplay(currentTime);
        });
        
        elements.audioPlayer.addEventListener('ended', function() {
            isPlaying = false;
            elements.playPauseIcon.className = 'fas fa-play';
            elements.albumArt.style.animation = 'none';
        });
    } else {
        elements.totalTimeDisplay.textContent = formatTime(data.music.duration || 180);
        elements.playPauseBtn.style.opacity = '0.8';
    }
    
    elements.currentYear.textContent = new Date().getFullYear();
}

function updateLyricsDisplay(time) {
    if (!userData || !userData.music.timeSync) return;
    
    const lyrics = userData.music.timeSync;
    let currentLyric = null;
    let newLyricIndex = -1;
    
    for (let i = 0; i < lyrics.length; i++) {
        if (lyrics[i].time <= time) {
            currentLyric = lyrics[i];
            newLyricIndex = i;
        } else {
            break;
        }
    }
    
    if (currentLyric && newLyricIndex !== currentLyricIndex) {
        currentLyricIndex = newLyricIndex;
        
        const formattedText = currentLyric.text.replace(/\n/g, '<br>');
        elements.lyrics.innerHTML = formattedText;
        
        elements.lyrics.style.opacity = '0';
        setTimeout(() => {
            elements.lyrics.style.transition = 'opacity 0.4s ease';
            elements.lyrics.style.opacity = '1';
        }, 10);
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function togglePlayPause() {
    if (userData?.music?.audioFile && userData.music.audioFile === 'YOUR_AUDIO_FILE_URL.mp3') {
        return;
    }
    
    isPlaying = !isPlaying;
    
    if (isPlaying) {
        elements.playPauseIcon.className = 'fas fa-pause';
        if (elements.audioPlayer.src) {
            elements.audioPlayer.play();
        }
        elements.albumArt.style.animation = 'rotate 20s linear infinite';
    } else {
        elements.playPauseIcon.className = 'fas fa-play';
        if (elements.audioPlayer.src) {
            elements.audioPlayer.pause();
        }
        elements.albumArt.style.animation = 'none';
    }
}

function tryAutoPlay() {
    if (!isPlaying && elements.audioPlayer.src && userData?.music?.audioFile !== 'YOUR_AUDIO_FILE_URL.mp3') {
        const playPromise = elements.audioPlayer.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isPlaying = true;
                elements.playPauseIcon.className = 'fas fa-pause';
                elements.albumArt.style.animation = 'rotate 20s linear infinite';
            }).catch(error => {
                console.log('Auto play diblokir:', error);
            });
        }
    }
}

function setupEventListeners() {
    elements.welcomeCloseBtn.addEventListener('click', () => {
        elements.welcomePanel.classList.remove('visible');
        
        setTimeout(() => {
            tryAutoPlay();
        }, 300);
    });
    
    elements.playPauseBtn.addEventListener('click', togglePlayPause);
    
    document.querySelector('.progress-container').addEventListener('click', function(e) {
        if (elements.audioPlayer.src && userData?.music?.audioFile !== 'YOUR_AUDIO_FILE_URL.mp3') {
            const rect = this.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const duration = elements.audioPlayer.duration || userData?.music?.duration || 180;
            elements.audioPlayer.currentTime = percent * duration;
        }
    });
    
    elements.welcomePanel.addEventListener('click', (e) => {
        if (e.target === elements.welcomePanel) {
            elements.welcomePanel.classList.remove('visible');
            
            setTimeout(() => {
                tryAutoPlay();
            }, 300);
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initParticles();
    checkWelcomePanel();
    loadData();
    setupEventListeners();
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
});