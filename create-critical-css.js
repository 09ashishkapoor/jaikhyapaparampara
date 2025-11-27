/**
 * Extract and inline critical CSS for above-the-fold content
 * This reduces render-blocking CSS
 */

const fs = require('fs');
const path = require('path');

// Critical CSS for hero section (above the fold)
const criticalCSS = `
:root {
    --primary-color: #8B2635;
    --primary-dark: #4A0E17;
    --secondary-color: #C9A962;
    --accent-color: #E8C468;
    --accent-bright: #F4E4C1;
    --dark-bg: #0D0506;
    --light-bg: #1F0B11;
    --card-bg: #180A0F;
    --text-dark: #F0DCC8;
    --text-light: #FFF8F0;
    --text-gold: #E8C468;
    --border-color: rgba(139, 38, 53, 0.5);
    --border-gold: rgba(232, 196, 104, 0.4);
    --shadow: rgba(0, 0, 0, 0.85);
    --shadow-colored: rgba(74, 14, 23, 0.7);
    --overlay-color: rgba(24, 10, 15, 0.96);
    --gold-gradient: linear-gradient(135deg, #B8935A 0%, #C9A962 25%, #E8C468 50%, #F4E4C1 60%, #E8C468 75%, #C9A962 90%, #B8935A 100%);
    --maroon-gradient: linear-gradient(135deg, #4A0E17 0%, #6B1825 25%, #8B2635 50%, #A23D4A 75%, #8B2635 100%);
    --temple-gradient: radial-gradient(ellipse at top, #2D0F18 0%, #1F0B11 45%, #0D0506 100%);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: 'Crimson Text', serif;
    line-height: 1.6;
    color: var(--text-dark);
    background-color: var(--light-bg);
    overflow-x: hidden;
}

.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

.header {
    background: linear-gradient(135deg, rgba(13, 5, 6, 0.96) 0%, rgba(31, 11, 17, 0.96) 100%);
    backdrop-filter: blur(20px) saturate(120%);
    padding: 1rem 0;
    position: sticky;
    top: 0;
    z-index: 1000;
    box-shadow: 0 4px 25px var(--shadow-colored), 0 0 20px rgba(232, 196, 104, 0.08);
    border-bottom: 1px solid var(--border-gold);
}

.nav { display: flex; justify-content: space-between; align-items: center; }

.logo h1 {
    font-family: 'Philosopher', sans-serif;
    color: var(--accent-color);
    font-size: 1.8rem;
    font-weight: 700;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.nav-menu { display: flex; list-style: none; gap: 2rem; }
.nav-menu a { color: var(--text-light); text-decoration: none; font-size: 1.1rem; font-weight: 600; transition: color 0.3s ease; }
.nav-menu a:hover { color: var(--accent-color); }

.hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6rem 0 8rem 0;
    text-align: center;
    overflow: hidden;
    color: var(--text-light);
}

.hero-content { position: relative; z-index: 2; max-width: 1000px; margin: 0 auto; padding: 0 1.5rem; }

.hero-title {
    font-family: 'Philosopher', sans-serif;
    font-size: 3rem;
    font-weight: 700;
    color: var(--accent-color);
    margin-bottom: 1.5rem;
    line-height: 1.2;
    text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
}

.hero-subtitle { font-size: 1.5rem; color: var(--text-light); margin-bottom: 1rem; line-height: 1.6; font-weight: 400; text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.6); }
.hero-author { font-size: 1.2rem; color: var(--accent-bright); margin-bottom: 2rem; font-style: italic; font-weight: 600; text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.6); }

.hero-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 130%;
    z-index: 1;
    background: var(--temple-gradient);
    will-change: transform;
    transform: translateZ(0);
}

html { scroll-behavior: smooth; }
::selection { background: var(--accent-color); color: var(--dark-bg); }
:focus-visible { outline: 2px solid var(--accent-color); outline-offset: 4px; }

@media (max-width: 768px) {
    .hero-title { font-size: 2rem; }
    .hero-subtitle { font-size: 1.2rem; }
    .logo h1 { font-size: 1.4rem; }
    .nav-menu { display: flex; gap: 1.5rem; }
}
`;

// Write critical CSS
fs.writeFileSync('critical.css', criticalCSS);
console.log('✨ Critical CSS created');

