// ============================================
// VIDEO CONFIGURATION
// ============================================

const CONFIG = {
    CHOICE_TIMER: 10,
    
    // Intro videos
    INTRO: [
        'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764722652/234_knjuxb.mp4'
    ],
    
    // Subtitle mapping (maps video URLs to subtitle base names)
    SUBTITLES: {
        'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764722652/234_knjuxb.mp4': 'intro',
        'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764722658/678_ffysld.mp4': 'choicepoint',
        'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764722653/co_nop_ho_chieu_ko_nbillj.mp4': 'nop_ho_chieu',
        'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764722654/minh_ve_nha_nch_vs_kien_offer_viec_shdlhf.mp4': 'minh_ve_nha',
        'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764722654/minh_ke_chuyen_pvan_kien_khuyen_di_can_than_iez28d.mp4': 'Minh_ke_chuyen_pvan',
        'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764722654/1924_minh_pvan_vy2ywz.mp4': 'pvan',
        'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764722657/minh_dy_viec_kien_azzcsi.mp4': 'minh_dong_y_offer'
    },
    
    // Branching scenarios
    SCENARIOS: {
        choicePoint: {
            video: 'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764722658/678_ffysld.mp4',
            buttons: { left: 'Apply', right: 'Go Home' },
            next: { left: 'applyPath', right: 'goHomePath' }
        },
        applyPath: {
            videos: [
                'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764722656/91011_xupmqx.mp4'
            ],
            afterSequence: 'applyChoice'
        },
        goHomePath: {
            videos: [
                'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764722657/minh_di_ve_emcpdl.mp4',
            ],
            afterSequence: 'offerChoice'
        },
        applyChoice: {
            video: 'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764722653/co_nop_ho_chieu_ko_nbillj.mp4',
            buttons: { left: 'Disagree', right: 'Agree' },
            next: { left: 'offerChoice', right: 'pvanChoice' },
        },
        pvanChoice: {
            video: 'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764722654/1924_minh_pvan_vy2ywz.mp4',
            buttons: { left: 'Disagree', right: 'Agree' },
            next: { left: 'badending', right: 'secondchanceending' }    
        },
        badending: {
            videos: [
                'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764722657/minh_bi_bat_coc_bad_ending_jc2ssk.mp4'
            ],
            endingPage: 'ending/badending.html'
        },
        secondchanceending: {
            videos: [
                'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764722654/minh_ke_chuyen_pvan_kien_khuyen_di_can_than_iez28d.mp4'
            ],
            endingPage: 'ending/secondchanceending.html'
        },
        offerChoice: {
            video: 'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764722654/minh_ve_nha_nch_vs_kien_offer_viec_shdlhf.mp4',
            buttons: { left: 'Agree', right: 'Disagree' },
            next: { left: 'agreeOffer', right: 'disagreeOffer' }
        },
        agreeOffer: {
            videos:
                'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764722657/minh_dy_viec_kien_azzcsi.mp4',
            buttons: { left: 'Call Police', right: 'Make Offer' },
            next: { left: 'callPolice', right: 'makeOffer' }
        },
        disagreeOffer: {
            videos: [
                'https://res.cloudinary.com/dxg8llcr2/video/upload/v1763876932/minh_tu_choi_offer_cua_kien_uxjvnd.mp4'
            ],
            afterSequence: 'pvanChoice'
        },
        callPolice: {
            videos: [
                'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764722652/minh_bao_csat_x9tz9n.mp4'
            ],
            endingPage: 'ending/trueending.html'
        },
        makeOffer: {
            videos: [
                'https://res.cloudinary.com/dxg8llcr2/video/upload/v1763894479/minh_lam_viec_kien_offer_bkknra.mp4'
            ],
            endingPage: 'ending/goodending.html'
        }
    }
};

// ============================================
// PLAYER LOGIC
// ============================================

const video = document.getElementById('mainVideo');
const choiceContainer = document.getElementById('choiceContainer');
const timerContainer = document.getElementById('timerContainer');
const timerCenter = document.getElementById('timerCenter');
const choiceA = document.getElementById('choiceA');
const choiceB = document.getElementById('choiceB');
const backBtn = document.getElementById('backBtn');
const skipBtn = document.getElementById('skipBtn');

// Subtitle tracks
const trackVi = document.getElementById('track-vi');
const trackEn = document.getElementById('track-en');

let state = {
    intro: { index: 0, playing: true },
    sequence: { index: 0, videos: null },
    scenario: null,
    timer: null
};

// ============================================
// SUBTITLE MANAGEMENT
// ============================================

/**
 * Update subtitle tracks based on current video URL
 * @param {string} url - Current video URL
 */
