// ============================================
// AUDIO MANAGER
// Handles background audio for all pages with continuous playback
// ============================================

(function() {
    // Detect current page type
    const currentPath = window.location.pathname;
    const isVideoPlayer = currentPath.includes('videoplayer.html');
    const isEndingPage = currentPath.includes('/ending/') || 
                         currentPath.includes('badending.html') || 
                         currentPath.includes('goodending.html') || 
                         currentPath.includes('trueending.html') || 
                         currentPath.includes('secondchanceending.html');
    
    // Pages where background music should NOT play
    const shouldStopMusic = isVideoPlayer || isEndingPage;

    // TV click sound (one-time)
    const tvSound = new Audio('/audio/old-tv-click.m4a');
    tvSound.volume = 1.0;

    // VHS noise (continuous on non-video pages)
    const vhsNoise = new Audio('/audio/810227__jaeblo__vhs-style-noise.wav');
    vhsNoise.volume = isVideoPlayer ? 0 : 0.2;
    vhsNoise.loop = true;

    // Background music - continuous across pages
    let backgroundMusic = null;
    const MUSIC_KEY = 'bgMusicTime';
    const MUSIC_PLAYING_KEY = 'bgMusicPlaying';
    const SESSION_ID_KEY = 'audioSessionId';
    
    // Create or retrieve session ID
    if (!sessionStorage.getItem(SESSION_ID_KEY)) {
        sessionStorage.setItem(SESSION_ID_KEY, Date.now().toString());
    }

    // Initialize background music
    function initBackgroundMusic() {
        if (!backgroundMusic) {
            backgroundMusic = new Audio('/audio/NoCopyright Tense Cinematic Background Music - Anxiety by soundridemusic.mp3');
            backgroundMusic.volume = 0.3;
            backgroundMusic.loop = true;
            
            // Update playback position in storage periodically
            backgroundMusic.addEventListener('timeupdate', function() {
                if (!backgroundMusic.paused) {
                    sessionStorage.setItem(MUSIC_KEY, backgroundMusic.currentTime.toString());
                }
            });
        }
        return backgroundMusic;
    }

    // Play sounds when page loads
    window.addEventListener('DOMContentLoaded', function() {
        // Unified interaction handler for all audio
        function playAllAudio() {
            tvSound.play().catch(e => console.log('TV sound play failed:', e));
            vhsNoise.play().catch(e => console.log('VHS noise play failed:', e));
            
            if (!shouldStopMusic) {
                const music = initBackgroundMusic();
                const savedTime = parseFloat(sessionStorage.getItem(MUSIC_KEY)) || 0;
                if (savedTime > 0) {
                    music.currentTime = savedTime;
                }
                music.play().then(function() {
                    sessionStorage.setItem(MUSIC_PLAYING_KEY, 'true');
                }).catch(e => console.log('Background music play failed:', e));
            }
        }

        // Try autoplay first
        tvSound.play().catch(function(error) {
            console.log('TV sound autoplay prevented:', error);
        });

        // Play VHS noise
        vhsNoise.play().catch(function(error) {
            console.log('VHS noise autoplay prevented:', error);
            
            // If autoplay is blocked, play on ANY user interaction
            const interactionEvents = ['click', 'touchstart', 'keydown'];
            function playOnInteraction() {
                playAllAudio();
                interactionEvents.forEach(event => {
                    document.removeEventListener(event, playOnInteraction);
                });
            }
            
            interactionEvents.forEach(event => {
                document.addEventListener(event, playOnInteraction, { once: true });
            });
        });

        // Background music logic
        if (shouldStopMusic) {
            // Stop music on videoplayer or ending pages
            sessionStorage.setItem(MUSIC_PLAYING_KEY, 'false');
            sessionStorage.removeItem(MUSIC_KEY);
            if (backgroundMusic) {
                backgroundMusic.pause();
            }
        } else {
            // Play/resume background music on other pages
            const music = initBackgroundMusic();
            const wasPlaying = sessionStorage.getItem(MUSIC_PLAYING_KEY) === 'true';
            const savedTime = parseFloat(sessionStorage.getItem(MUSIC_KEY)) || 0;
            
            // Resume from saved position
            if (savedTime > 0) {
                music.currentTime = savedTime;
            }
            
            // Start playing
            music.play().then(function() {
                sessionStorage.setItem(MUSIC_PLAYING_KEY, 'true');
            }).catch(function(error) {
                console.log('Background music autoplay prevented:', error);
                // Already handled by unified interaction handler above
            });
        }
    });

    // Save state before page unload
    window.addEventListener('beforeunload', function() {
        // Save current music state
        if (backgroundMusic && !backgroundMusic.paused) {
            sessionStorage.setItem(MUSIC_KEY, backgroundMusic.currentTime.toString());
            sessionStorage.setItem(MUSIC_PLAYING_KEY, 'true');
        }
        
        // Fade out VHS noise
        let fadeOut = setInterval(function() {
            if (vhsNoise.volume > 0.1) {
                vhsNoise.volume -= 0.1;
            } else {
                clearInterval(fadeOut);
                vhsNoise.pause();
            }
        }, 50);
    });

    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', function() {
        if (backgroundMusic) {
            if (document.hidden) {
                // Save position when tab is hidden
                if (!backgroundMusic.paused) {
                    sessionStorage.setItem(MUSIC_KEY, backgroundMusic.currentTime.toString());
                }
            } else {
                // Resume when tab becomes visible (if not on excluded pages)
                if (!shouldStopMusic && sessionStorage.getItem(MUSIC_PLAYING_KEY) === 'true') {
                    const savedTime = parseFloat(sessionStorage.getItem(MUSIC_KEY)) || 0;
                    if (savedTime > 0) {
                        backgroundMusic.currentTime = savedTime;
                    }
                    backgroundMusic.play().catch(function(error) {
                        console.log('Resume music failed:', error);
                    });
                }
            }
        }
    });
})();
