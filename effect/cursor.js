// ============================================
// CUSTOM VHS CURSOR INITIALIZATION
// Automatically activates when cursor.css is included
// ============================================

(function() {
    'use strict';
    
    const customCursor = document.getElementById('customCursor');
    if (!customCursor) return; // Exit if cursor element doesn't exist
    
    let cursorX = 0;
    let cursorY = 0;
    let targetX = 0;
    let targetY = 0;
    
    // Update cursor position with smooth follow
    function updateCursorPosition() {
        cursorX += (targetX - cursorX) * 0.2;
        cursorY += (targetY - cursorY) * 0.2;
        
        customCursor.style.transform = `translate(${cursorX - 30}px, ${cursorY - 30}px)`;
        requestAnimationFrame(updateCursorPosition);
    }
    
    // Start animation loop
    updateCursorPosition();
    
    // Mouse move handler
    document.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        customCursor.classList.add('active');
    });
    
    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        customCursor.classList.remove('active');
    });
    
    // Show cursor when entering window
    document.addEventListener('mouseenter', () => {
        customCursor.classList.add('active');
    });
    
    // Optional: Add grabbing state for better interactivity
    document.addEventListener('mousedown', () => {
        customCursor.classList.add('grabbing');
    });
    
    document.addEventListener('mouseup', () => {
        customCursor.classList.remove('grabbing');
    });
    
    // Optional: Add hovering state for interactive elements
    const interactiveElements = document.querySelectorAll('a, button, [role="button"], input, textarea, select');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            customCursor.classList.add('hovering');
        });
        el.addEventListener('mouseleave', () => {
            customCursor.classList.remove('hovering');
        });
    });
})();
