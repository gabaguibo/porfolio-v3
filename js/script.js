// Carousel personalizado (reemplazo de Bootstrap)
document.addEventListener('DOMContentLoaded', function() {
    initReadingProgress();

    // Inicializar todos los carruseles
    const carousels = document.querySelectorAll('.carousel');
    
    carousels.forEach(function(carousel) {
        initCarousel(carousel);
    });
    
    // Inicializar modal
    initModal();

    // Inicializar transición del Hero en la home
    initHeroScrollTransition();
});

function initReadingProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.setAttribute('aria-hidden', 'true');
    document.body.prepend(progressBar);

    const nav = document.querySelector('.main-nav');
    const directionThreshold = 14;
    const topThreshold = 72;
    let lastStableY = window.scrollY || window.pageYOffset || 0;
    let ticking = false;

    function updateProgress() {
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 1;
        const nearTop = scrollY <= topThreshold;
        const nearBottom = maxScroll - scrollY <= 2;
        const delta = scrollY - lastStableY;

        progressBar.style.setProperty('--reading-progress', progress.toFixed(4));

        if (nav && Math.abs(delta) >= directionThreshold) {
            nav.classList.toggle('nav-is-hidden', delta > 0 && !nearTop && !nearBottom);
            lastStableY = scrollY;
        }

        if (nav && (nearTop || nearBottom)) {
            nav.classList.remove('nav-is-hidden');
            lastStableY = scrollY;
        }

        ticking = false;
    }

    function requestProgressUpdate() {
        if (!ticking) {
            window.requestAnimationFrame(updateProgress);
            ticking = true;
        }
    }

    updateProgress();
    window.addEventListener('scroll', requestProgressUpdate, { passive: true });
    window.addEventListener('resize', requestProgressUpdate, { passive: true });
}

function initHeroScrollTransition() {
    const hero = document.querySelector('.hero-home');
    const projects = document.querySelector('.portfolio-projects');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!hero || !projects || reduceMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const statement = hero.querySelector('.statement');
    const identity = hero.querySelector('.hero-identity');
    const heroContent = [statement, identity].filter(Boolean);
    const mm = gsap.matchMedia();

    function createHeroTimeline(values) {
        gsap.set(hero, { '--hero-overlay-opacity': 0 });
        gsap.set(heroContent, { clearProps: 'opacity,transform' });
        gsap.set(projects, { clearProps: 'opacity,transform' });

        const timeline = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: values.end,
                scrub: 0.6
            }
        });

        timeline
            .to(hero, { '--hero-overlay-opacity': values.overlayOpacity, duration: 1 }, 0)
            .to(statement, { opacity: 0.04, y: values.statementY, duration: 0.72 }, 0.18)
            .to(identity, { opacity: 0.03, y: values.identityY, duration: 0.5 }, 0.52)
            .fromTo(projects, { opacity: 0.88, y: values.projectsY }, { opacity: 1, y: 0, duration: 0.34 }, 0.66);
    }

    mm.add('(min-width: 768px)', () => {
        createHeroTimeline({
            overlayOpacity: 0.96,
            statementY: -64,
            identityY: -42,
            projectsY: 20,
            end: 'bottom top'
        });
    });

    mm.add('(max-width: 767px)', () => {
        createHeroTimeline({
            overlayOpacity: 0.9,
            statementY: -34,
            identityY: -24,
            projectsY: 12,
            end: 'bottom top'
        });
    });
}

function initCarousel(carousel) {
    const items = carousel.querySelectorAll('.carousel-item');
    const prevBtn = carousel.querySelector('.carousel-control-prev');
    const nextBtn = carousel.querySelector('.carousel-control-next');
    let currentIndex = 0;
    
    // Encontrar el índice del item activo
    items.forEach((item, index) => {
        if (item.classList.contains('active')) {
            currentIndex = index;
        }
    });
    
    // Función para mostrar un slide específico
    function showSlide(index) {
        // Remover clase active de todos los items
        items.forEach(item => item.classList.remove('active'));
        
        // Asegurar que el índice esté dentro del rango
        if (index < 0) {
            currentIndex = items.length - 1;
        } else if (index >= items.length) {
            currentIndex = 0;
        } else {
            currentIndex = index;
        }
        
        // Agregar clase active al item actual
        items[currentIndex].classList.add('active');
    }
    
    // Event listeners para los botones
    if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showSlide(currentIndex - 1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showSlide(currentIndex + 1);
        });
    }
    
    // También soportar enlaces con data-bs-slide
    const prevLinks = carousel.querySelectorAll('[data-bs-slide="prev"]');
    const nextLinks = carousel.querySelectorAll('[data-bs-slide="next"]');
    
    prevLinks.forEach(link => {
        if (link !== prevBtn) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showSlide(currentIndex - 1);
            });
        }
    });
    
    nextLinks.forEach(link => {
        if (link !== nextBtn) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                showSlide(currentIndex + 1);
            });
        }
    });
    
    // Soporte para data-bs-ride="carousel" (auto-play opcional)
    if (carousel.hasAttribute('data-bs-ride') && carousel.getAttribute('data-bs-ride') === 'carousel') {
        // Auto-avanzar cada 5 segundos
        setInterval(function() {
            showSlide(currentIndex + 1);
        }, 5000);
    }
}

// Modal functionality
function initModal() {
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    const openButtons = document.querySelectorAll('.seemore-btn[data-modal]');
    const closeButtons = document.querySelectorAll('[data-close]');
    
    if (!modal || !modalContent) return;
    
    // Abrir modal
    openButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const templateId = this.getAttribute('data-modal');
            const template = document.getElementById(templateId);
            
            if (template) {
                modalContent.innerHTML = template.innerHTML;
                modal.showModal();
                this.setAttribute('aria-expanded', 'true');
            }
        });
    });
    
    // Cerrar modal
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            modal.close();
            openButtons.forEach(btn => btn.setAttribute('aria-expanded', 'false'));
        });
    });
    
    // Cerrar al hacer clic fuera del modal
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.close();
            openButtons.forEach(btn => btn.setAttribute('aria-expanded', 'false'));
        }
    });
    
    // Cerrar con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.open) {
            modal.close();
            openButtons.forEach(btn => btn.setAttribute('aria-expanded', 'false'));
        }
    });
}