function updateSubtitles(url) {
    const subtitleBase = CONFIG.SUBTITLES[url];
    
    if (subtitleBase) {
        // Try to load subtitles with language suffixes first
        const viPath = `subtitle/${subtitleBase}-vi.vtt`;
        const enPath = `subtitle/${subtitleBase}-en.vtt`;
        const singlePath = `subtitle/${subtitleBase}.vtt`;
        
        // Check if we have language-specific files or a single file
        // For now, we'll try both patterns - the browser will handle 404s gracefully
        trackVi.src = viPath;
        trackEn.src = enPath;
        
        // If no language-specific files exist, use the single file for both tracks
        // This allows backwards compatibility with single subtitle files
        trackVi.onerror = () => {
            trackVi.src = singlePath;
            trackVi.onerror = null;
        };
        trackEn.onerror = () => {
            trackEn.src = singlePath;
            trackEn.onerror = null;
        };
        
        // Force reload of tracks
        const textTracks = video.textTracks;
        for (let i = 0; i < textTracks.length; i++) {
            textTracks[i].mode = 'showing';
        }
    } else {
        // No subtitles available for this video
        trackVi.src = '';
        trackEn.src = '';
    }
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Play a video from URL
 * @param {string} url - Video URL to play
 */
function play(url) {
    // Stop current video first
    video.pause();
    video.currentTime = 0;
    
    video.src = url;
    
    // Update subtitles for the new video
    updateSubtitles(url);
    
    // Enable sound for all videos
    video.muted = false;
    
    // Load and play when ready
    video.load();
    
    // Use canplay event instead of loadeddata for faster start
    const playHandler = () => {
        video.play()
            .catch(e => console.error('Play failed:', e));
        video.removeEventListener('canplay', playHandler);
    };
    
    video.addEventListener('canplay', playHandler);
}

/**
 * Load a scenario by key
 * @param {string} key - Scenario key from CONFIG.SCENARIOS
 */
function loadScenario(key) {
    const s = CONFIG.SCENARIOS[key];
    if (!s) return;

    state.scenario = key;
    state.intro.playing = false;

    if (s.buttons) {
        choiceA.textContent = s.buttons.left;
        choiceB.textContent = s.buttons.right;
        choiceA.dataset.next = s.next.left;
        choiceB.dataset.next = s.next.right;
    }

    if (s.videos && s.videos.length > 0) {
        state.sequence = { index: 0, videos: s.videos };
        play(s.videos[0]);
    } else if (s.video && s.video !== '') {
        state.sequence = { index: 0, videos: null };
        play(s.video);
    } else {
        // No video to play, show choices immediately
        state.sequence = { index: 0, videos: null };
        showChoices();
    }
}

/**
 * Show choice buttons with timer
 */
function showChoices() {
    choiceContainer.classList.add('visible');
    timerContainer.classList.add('active');
    timerCenter.style.setProperty('--timer-duration', `${CONFIG.CHOICE_TIMER}s`);
    timerCenter.classList.add('animating');

    state.timer = setTimeout(() => {
        handleChoice(Math.random() > 0.5 ? choiceA.dataset.next : choiceB.dataset.next);
    }, CONFIG.CHOICE_TIMER * 1000);
}

/**
 * Hide choice buttons and timer
 */
function hideChoices() {
    choiceContainer.classList.remove('visible');
    timerContainer.classList.remove('active');
    timerCenter.classList.remove('animating');
    if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
    }
}

/**
 * Handle user choice selection
 * @param {string} next - Next scenario key
 */
function handleChoice(next) {
    hideChoices();
    if (next) loadScenario(next);
}

/**
 * Skip current video and advance to next
 */
function skipCurrent() {
    // Stop playback and any timers
    try { video.pause(); } catch (e) {}
    hideChoices();

    // Reuse the same logic as the 'ended' handler to advance
    if (state.intro.playing) {
        state.intro.index++;
        if (state.intro.index < CONFIG.INTRO.length) {
            play(CONFIG.INTRO[state.intro.index]);
        } else {
            loadScenario('choicePoint');
        }
        return;
    }

    if (state.sequence.videos) {
        state.sequence.index++;
        if (state.sequence.index < state.sequence.videos.length) {
            play(state.sequence.videos[state.sequence.index]);
        } else {
            // Sequence finished - check if there's a next scenario or ending page
            const s = CONFIG.SCENARIOS[state.scenario];
            state.sequence.videos = null;
            
            if (s && s.endingPage) {
                // Redirect to ending page
                window.location.href = s.endingPage;
            } else if (s && s.afterSequence) {
                loadScenario(s.afterSequence);
            } else if (s && s.next) {
                showChoices();
            }
        }
        return;
    }

    const s = CONFIG.SCENARIOS[state.scenario];
    if (s && s.next) showChoices();
}

// ============================================
// EVENT LISTENERS
// ============================================

// Video ended event
video.addEventListener('ended', () => {
    if (state.intro.playing) {
        state.intro.index++;
        if (state.intro.index < CONFIG.INTRO.length) {
            play(CONFIG.INTRO[state.intro.index]);
        } else {
            loadScenario('choicePoint');
        }
    } else if (state.sequence.videos) {
        state.sequence.index++;
        if (state.sequence.index < state.sequence.videos.length) {
            play(state.sequence.videos[state.sequence.index]);
        } else {
            // Sequence finished - check if there's a next scenario or ending page
            const s = CONFIG.SCENARIOS[state.scenario];
            state.sequence.videos = null;
            
            if (s.endingPage) {
                // Redirect to ending page
                window.location.href = s.endingPage;
            } else if (s.afterSequence) {
                loadScenario(s.afterSequence);
            } else if (s.next) {
                showChoices();
            }
        }
    } else {
        const s = CONFIG.SCENARIOS[state.scenario];
        if (s && s.next) showChoices();
    }
});

// Choice button clicks
choiceA.addEventListener('click', () => handleChoice(choiceA.dataset.next));
choiceB.addEventListener('click', () => handleChoice(choiceB.dataset.next));

// Skip button click
skipBtn.addEventListener('click', skipCurrent);

// Back button click
backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    video.pause();
    hideChoices();
    window.location.href = 'intro.html';
});

// ============================================
// INITIALIZE
// ============================================

// Start playing the first intro video
play(CONFIG.INTRO[0]);
