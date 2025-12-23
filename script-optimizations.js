// ============================================================================
// JAVASCRIPT PERFORMANCE OPTIMIZATIONS
// Paste these modifications into script.js to reduce main-thread work
// ============================================================================

/* OPTIMIZATION 1: DISABLE PARTICLE SYSTEM
   Replace the initParticles function with this lightweight version */

const initParticles = () => {
    // Disabled for performance - particles moved to pure CSS
    // See performance-optimizations.css for .hero-bg::after
    return;
};

/* OPTIMIZATION 2: DEBOUNCE RESIZE EVENTS
   Add this helper function at the top of script.js */

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/* OPTIMIZATION 3: OPTIMIZE SECTION CACHE REBUILD
   Wrap rebuildSectionCache with debounce */

// Change this:
// window.addEventListener('resize', rebuildSectionCache);

// To this:
window.addEventListener('resize', debounce(rebuildSectionCache, 250), { passive: true });

/* OPTIMIZATION 4: REDUCE FAQ ANIMATION COMPLEXITY
   Replace initFAQ function with simplified version */

const initFAQ = () => {
    const faqBlocks = document.querySelectorAll('.faq-block');
    
    faqBlocks.forEach(block => {
        const summary = block.querySelector('summary');
        
        if (!summary) return;
        
        // Simple toggle without heavy animations
        block.addEventListener('toggle', () => {
            summary.setAttribute('aria-expanded', block.hasAttribute('open') ? 'true' : 'false');
        });
        
        // Set initial aria state
        summary.setAttribute('aria-expanded', block.hasAttribute('open') ? 'true' : 'false');
    });
};

/* OPTIMIZATION 5: LAZY LOAD INTERSECTION OBSERVER
   Only observe elements when they're near viewport */

const createLazyObserver = (callback, options = {}) => {
    const defaultOptions = {
        rootMargin: '50px',
        threshold: 0.01
    };
    return new IntersectionObserver(callback, { ...defaultOptions, ...options });
};

/* OPTIMIZATION 6: BATCH DOM READS/WRITES
   Separate read and write phases */

const batchedLayoutReads = new Map();
const batchedLayoutWrites = new Map();

function scheduleRead(key, readFn) {
    batchedLayoutReads.set(key, readFn);
    requestAnimationFrame(() => {
        const fn = batchedLayoutReads.get(key);
        if (fn) {
            fn();
            batchedLayoutReads.delete(key);
        }
    });
}

function scheduleWrite(key, writeFn) {
    batchedLayoutWrites.set(key, writeFn);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => { // Double RAF for write
            const fn = batchedLayoutWrites.get(key);
            if (fn) {
                fn();
                batchedLayoutWrites.delete(key);
            }
        });
    });
}

/* OPTIMIZATION 7: SIMPLIFY SCROLL HANDLER
   Remove unnecessary DOM reads */

const handleScroll = () => {
    const currentScrollY = window.scrollY;
    
    // 1. Update Header Scroll State (use threshold only)
    if (DOM.header) {
        scheduleWrite('header-scroll', () => {
            if (currentScrollY > 50) {
                DOM.header.classList.add('scrolled');
            } else {
                DOM.header.classList.remove('scrolled');
            }
        });
    }
    
    scrollTicking = false;
};

/* OPTIMIZATION 8: DISABLE SMOOTH SCROLL FOR PERFORMANCE
   Use instant scroll instead */

// Replace smooth scroll with instant:
/*
window.scrollTo({
    top: offsetPosition,
    behavior: 'instant' // Changed from 'smooth'
});
*/

/* OPTIMIZATION 9: USE PASSIVE EVENT LISTENERS
   Add { passive: true } to all scroll/touch listeners */

// Examples:
window.addEventListener('scroll', handleScroll, { passive: true });
window.addEventListener('touchstart', handleTouch, { passive: true });
window.addEventListener('touchmove', handleTouch, { passive: true });

