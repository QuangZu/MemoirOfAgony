// ============================================
// AUDIO MANAGER
// Handles background audio for all pages
// ============================================

(function() {
    const tvSound = new Audio('audio/old-tv-click.m4a');
    tvSound.volume = 1.0;

    const vhsNoise = new Audio('audio/810227__jaeblo__vhs-style-noise.wav');
    vhsNoise.volume = 0.2;
    vhsNoise.loop = true;

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
    });
})();
