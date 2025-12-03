// ============================================
// SHARED ENDING SCREEN LOGIC
// ============================================

/**
 * Initialize ending screen with glitch title
 * @param {string} titleText - The text to display (e.g., "BAD ENDING")
 */
function initializeEnding(titleText) {
    // Populate all 9 glitch lines with the same content
    for (let i = 1; i <= 9; i++) {
        const titleElement = document.getElementById(i === 1 ? 'endingTitle' : `endingTitle${i}`);
        
        titleText.split('').forEach(char => {
            const span = document.createElement('span');
            span.className = 'letter';
            span.textContent = char === ' ' ? '\u00A0' : char;
            titleElement.appendChild(span);
        });
    }

    // Setup menu button navigation
    const menuBtn = document.getElementById('menuBtn');
    menuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '../index.html';
    });
}