/* OPTIMIZATION 10: DEFER NON-CRITICAL INITIALIZATIONS
   Move heavy initialization to idle callback */

if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
        initFAQ();
        // Other non-critical inits
    }, { timeout: 2000 });
} else {
    setTimeout(() => {
        initFAQ();
    }, 1000);
}

/* OPTIMIZATION 11: REDUCE TRANSLATION WORKLOAD
   Cache translated elements */

let translatedElements = new WeakMap();

function optimizedTranslate(element, key) {
    if (!translatedElements.has(element)) {
        translatedElements.set(element, key);
    }
    // Actual translation logic
}

/* OPTIMIZATION 12: OPTIMIZE IMAGE LOADING
   Add intersection observer for lazy images */

const lazyImageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                lazyImageObserver.unobserve(img);
            }
        }
    });
}, { rootMargin: '50px' });

// Usage: document.querySelectorAll('img[data-src]').forEach(img => lazyImageObserver.observe(img));

/* OPTIMIZATION 13: MINIMIZE LAYOUT THRASHING
   Cache element dimensions */

const elementCache = new Map();

function getCachedDimensions(element, force = false) {
    if (!force && elementCache.has(element)) {
        return elementCache.get(element);
    }
    
    const rect = element.getBoundingClientRect();
    const dimensions = {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
    };
    
    elementCache.set(element, dimensions);
    return dimensions;
}

// Clear cache on resize
window.addEventListener('resize', debounce(() => {
    elementCache.clear();
}, 250));

/* OPTIMIZATION 14: REDUCE ANIMATION FRAME CALLBACKS
   Consolidate multiple requestAnimationFrame calls */

const rafCallbacks = new Set();
let rafScheduled = false;

function addRAFCallback(callback) {
    rafCallbacks.add(callback);
    if (!rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(() => {
            rafCallbacks.forEach(cb => cb());
            rafCallbacks.clear();
            rafScheduled = false;
        });
    }
}

/* OPTIMIZATION 15: DISABLE ANIMATIONS ON LOW-END DEVICES
   Detect and disable for better performance */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isLowEndDevice = navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4;

if (prefersReducedMotion || isLowEndDevice) {
    document.documentElement.classList.add('reduce-animations');
    // Add CSS: .reduce-animations * { animation: none !important; transition: none !important; }
}

/* OPTIMIZATION 16: CONSOLIDATE EVENT LISTENERS
   Use event delegation instead of multiple listeners */

// Instead of adding listeners to each element:
// buttons.forEach(btn => btn.addEventListener('click', handler));

// Use delegation:
document.addEventListener('click', (e) => {
    if (e.target.matches('.button-selector')) {
        // Handle click
    }
});

/* OPTIMIZATION 17: VIRTUAL SCROLLING FOR FAQ
   Only render visible FAQ items (if list is very long) */

// For future: implement virtual scrolling if FAQ grows beyond 20 items

/* OPTIMIZATION 18: WEB WORKERS FOR HEAVY COMPUTATION
   Move translation loading to web worker if it becomes heavy */

// Example structure (implement if needed):
/*
const worker = new Worker('translation-worker.js');
worker.postMessage({ lang: 'en' });
worker.onmessage = (e) => {
    applyTranslations(e.data);
};
*/

/* OPTIMIZATION 19: COMPRESS AND SPLIT TRANSLATIONS
   Load only active language */

async function loadTranslation(lang) {
    // Instead of loading all translations, load only needed language
    const response = await fetch(`/translations/${lang}.json`);
    return await response.json();
}

/* OPTIMIZATION 20: MINIMIZE FORCED REFLOWS
   Avoid reading and writing to DOM in same frame */

// BAD:
// element.style.width = '100px';
// const width = element.offsetWidth; // Forces reflow!
// element.style.height = '100px';

// GOOD:
// Read phase
const width = element.offsetWidth;
// Write phase (in next frame)
requestAnimationFrame(() => {
    element.style.width = '100px';
    element.style.height = '100px';
});
