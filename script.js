// Smooth scroll behavior for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add active class to navigation based on scroll position
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// Enhanced Scroll Reveal Animation with performance optimization
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
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
    // 1. Initialize Scroll Observer
    const revealElements = document.querySelectorAll('.book-card, .section-title, .about-content, .hero-content');
    revealElements.forEach(el => {
        el.classList.add('reveal'); // Add reveal class
        observer.observe(el);
    });
    
    // 2. Initialize Mobile Menu
    createMobileMenu();

    // 3. Initialize Parallax Effect
    initParallax();

    // 4. Initialize Audio
    initAudio();

    // 5. Initialize Scroll Indicator
    const scrollInd = document.querySelector('.scroll-indicator');
    if (scrollInd) {
        scrollInd.addEventListener('click', () => {
            document.getElementById('library').scrollIntoView({ behavior: 'smooth' });
        });
    }
});

// --- Audio Logic ---
const initAudio = () => {
    const audioBtn = document.getElementById('audio-toggle');
    const audio = document.getElementById('temple-audio');
    if (!audioBtn || !audio) return;

    let isPlaying = false;
    // Set initial volume low
    audio.volume = 0.4;

    audioBtn.addEventListener('click', () => {
        if (isPlaying) {
            audio.pause();
            audioBtn.classList.remove('playing');
            audioBtn.innerHTML = '<i class="fas fa-music"></i>';
        } else {
            audio.play().catch(err => console.log("Audio play failed:", err));
            audioBtn.classList.add('playing');
            audioBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
        isPlaying = !isPlaying;
    });
};

// --- Parallax Logic ---
const initParallax = () => {
    const heroBg = document.querySelector('.hero-bg');
    if (!heroBg) {
        console.warn('Hero background element not found for parallax');
        return;
    }

    console.log('Parallax effect initialized');

    // Use requestAnimationFrame for smoother performance
    let ticking = false;
    
    const updateParallax = () => {
        const scrolled = window.scrollY;
        const heroSection = document.querySelector('.hero');
        
        if (!heroSection) return;
        
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        
        // Only apply parallax within the hero section
        if (scrolled <= heroBottom) {
            // Move background at 50% speed of scroll (more noticeable)
            heroBg.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
        
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    });
    
    // Initial call
    updateParallax();
};


// Mobile menu is now always visible, no toggle needed
const createMobileMenu = () => {
    // Navigation is responsive via CSS - no JS needed
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
