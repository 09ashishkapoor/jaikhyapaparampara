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

// Add animation on scroll for book cards
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '0';
            entry.target.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                entry.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, 100);
            
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all book cards
document.addEventListener('DOMContentLoaded', () => {
    const bookCards = document.querySelectorAll('.book-card');
    bookCards.forEach(card => observer.observe(card));
});

// Mobile menu toggle (for future enhancement)
const createMobileMenu = () => {
    const nav = document.querySelector('.nav');
    const navMenu = document.querySelector('.nav-menu');
    
    // Only create hamburger menu on mobile
    if (window.innerWidth <= 768) {
        if (!document.querySelector('.hamburger')) {
            const hamburger = document.createElement('button');
            hamburger.classList.add('hamburger');
            hamburger.innerHTML = '☰';
            hamburger.setAttribute('aria-label', 'Toggle navigation menu');
            
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                hamburger.classList.toggle('active');
            });
            
            nav.insertBefore(hamburger, navMenu);
        }
    }
};

// Track download clicks for analytics (optional)
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const bookTitle = e.target.closest('.book-card')?.querySelector('.book-title')?.textContent;
        const linkType = e.target.classList.contains('btn-primary') ? 'PDF Download' : 'External Link';
        
        console.log(`User clicked: ${linkType} for ${bookTitle}`);
        // You can add Google Analytics or other tracking here
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
