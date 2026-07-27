// Carousel personalizado (reemplazo de Bootstrap)
document.addEventListener('DOMContentLoaded', function() {
    initReadingProgress();
    initPointerEffects();
    initScrollEntryAnimations();
    initSubtleParallax();
    initProjectCardTilt();
    initProjectFilters();
    initProjectViewToggle();
    initContactPopover();

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

function initPointerEffects() {
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

    if (reduceMotionQuery.matches || !finePointerQuery.matches) {
        return;
    }

    const magneticSelector = '.main-nav a, .main-nav button, .project__link, .back-to-top a, .about-contact a, .case-study__back a';
    const magneticTargets = Array.from(document.querySelectorAll(magneticSelector));

    if (!magneticTargets.length) {
        return;
    }

    magneticTargets.forEach(function(target) {
        target.classList.add('magnetic-link');
    });

    let activeMagnetic = null;

    function resetMagnetic(target) {
        if (!target) {
            return;
        }

        target.style.setProperty('--magnetic-x', '0px');
        target.style.setProperty('--magnetic-y', '0px');
    }

    function stopEffects() {
        magneticTargets.forEach(function(target) {
            resetMagnetic(target);
            target.classList.remove('magnetic-link');
        });
    }

    document.addEventListener('pointermove', function(event) {
        if (event.pointerType !== 'mouse') {
            return;
        }

        const nextMagnetic = event.target.closest(magneticSelector);

        if (activeMagnetic && activeMagnetic !== nextMagnetic) {
            resetMagnetic(activeMagnetic);
        }

        activeMagnetic = nextMagnetic;

        if (activeMagnetic) {
            const rect = activeMagnetic.getBoundingClientRect();
            const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 6;
            const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 6;
            activeMagnetic.style.setProperty('--magnetic-x', offsetX.toFixed(2) + 'px');
            activeMagnetic.style.setProperty('--magnetic-y', offsetY.toFixed(2) + 'px');
        }
    }, { passive: true });

    document.addEventListener('pointerout', function(event) {
        if (activeMagnetic && (!event.relatedTarget || !activeMagnetic.contains(event.relatedTarget))) {
            resetMagnetic(activeMagnetic);
            activeMagnetic = null;
        }
    }, { passive: true });

    window.addEventListener('pointerleave', function() {
        resetMagnetic(activeMagnetic);
        activeMagnetic = null;
    }, { passive: true });

    function handleCapabilityChange() {
        if (reduceMotionQuery.matches || !finePointerQuery.matches) {
            stopEffects();
        }
    }

    if (typeof reduceMotionQuery.addEventListener === 'function') {
        reduceMotionQuery.addEventListener('change', handleCapabilityChange);
    }

    if (typeof finePointerQuery.addEventListener === 'function') {
        finePointerQuery.addEventListener('change', handleCapabilityChange);
    }
}

function initScrollEntryAnimations() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || typeof IntersectionObserver === 'undefined') {
        return;
    }

    const revealSelector = [
        '.project',
        '.case-study__header',
        '.case-study__intro-copy',
        '.case-study__fact',
        '.case-study__back',
        '.about-copy > p'
    ].join(', ');

    const forbiddenSelector = 'main, section, .projects, .portfolio-projects, .grid';
    const revealItems = Array.from(document.querySelectorAll(revealSelector))
        .filter(function(item) {
            return !item.matches(forbiddenSelector);
        });

    if (!revealItems.length) {
        return;
    }

    let observer;

    try {
        observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add('is-revealed');
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.04,
            rootMargin: '0px 0px -8% 0px'
        });
    } catch (error) {
        revealItems.forEach(function(item) {
            item.classList.add('is-revealed');
        });
        return;
    }

    revealItems.forEach(function(item, index) {
        item.style.setProperty('--reveal-delay', Math.min(index * 35, 140) + 'ms');
        observer.observe(item);
        item.classList.add('reveal-item', 'is-reveal-ready');
    });

    window.setTimeout(function() {
        revealItems.forEach(function(item) {
            if (!item.classList.contains('is-revealed')) {
                item.classList.add('is-revealed');
            }
        });
    }, 4000);
}

function initSubtleParallax() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
        return;
    }

    const parallaxItems = [];
    const hero = document.querySelector('.hero-home');

    if (hero) {
        parallaxItems.push({
            element: hero,
            property: '--hero-parallax-y',
            speed: -0.09,
            max: 28
        });
    }

    document.querySelectorAll('.project__media > img, .project__media > video, .project__media > #veloptix-canvas').forEach(function(element) {
        element.classList.add('parallax-layer');
        parallaxItems.push({
            element: element,
            property: '--parallax-y',
            speed: -0.045,
            max: 12
        });
    });

    document.querySelectorAll('.case-study__media img, .case-study__media .project-placeholder').forEach(function(element) {
        element.classList.add('parallax-layer');
        parallaxItems.push({
            element: element,
            property: '--parallax-y',
            speed: -0.05,
            max: 16
        });
    });

    if (!parallaxItems.length) {
        return;
    }

    let ticking = false;

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function updateParallax() {
        const viewportCenter = window.innerHeight / 2;

        parallaxItems.forEach(function(item) {
            const rect = item.element.getBoundingClientRect();
            const elementCenter = rect.top + rect.height / 2;
            const offset = clamp((viewportCenter - elementCenter) * item.speed, -item.max, item.max);

            item.element.style.setProperty(item.property, offset.toFixed(2) + 'px');
        });

        ticking = false;
    }

    function requestParallaxUpdate() {
        if (!ticking) {
            window.requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }

    updateParallax();
    window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
    window.addEventListener('resize', requestParallaxUpdate, { passive: true });
}

