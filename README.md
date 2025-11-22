# Scam Awareness Interactive Website

## Overview
Memoir of Agony is a single-page interactive web app with a retro TV aesthetic, designed to raise scam awareness. It features animated glitch effects, matrix backgrounds, VCR overlays, and branching video scenarios.

## Features
- **Matrix background**: Animated 80x50 character grid for a hacker vibe
- **Glitch title**: Multi-layered animated text effect
- **VCR effects**: Vignette, scanlines, noise, and snow overlays for CRT realism
- **Scene system**: Two main scenes—Start Screen and Video Player—with smooth TV turn-on transitions
- **Branching video scenarios**: Seven video paths with interactive choices
- **Timer bar**: Center-outward shrinking bar for choice timeouts
- **Responsive design**: Works on desktop and mobile

## Getting Started

### 1. Clone or Download
Clone this repository or download the ZIP and extract it.

```sh
git clone https://github.com/QuangZu/MemoirOfAgony.git
```

### 2. Folder Structure

```
MemoirOfAgony/
├── index.html              # Main start screen
├── about.html              # About page
├── credits.html            # Credits page
├── videoplayer.html        # Interactive video player
├── glitch.css              # Glitch text effect
├── hover_letter.css        # Letter hover effect
├── vcr.css                 # VCR/CRT effects
├── vcr.js                  # VCR noise logic
├── video/                  # Video files (Shot no.1.mp4 ... Shot no.7.mp4)
├── audio/                  # (Optional) Sound effects/music
└── ...
```

### 3. Running Locally
No build step required. Just open `index.html` in your browser:

1. Double-click `index.html` (Windows) or open with your browser.
2. For full experience, use a local server (recommended for video/audio):
   - **Python**: `python -m http.server`
   - **VS Code Live Server**: Install extension, right-click `index.html` → "Open with Live Server"

### 4. Navigation
- Start at `index.html` (scene 1)
- Click "Apply" to enter the video scenario (scene 2)
- Make choices as prompted; videos branch based on your selection
- Use browser navigation to visit `about.html` or `credits.html`

### 5. Adding/Editing Videos
- Place your MP4 files in the `video/` folder
- Update video paths and branching logic in `videoplayer.html` and `script.js` as needed

### 6. Customizing Effects
- **Glitch/VCR effects**: Edit `glitch.css`, `hover_letter.css`, `vcr.css` for style changes
- **Matrix background**: Controlled via JS in `script.js`
- **Sound effects/music**: Add files to `audio/` and use `<audio>` tags or JS Audio API (see comments in `script.js`)

## Development Notes
- All effects are pure HTML/CSS/JS—no frameworks required
- SCSS source files are provided for reference; only CSS is used in production
- VCR overlays use `pointer-events: none` to ensure buttons remain clickable
- Responsive design adapts for screens <768px

## Credits
- CRT image: [CodePen CDN](https://s3-us-west-2.amazonaws.com/s.cdpn.io/86186/crt.png)
- Video samples: Google GTV sample videos
- Glitch/matrix/VCR effect code: Custom, inspired by CodePen and open-source demos
