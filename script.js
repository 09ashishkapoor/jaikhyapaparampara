// ===== DOM CACHE =====
const DOM = {
    header: null,
    navLinks: null,
    sections: null,
    init() {
        this.header = document.querySelector('.header');
        this.navLinks = document.querySelectorAll('.nav-menu a');
        this.sections = document.querySelectorAll('section[id]');
    }
};

// Smooth scroll behavior for navigation links with offset for sticky header
// Optimized to batch DOM reads to prevent forced reflows
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').slice(1);
        const target = document.getElementById(targetId);
        
        if (target) {
            const headerOffset = 80; // Height of sticky header
            let offsetPosition;

            // Try to use cached position if available to avoid getBoundingClientRect()
            const cachedSection = sectionDataCache.find(s => s.id === targetId);
            
            if (cachedSection && sectionCacheValid) {
                offsetPosition = cachedSection.top - headerOffset;
            } else {
                // Fallback to live measurement if cache is invalid
                const elementPosition = target.getBoundingClientRect().top;
                const pageYOffset = window.pageYOffset;
                offsetPosition = elementPosition + pageYOffset - headerOffset;
            }

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Consolidated scroll handler to batch DOM reads and writes
let scrollTicking = false;

const handleScroll = () => {
    const currentScrollY = window.scrollY;
    
    // 1. Update Header Scroll State
    if (DOM.header) {
        if (currentScrollY > 50) {
            DOM.header.classList.add('scrolled');
        } else {
            DOM.header.classList.remove('scrolled');
        }
    }
    
    // 2. Update Active Nav
    updateActiveNav(currentScrollY);
    
    scrollTicking = false;
};

window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        requestAnimationFrame(handleScroll);
        scrollTicking = true;
    }
}, { passive: true });

// Use Intersection Observer for nav highlighting to avoid forced reflows
const navObserverOptions = {
    threshold: 0.5,
    rootMargin: '-80px 0px -50% 0px'
};

const navObserver = new IntersectionObserver((entries) => {
    if (!DOM.navLinks) DOM.navLinks = document.querySelectorAll('.nav-menu a');
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            DOM.navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href').slice(1) === entry.target.id) {
                    link.classList.add('active');
                }
            });
        }
    });
}, navObserverOptions);

DOM.sections = document.querySelectorAll('section[id]');
DOM.sections.forEach(section => navObserver.observe(section));

// Cache section layout data to prevent forced reflows during scroll
let sectionDataCache = [];
let sectionCacheValid = false;

// Rebuild section cache when DOM changes
function rebuildSectionCache() {
    if (!DOM.sections) DOM.sections = document.querySelectorAll('section[id]');
    // Batch all DOM reads together - NOT on scroll path
    sectionDataCache = Array.from(DOM.sections).map(section => ({
        id: section.id,
        top: section.offsetTop,
        height: section.offsetHeight
    }));
    sectionCacheValid = true;
}