function initProjectCardTilt() {
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const projects = Array.from(document.querySelectorAll('.project'));

    if (reduceMotionQuery.matches || !finePointerQuery.matches || !projects.length) {
        return;
    }

    let activeProject = null;
    let pointerX = 0;
    let pointerY = 0;
    let ticking = false;

    function resetProject(project) {
        if (!project) {
            return;
        }

        project.style.setProperty('--project-tilt-x', '0deg');
        project.style.setProperty('--project-tilt-y', '0deg');
    }

    function updateTilt() {
        if (!activeProject) {
            ticking = false;
            return;
        }

        const rect = activeProject.getBoundingClientRect();
        const x = (pointerX - rect.left) / rect.width - 0.5;
        const y = (pointerY - rect.top) / rect.height - 0.5;

        activeProject.style.setProperty('--project-tilt-x', (-y * 5).toFixed(2) + 'deg');
        activeProject.style.setProperty('--project-tilt-y', (x * 5).toFixed(2) + 'deg');
        ticking = false;
    }

    function requestTiltUpdate() {
        if (!ticking) {
            window.requestAnimationFrame(updateTilt);
            ticking = true;
        }
    }

    document.addEventListener('pointermove', function(event) {
        if (event.pointerType !== 'mouse') {
            return;
        }

        const nextProject = event.target.closest('.project');

        if (activeProject && activeProject !== nextProject) {
            resetProject(activeProject);
        }

        activeProject = nextProject;

        if (!activeProject) {
            return;
        }

        pointerX = event.clientX;
        pointerY = event.clientY;
        requestTiltUpdate();
    }, { passive: true });

    document.addEventListener('pointerout', function(event) {
        if (activeProject && (!event.relatedTarget || !activeProject.contains(event.relatedTarget))) {
            resetProject(activeProject);
            activeProject = null;
        }
    }, { passive: true });

    window.addEventListener('pointerleave', function() {
        resetProject(activeProject);
        activeProject = null;
    }, { passive: true });
}

