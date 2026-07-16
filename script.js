let userData = null;
let currentLyricIndex = -1;
let isPlaying = false;
let audioPlayer = null;
let playPauseBtn = null;
let playPauseIcon = null;

async function loadData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        userData = data;
        
        document.getElementById('bgImage').src = data.profile.image;
        document.getElementById('profileName').textContent = data.profile.name;
        document.getElementById('profileBio').textContent = data.profile.bio;
        
        const socialIcons = document.getElementById('socialIcons');
        socialIcons.innerHTML = '';
        
        if (data.socialLinks && data.socialLinks.length > 0) {
            data.socialLinks.forEach(link => {
                const a = document.createElement('a');
                a.href = link.url;
                a.className = 'social-icon';
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.title = link.title;
                
                const icon = document.createElement('i');
                icon.className = link.icon;
                
                a.appendChild(icon);
                socialIcons.appendChild(a);
            });
        }
        
        const linksContainer = document.getElementById('linksContainer');
        linksContainer.innerHTML = '';
        
        if (data.links && data.links.length > 0) {
            data.links.forEach((link, index) => {
                const a = document.createElement('a');
                a.href = link.url;
                a.className = 'link-item';
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.style.animationDelay = `${index * 0.08}s`;
                
                const iconDiv = document.createElement('div');
                iconDiv.className = 'link-icon';
                
                if (link.icon && (link.icon.startsWith('http') || link.icon.startsWith('/') || link.icon.includes('.png') || link.icon.includes('.jpg') || link.icon.includes('.jpeg') || link.icon.includes('.svg') || link.icon.includes('.gif') || link.icon.includes('.webp'))) {
                    const img = document.createElement('img');
                    img.src = link.icon;
                    img.alt = link.title;
                    img.onerror = function() {
                        this.style.display = 'none';
                        const fallbackIcon = document.createElement('i');
                        fallbackIcon.className = 'fas fa-link';
                        iconDiv.appendChild(fallbackIcon);
                    };
                    iconDiv.appendChild(img);
                } else {
                    const icon = document.createElement('i');
                    icon.className = link.icon || 'fas fa-link';
                    iconDiv.appendChild(icon);
                }
                
                const span = document.createElement('span');
                span.className = 'link-text';
                span.textContent = link.title;
                
                a.appendChild(iconDiv);
                a.appendChild(span);
                linksContainer.appendChild(a);
            });
        }
        
        audioPlayer = document.getElementById('audioPlayer');
        playPauseBtn = document.getElementById('playPauseBtn');
        playPauseIcon = document.getElementById('playPauseIcon');
        
        if (data.music) {
            document.getElementById('songTitle').textContent = data.music.title || 'Song Title';
            document.getElementById('artist').textContent = data.music.artist || 'Artist Name';
            
            const albumArt = document.getElementById('albumArt');
            if (data.music.cover) {
                albumArt.src = data.music.cover;
                albumArt.onerror = function() {
                    this.src = 'https://via.placeholder.com/56x56/1a1a2e/8a5cf6?text=🎵';
                };
            } else {
                albumArt.src = 'https://via.placeholder.com/56x56/1a1a2e/8a5cf6?text=🎵';
            }
            
            if (data.music.audioFile && data.music.audioFile !== 'YOUR_AUDIO_FILE_URL.mp3' && data.music.audioFile !== '') {
                audioPlayer.src = data.music.audioFile;
                audioPlayer.volume = 0.3;
                
                audioPlayer.addEventListener('loadedmetadata', function() {
                    const duration = audioPlayer.duration;
                    document.getElementById('totalTime').textContent = formatTime(duration);
                });
                
                audioPlayer.addEventListener('timeupdate', function() {
                    const currentTime = audioPlayer.currentTime;
                    const duration = audioPlayer.duration || 228;
                    
                    document.getElementById('currentTime').textContent = formatTime(currentTime);
                    const percent = (currentTime / duration) * 100;
                    document.getElementById('progressBar').style.width = `${percent}%`;
                    
                    updateLyricsDisplay(currentTime);
                });
                
                audioPlayer.addEventListener('ended', function() {
                    isPlaying = false;
                    playPauseIcon.className = 'fas fa-play';
                });
                
                setTimeout(() => {
                    audioPlayer.play().then(() => {
                        isPlaying = true;
                        playPauseIcon.className = 'fas fa-pause';
                    }).catch(() => {
                        console.log('Auto play blocked, waiting for user interaction');
                        document.addEventListener('click', function autoPlay() {
                            audioPlayer.play().then(() => {
                                isPlaying = true;
                                playPauseIcon.className = 'fas fa-pause';
                            }).catch(() => {});
                            document.removeEventListener('click', autoPlay);
                        }, { once: true });
                    });
                }, 500);
                
            } else {
                document.getElementById('totalTime').textContent = data.music.duration || '3:50';
            }
            
            if (data.music.timeSync && data.music.timeSync.length > 0) {
                const initialLyric = data.music.timeSync[0].text;
                document.getElementById('lyrics').textContent = initialLyric;
            }
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('profileName').textContent = 'Your Name';
        document.getElementById('profileBio').textContent = 'Welcome to my page';
    }
}

function updateLyricsDisplay(time) {
    if (!userData || !userData.music || !userData.music.timeSync) return;
    
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
        document.getElementById('lyrics').textContent = currentLyric.text;
    }
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function togglePlayPause() {
    if (!audioPlayer || !audioPlayer.src) return;
    
    isPlaying = !isPlaying;
    
    if (isPlaying) {
        playPauseIcon.className = 'fas fa-pause';
        audioPlayer.play();
    } else {
        playPauseIcon.className = 'fas fa-play';
        audioPlayer.pause();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadData();
    
    playPauseBtn = document.getElementById('playPauseBtn');
    playPauseBtn.addEventListener('click', togglePlayPause);
    
    document.querySelector('.progress-container').addEventListener('click', function(e) {
        if (!audioPlayer || !audioPlayer.src) return;
        
        const rect = this.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const duration = audioPlayer.duration || 228;
        audioPlayer.currentTime = percent * duration;
    });
});