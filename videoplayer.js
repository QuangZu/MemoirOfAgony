// ============================================
// VIDEO CONFIGURATION
// ============================================

const CONFIG = {
    CHOICE_TIMER: 10,
    
    // Intro videos
    INTRO: [
        'https://res.cloudinary.com/dxg8llcr2/video/upload/v1763833271/2_3_4_kywdfr.mp4'
    ],
    
    // Branching scenarios
    SCENARIOS: {
        choicePoint: {
            video: 'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764331435/6_7_8_dialogue_gs6zlc.mp4',
            buttons: { left: 'Apply', right: 'Go Home' },
            next: { left: 'applyPath', right: 'goHomePath' }
        },
        applyPath: {
            videos: [
                'https://res.cloudinary.com/dxg8llcr2/video/upload/v1763833277/9_10_11_t13qdx.mp4'
            ],
            afterSequence: 'applyChoice'
        },
        goHomePath: {
            videos: [
                'https://res.cloudinary.com/dxg8llcr2/video/upload/v1763880053/Minhvenha_rlfkay.mp4',
            ],
            afterSequence: 'offerChoice'
        },
        applyChoice: {
            video: 'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764331434/nop_ho_chieu_dialogue_dm8uyz.mp4',
            buttons: { left: 'Disagree', right: 'Agree' },
            next: { left: 'offerChoice', right: 'pvanChoice' },
        },
        pvanChoice: {
            video: 'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764331436/19_-_24_minh_pvan_dialogue_konimp.mp4',
            buttons: { left: 'Disagree', right: 'Agree' },
            next: { left: 'badending', right: 'secondchanceending' }    
        },
        badending: {
            videos: [
                'https://res.cloudinary.com/dxg8llcr2/video/upload/v1763876934/minh_bi_bat_coc_mncbhh.mp4'
            ]
        },
        secondchanceending: {
            videos: [
                'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764331437/Minh_ke_chuyen_pvan_Kien_bao_Minh_di_can_than_dialogue_loerj3.mp4'
            ]
        },
        offerChoice: {
            video: 'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764331434/minh_ve_nha_kien_offer_viec_dialogue_izqz3g.mp4',
            buttons: { left: 'Agree', right: 'Disagree' },
            next: { left: 'agreeOffer', right: 'disagreeOffer' }
        },
        agreeOffer: {
            videos:
                'https://res.cloudinary.com/dxg8llcr2/video/upload/v1764331435/minh_dong_y_offer_cua_kien_dialogue_iasb6v.mp4',
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
                'https://res.cloudinary.com/dxg8llcr2/video/upload/v1763833272/minh_bao_casat_zun6t1.mp4'
            ]
        },
        makeOffer: {
            videos: [
                'https://res.cloudinary.com/dxg8llcr2/video/upload/v1763894479/minh_lam_viec_kien_offer_bkknra.mp4'
            ]
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

let state = {
    intro: { index: 0, playing: true },
    sequence: { index: 0, videos: null },
    scenario: null,
    timer: null
};

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
    
    // Unmute for specific interview videos
    if (url === 'https://res.cloudinary.com/dxg8llcr2/video/upload/v1763876932/19_-_24_minh_phong_van_tgfjqu.mp4' || 
        url === 'https://res.cloudinary.com/dxg8llcr2/video/upload/v1763833273/minh_ve_nha_nch_voi_kien_xin_viec_lam_kien_offer_viec_fcvugd.mp4') {
        video.muted = false;
    } else {
        video.muted = true;
    }
    
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
            const s = CONFIG.SCENARIOS[state.scenario];
            state.sequence.videos = null;
            if (s && s.afterSequence) {
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
            // Sequence finished - check if there's a next scenario
            const s = CONFIG.SCENARIOS[state.scenario];
            state.sequence.videos = null;
            
            if (s.afterSequence) {
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