function initProjectFilters() {
    const filters = document.querySelector('.project-filters');
    const projectsList = document.querySelector('.projects');

    if (!filters || !projectsList) {
        return;
    }

    const buttons = Array.from(filters.querySelectorAll('[data-filter]'));
    const projects = Array.from(projectsList.querySelectorAll('.project[data-disciplines]'));
    const validFilters = ['all', 'web', 'motion', 'graphic', 'photo'];
    const transitionMs = 190;

    if (!buttons.length || !projects.length) {
        return;
    }

    let activeFilter = 'all';

    function getProjectInteractiveElements(project) {
        return Array.from(project.querySelectorAll('a, button, input, select, textarea, [tabindex]'));
    }

    function setProjectInteractive(project, isInteractive) {
        getProjectInteractiveElements(project).forEach(function(element) {
            if (isInteractive) {
                if (element.dataset.projectFilterManaged === 'true') {
                    if (Object.prototype.hasOwnProperty.call(element.dataset, 'projectFilterTabindex')) {
                        element.setAttribute('tabindex', element.dataset.projectFilterTabindex);
                        delete element.dataset.projectFilterTabindex;
                    } else {
                        element.removeAttribute('tabindex');
                    }

                    delete element.dataset.projectFilterManaged;
                }

                element.removeAttribute('aria-hidden');
                return;
            }

            if (element.dataset.projectFilterManaged !== 'true') {
                if (element.hasAttribute('tabindex')) {
                    element.dataset.projectFilterTabindex = element.getAttribute('tabindex');
                }

                element.dataset.projectFilterManaged = 'true';
            }

            element.setAttribute('tabindex', '-1');
            element.setAttribute('aria-hidden', 'true');
        });
    }

    function projectMatches(project, filter) {
        if (filter === 'all') {
            return true;
        }

        return project.dataset.disciplines.split(/\s+/).includes(filter);
    }

    function showProject(project) {
        project.hidden = false;
        setProjectInteractive(project, true);

        window.requestAnimationFrame(function() {
            project.classList.remove('is-filtering-out');
        });
    }

    function hideProject(project) {
        project.classList.add('is-filtering-out');
        setProjectInteractive(project, false);

        window.setTimeout(function() {
            if (project.classList.contains('is-filtering-out')) {
                project.hidden = true;
            }
        }, transitionMs);
    }

    function applyFilter(filter) {
        if (!validFilters.includes(filter) || filter === activeFilter) {
            return;
        }

        activeFilter = filter;

        buttons.forEach(function(button) {
            const isActive = button.dataset.filter === activeFilter;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        projects.forEach(function(project) {
            if (projectMatches(project, activeFilter)) {
                showProject(project);
            } else {
                hideProject(project);
            }
        });
    }

    buttons.forEach(function(button) {
        button.addEventListener('click', function() {
            applyFilter(button.dataset.filter);
        });
    });

    projects.forEach(function(project) {
        project.hidden = false;
        project.classList.remove('is-filtering-out');
        setProjectInteractive(project, true);
    });
}

function initProjectViewToggle() {
    const projectSection = document.querySelector('.grid[data-project-view]');

    if (!projectSection) {
        return;
    }

    const buttons = Array.from(projectSection.querySelectorAll('[data-view]'));
    const filterButtons = Array.from(projectSection.querySelectorAll('[data-filter]'));
    const validViews = ['grid', 'list'];
    const storageKey = 'portfolioProjectView';

    if (!buttons.length) {
        return;
    }

    function getStoredView() {
        try {
            return window.sessionStorage.getItem(storageKey);
        } catch (error) {
            return null;
        }
    }

    function storeView(view) {
        try {
            window.sessionStorage.setItem(storageKey, view);
        } catch (error) {
            // Session storage can be unavailable in private or locked-down contexts.
        }
    }

    function applyView(view, shouldStore) {
        const nextView = validViews.includes(view) ? view : 'grid';

        projectSection.classList.toggle('is-grid', nextView === 'grid');
        projectSection.classList.toggle('is-list', nextView === 'list');
        projectSection.dataset.projectView = nextView;

        buttons.forEach(function(button) {
            const isActive = button.dataset.view === nextView;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        if (shouldStore) {
            storeView(nextView);
        }

        syncListMediaInteractivity(nextView);
    }

    function syncListMediaInteractivity(view) {
        const isList = view === 'list';

        projectSection.querySelectorAll('.project__media').forEach(function(mediaLink) {
            if (isList) {
                if (mediaLink.dataset.projectViewManaged !== 'true') {
                    if (mediaLink.hasAttribute('tabindex')) {
                        mediaLink.dataset.projectViewTabindex = mediaLink.getAttribute('tabindex');
                    }

                    mediaLink.dataset.projectViewManaged = 'true';
                }

                mediaLink.setAttribute('tabindex', '-1');
                mediaLink.setAttribute('aria-hidden', 'true');
                return;
            }

            if (mediaLink.dataset.projectViewManaged === 'true') {
                if (Object.prototype.hasOwnProperty.call(mediaLink.dataset, 'projectViewTabindex')) {
                    mediaLink.setAttribute('tabindex', mediaLink.dataset.projectViewTabindex);
                    delete mediaLink.dataset.projectViewTabindex;
                } else {
                    mediaLink.removeAttribute('tabindex');
                }

                delete mediaLink.dataset.projectViewManaged;
            }

            mediaLink.removeAttribute('aria-hidden');
        });
    }

    applyView(getStoredView() || 'grid', false);

    buttons.forEach(function(button) {
        button.addEventListener('click', function() {
            applyView(button.dataset.view, true);
        });
    });

    filterButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            window.setTimeout(function() {
                syncListMediaInteractivity(projectSection.dataset.projectView);
            }, 210);
        });
    });
}

function initContactPopover() {
    const nav = document.querySelector('.main-nav');
    const button = nav && nav.querySelector('.main-nav__contact');
    const popover = nav && nav.querySelector('.contact-popover');

    if (!nav || !button || !popover) {
        return;
    }

    const copyButton = popover.querySelector('.contact-popover__copy');
    const status = popover.querySelector('.contact-popover__status');
    const emailElement = popover.querySelector('p');
    const email = emailElement ? emailElement.textContent.trim() : '';

    if (!email) {
        return;
    }

    function setOpen(isOpen) {
        popover.hidden = !isOpen;
        button.setAttribute('aria-expanded', String(isOpen));

        if (!isOpen && status) {
            status.textContent = '';
        }
    }

    button.addEventListener('click', function(event) {
        event.stopPropagation();
        setOpen(popover.hidden);
    });

    popover.addEventListener('click', function(event) {
        event.stopPropagation();
    });

    document.addEventListener('click', function() {
        if (!popover.hidden) {
            setOpen(false);
        }
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && !popover.hidden) {
            setOpen(false);
            button.focus();
        }
    });

    if (copyButton) {
        copyButton.addEventListener('click', function() {
            const copiedText = 'Copied';

            function markCopied() {
                if (status) {
                    status.textContent = copiedText;
                }
            }

            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                navigator.clipboard.writeText(email).then(markCopied).catch(markCopied);
            } else {
                markCopied();
            }
        });
    }
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
            .to(identity, { opacity: 0.03, y: values.identityY, duration: 0.5 }, 0.52);
    }

    mm.add('(min-width: 768px)', () => {
        createHeroTimeline({
            overlayOpacity: 0.96,
            statementY: -64,
            identityY: -42,
            end: 'bottom top'
        });
    });

    mm.add('(max-width: 767px)', () => {
        createHeroTimeline({
            overlayOpacity: 0.9,
            statementY: -34,
            identityY: -24,
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