// Function to update active nav link based on current scroll position
// Uses cached layout data to prevent forced reflows
function updateActiveNav(scrollY) {
    // Only read DOM once for this function call
    if (!sectionCacheValid) {
        rebuildSectionCache();
    }
    
    if (!DOM.navLinks) DOM.navLinks = document.querySelectorAll('.nav-menu a');
    let currentSectionId = null;
    const scrollPosition = (typeof scrollY === 'number' ? scrollY : window.scrollY) + 100; // Account for header height
    
    // Find current section from cached data (no DOM reads here)
    for (const section of sectionDataCache) {
        if (scrollPosition >= section.top && scrollPosition < section.top + section.height) {
            currentSectionId = section.id;
            break;
        }
    }
    
    // Batch all DOM writes together
    DOM.navLinks.forEach(link => {
        const href = link.getAttribute('href').slice(1);
        if (currentSectionId && href === currentSectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Enhanced Scroll Reveal Animation with performance optimization
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    // Use requestAnimationFrame to batch visual updates
    requestAnimationFrame(() => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    });
}, observerOptions);

// Initialize Features
document.addEventListener('DOMContentLoaded', () => {
    // PERFORMANCE: Minimize critical path - only do essential work here
    
    // 0. Initialize DOM Cache
    DOM.init();

    // 1. Defer section cache - not needed until user scrolls
    requestAnimationFrame(() => {
        rebuildSectionCache();
    });
    
    // 2. Defer Scroll Observer - only observe above-fold elements initially
    requestAnimationFrame(() => {
        const revealElements = document.querySelectorAll('.hero-content');
        revealElements.forEach(el => {
            el.classList.add('reveal');
            observer.observe(el);
        });
        
        // Observe other elements after a delay
        setTimeout(() => {
            const otherElements = document.querySelectorAll('.book-card, .section-title, .about-content');
            otherElements.forEach(el => {
                el.classList.add('reveal');
                observer.observe(el);
            });
        }, 500);
    });
    
    // 4. Mobile menu controls
    createMobileMenu();

    // Use requestIdleCallback for non-critical initializations to minimize main-thread work
    const idleInit = () => {
        // 5. Initialize Parallax Effect (disabled for CLS)
        initParallax();

        // 6. Initialize Audio (defer - not needed immediately)
        initAudio();

        // 8. Initialize Particle Effect (disabled for performance)
        initParticles();
        
        // 9. Initialize FAQ Accordion (defer - below fold)
        initFAQ();
    };

    if ('requestIdleCallback' in window) {
        requestIdleCallback(idleInit, { timeout: 3000 });
    } else {
        setTimeout(idleInit, 1000); // Increased timeout to further defer
    }
    
    // 10. Set initial active nav state
    updateActiveNav();
    
    // 11. Listen for content changes that might affect section positions
    // Debounced to prevent multiple reflows during rapid changes
    let rebuildTimeout;
    const resizeObserver = new ResizeObserver(() => {
        clearTimeout(rebuildTimeout);
        rebuildTimeout = setTimeout(() => {
            requestAnimationFrame(rebuildSectionCache);
        }, 200);
    });
    
    if (DOM.sections) {
        DOM.sections.forEach(section => {
            resizeObserver.observe(section);
        });
    }
});

// --- Audio Logic ---
const initAudio = () => {
    const audioBtn = document.getElementById('audio-toggle');
    const audio = document.getElementById('temple-audio');
    if (!audioBtn || !audio) return;

    const updateAudioButton = (isPlaying) => {
        audioBtn.classList.toggle('playing', isPlaying);
        audioBtn.setAttribute('data-state', isPlaying ? 'playing' : 'paused');
        audioBtn.setAttribute('aria-label', isPlaying ? 'Stop Temple Ambience' : 'Play Temple Ambience');
    };

    const source = audio.currentSrc || audio.getAttribute('src') || audio.querySelector('source')?.getAttribute('src');
    if (!source) {
        audioBtn.disabled = true;
        audioBtn.setAttribute('aria-label', 'Temple Ambience Unavailable');
        return;
    }

    // Set initial volume low
    audio.volume = 0.4;
    audio.load();
    updateAudioButton(false);

    audioBtn.addEventListener('click', async () => {
        if (!audio.paused) {
            audio.pause();
        } else {
            try {
                await audio.play();
            } catch (err) {
                console.log('Audio play failed:', err);
                updateAudioButton(false);
            }
        }
    });

    audio.addEventListener('play', () => updateAudioButton(true));
    audio.addEventListener('pause', () => updateAudioButton(false));
    audio.addEventListener('ended', () => updateAudioButton(false));
};

// --- Parallax Logic (DISABLED - Causes CLS) ---
// The parallax effect was causing layout shifts (CLS score 0.188)
// by applying transforms to .hero-bg during page load and scroll
// Commenting out to maintain visual consistency and improve Lighthouse scores
const initParallax = () => {
    // Parallax disabled - no longer applying transforms to hero background
    console.log('Parallax effect disabled (was causing CLS)');
};


// Mobile menu toggle behavior
const createMobileMenu = () => {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
        const isOpen = menu.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close when a nav link is clicked
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        });
    });

    // Close when clicking outside the header
    document.addEventListener('click', (e) => {
        if (!toggle.closest('header').contains(e.target)) {
            menu.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });
};

