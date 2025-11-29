// ============================================
// AUDIO MANAGER
// Handles background audio for all pages
// ============================================

(function() {
    const tvSound = new Audio('audio/old-tv-click.m4a');
    tvSound.volume = 1.0;

    const vhsNoise = new Audio('audio/810227__jaeblo__vhs-style-noise.wav');
    
    // Check if we're on videoplayer.html - set volume to 0, otherwise 0.2
    const isVideoPlayer = window.location.pathname.includes('videoplayer.html');
    vhsNoise.volume = isVideoPlayer ? 0 : 0.2;
    vhsNoise.loop = true;

    // Add fwng.wav sound for videoplayer.html with 50% volume
    const fwngSound = new Audio('audio/fwng.wav');
    fwngSound.volume = 0.5;
    fwngSound.loop = true;

    // Play sounds when page loads
    window.addEventListener('DOMContentLoaded', function() {
        tvSound.play().catch(function(error) {
            console.log('TV sound autoplay prevented:', error);
        });

        // Play VHS noise immediately
        vhsNoise.play().catch(function(error) {
            console.log('VHS noise autoplay prevented:', error);
            
            // If autoplay is blocked, try to play on first user interaction
            document.body.addEventListener('click', function playOnInteraction() {
                vhsNoise.play();
                document.body.removeEventListener('click', playOnInteraction);
            }, { once: true });
        });

        // Play fwng.wav only on videoplayer.html
        if (isVideoPlayer) {
            fwngSound.play().catch(function(error) {
                console.log('fwng sound autoplay prevented:', error);
                
                // If autoplay is blocked, try to play on first user interaction
                document.body.addEventListener('click', function playFwngOnInteraction() {
                    fwngSound.play();
                    document.body.removeEventListener('click', playFwngOnInteraction);
                }, { once: true });
            });
        }
    });

    // Ensure VHS noise continues playing when navigating between pages
    window.addEventListener('beforeunload', function() {
        // Fade out audio before page unload
        let fadeOut = setInterval(function() {
            if (vhsNoise.volume > 0.1) {
                vhsNoise.volume -= 0.1;
            } else {
                clearInterval(fadeOut);
                vhsNoise.pause();
            }
        }, 50);

        if (isVideoPlayer && fwngSound) {
            fwngSound.pause();
        }
    });
})();