// Track download clicks for analytics (optional)
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const bookTitle = e.target.closest('.book-card')?.querySelector('.book-title')?.textContent;
        const linkType = e.target.classList.contains('btn-primary') ? 'PDF Download' : 'External Link';
        
        console.log(`User clicked: ${linkType} for ${bookTitle}`);
    });
});

// Add loading state for external links
document.querySelectorAll('a[target="_blank"]').forEach(link => {
    link.addEventListener('click', function() {
        this.style.opacity = '0.6';
        setTimeout(() => {
            this.style.opacity = '1';
        }, 300);
    });
});

// --- Particle/Sparkle Effect for Hero Section ---
// Optimized to use existing container and avoid reflows
const initParticles = () => {
    const container = document.querySelector('.particles-container');
    if (!container) return;

    // Create particles with staggered animations
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random positioning
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        
        // Stagger animation delays
        particle.style.animationDelay = (i * 0.5) + 's';
        particle.style.animationDuration = (6 + Math.random() * 4) + 's';
        
        container.appendChild(particle);
    }
};

// --- FAQ Accordion Animation ---
const initFAQ = () => {
    const faqBlocks = document.querySelectorAll('.faq-block');
    
    faqBlocks.forEach(block => {
        const summary = block.querySelector('summary');
        const content = block.querySelector('.faq-content');
        
        if (!summary || !content) return;

        // Wrap content if not already wrapped for smooth transition
        if (!content.querySelector('.faq-content-inner')) {
            const inner = document.createElement('div');
            inner.className = 'faq-content-inner';
            while (content.firstChild) {
                inner.appendChild(content.firstChild);
            }
            content.appendChild(inner);
        }

        // Handle click for smooth animation
        summary.addEventListener('click', (e) => {
            e.preventDefault();
            
            const isOpen = block.hasAttribute('open');
            
            if (isOpen) {
                // Closing animation
                // 1. Read current height
                const contentHeight = content.scrollHeight;
                
                // 2. Batch writes in RAF
                requestAnimationFrame(() => {
                    content.style.maxHeight = contentHeight + 'px';
                    
                    requestAnimationFrame(() => {
                        content.style.maxHeight = '0';
                    });
                });
                
                setTimeout(() => {
                    block.removeAttribute('open');
                    content.style.maxHeight = '';
                }, 400);
            } else {
                // Opening animation
                // Close other open FAQs - Batch reads first to avoid forced reflows
                const openBlocks = Array.from(document.querySelectorAll('.faq-block[open]')).filter(b => b !== block);
                const openData = openBlocks.map(openBlock => {
                    const openContent = openBlock.querySelector('.faq-content');
                    return {
                        block: openBlock,
                        content: openContent,
                        height: openContent.scrollHeight
                    };
                });

                openData.forEach(data => {
                    requestAnimationFrame(() => {
                        data.content.style.maxHeight = data.height + 'px';
                        
                        requestAnimationFrame(() => {
                            data.content.style.maxHeight = '0';
                        });
                    });
                    
                    setTimeout(() => {
                        data.block.removeAttribute('open');
                        data.content.style.maxHeight = '';
                    }, 400);
                });

                // Open current block
                block.setAttribute('open', '');
                
                // Wait for next frame to read height of newly opened content
                requestAnimationFrame(() => {
                    const contentHeight = content.scrollHeight;
                    content.style.maxHeight = '0';
                    
                    requestAnimationFrame(() => {
                        content.style.maxHeight = contentHeight + 'px';
                    });
                });
                
                setTimeout(() => {
                    content.style.maxHeight = 'none';
                }, 400);
            }
        });
    });
};
