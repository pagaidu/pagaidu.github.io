const ANIMATION_DURATIONS = {
    overlayEnter: .7,
    overlayLeave: .7,
    fadeIn: 0.2,
    fadeOut: .7,
};
const ANIMATION_EASES = {
    overlayEnter: 'power1.in',
    overlayLeave: 'power2.out',
    fadeIn: 'power2.in',
    fadeOut: 'sine.out'
};

function updateHead(newPageRawHTML) {
    const head = document.head;
    const newPageRawHead = newPageRawHTML.match(/<head[^>]*>([\s\S.]*)<\/head>/i)[1];
    const newPageHead = document.createElement('div');
    newPageHead.innerHTML = newPageRawHead;
    const selectors = ["meta[name='description']", "meta[property='og:description']"];
    selectors.forEach(selector => {
        const existingTag = head.querySelector(selector);
        const newTag = newPageHead.querySelector(selector);
        if (existingTag && newTag) {
            existingTag.setAttribute('content', newTag.getAttribute('content'))
        } else if (newTag) {
            head.appendChild(newTag.cloneNode(!0))
        }
    })
}

function updateFooter(newPageRawHTML) {
    const footer = document.querySelector('.footer');
    const newPageRawFooter = newPageRawHTML.match(/<footer[^>]*>([\s\S.]*)<\/footer>/i)[1];
    const newPageFooter = document.createElement('div');
    newPageFooter.innerHTML = newPageRawFooter;
    footer.innerHTML = newPageFooter.innerHTML
}

function updateFooterClass(namespace) {
    const footer = document.querySelector('.footer');
    if (footer) {
        if (namespace === 'home') {
            footer.classList.add('index')
        } else {
            footer.classList.remove('index')
        }
    }
}

function setActiveLink() {
    const currentPath = window.location.pathname.replace(/\/$/, '');
    const footerLinks = Array.from(document.querySelectorAll('.footer-link'));
    if (document.activeElement) {
        document.activeElement.blur()
    }
    const classesToAdd = [];
    const classesToRemove = [];
    footerLinks.forEach(link => {
        const linkPath = link.getAttribute('href').replace(/\/$/, '');
        if (linkPath === currentPath) {
            classesToAdd.push(link)
        } else {
            classesToRemove.push(link)
        }
    });
    classesToRemove.forEach(link => link.classList.remove('active'));
    classesToAdd.forEach(link => link.classList.add('active'))
}

/**
 * Handles keyboard shortcuts for the dropdown menu.
 * @param {KeyboardEvent} e The keyboard event.
 */
function handleDropdownKeys(e) {
    // Don't interfere if the user is typing in a form field.
    const activeEl = document.activeElement;
    const isTyping = activeEl && (['input', 'textarea'].includes(activeEl.tagName.toLowerCase()) || activeEl.isContentEditable);
    if (isTyping) {
        return;
    }

    const dropdownToggle = document.querySelector('.dropdown-toggle.js-only');
    if (!dropdownToggle) {
        return;
    }

    // Use 'i' or 'm' to toggle the menu.
    if (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'm') {
        e.preventDefault();
        dropdownToggle.click();
    }

    // Use 'Escape' to close the menu if it's open.
    if (e.key === 'Escape') {
        if (dropdownToggle.getAttribute('aria-expanded') === 'true') {
            e.preventDefault();
            dropdownToggle.click(); // This will toggle it closed.
        }
    }
}

/**
 * Manages keyboard (arrow keys) and swipe navigation for post pages.
 */
class PostNavigator {
    constructor(container) {
        this.swipeTarget = container.querySelector('.post'); // Target the main post content area
        if (!this.swipeTarget) {
            return; // Don't initialize if the target isn't found
        }

        this.prevUrl = container.dataset.prevUrl;
        this.nextUrl = container.dataset.nextUrl;
        
        // Track both X and Y coordinates
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;

        this.isSwiping = false;

        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.boundHandleTouchStart = this.handleTouchStart.bind(this);
        this.boundHandleTouchMove = this.handleTouchMove.bind(this);
        this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);

        this.addEventListeners();
    }

    addEventListeners() {
        // Keyboard events can remain global
        document.addEventListener('keydown', this.boundHandleKeyDown);
        // Touch events are now restricted to the swipeTarget element
        this.swipeTarget.addEventListener('touchstart', this.boundHandleTouchStart, { passive: true });
        this.swipeTarget.addEventListener('touchmove', this.boundHandleTouchMove, { passive: true });
        this.swipeTarget.addEventListener('touchend', this.boundHandleTouchEnd);
    }

    handleKeyDown(e) {
        if (e.key === 'ArrowLeft' && this.prevUrl) {
            barba.go(this.prevUrl);
        } else if (e.key === 'ArrowRight' && this.nextUrl) {
            barba.go(this.nextUrl);
        }
    }

    handleTouchStart(e) {
        // Record both starting X and Y
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.isSwiping = true;
    }

    handleTouchMove(e) {
        if (!this.isSwiping) return;
        // Record current X and Y
        this.touchEndX = e.touches[0].clientX;
        this.touchEndY = e.touches[0].clientY;
    }

    handleTouchEnd() {
        if (!this.isSwiping) return;
        
        const swipeThreshold = 50; // Minimum horizontal distance for a swipe
        const dx = this.touchEndX - this.touchStartX;
        const dy = this.touchEndY - this.touchStartY;

        // Only trigger a swipe if the horizontal movement is greater than the vertical movement.
        if (Math.abs(dx) > Math.abs(dy)) {
            // And only if the horizontal movement exceeds the threshold.
            if (Math.abs(dx) > swipeThreshold) {
                if (dx > 0 && this.prevUrl) { // Swipe Right
                    barba.go(this.prevUrl);
                } else if (dx < 0 && this.nextUrl) { // Swipe Left
                    barba.go(this.nextUrl);
                }
            }
        }
        
        // Reset all values for the next touch.
        this.isSwiping = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
    }

    destroy() {
        // Clean up global keydown listener
        document.removeEventListener('keydown', this.boundHandleKeyDown);
        // Clean up touch listeners from the specific target
        if (this.swipeTarget) {
            this.swipeTarget.removeEventListener('touchstart', this.boundHandleTouchStart);
            this.swipeTarget.removeEventListener('touchmove', this.boundHandleTouchMove);
            this.swipeTarget.removeEventListener('touchend', this.boundHandleTouchEnd);
        }
    }
}

let postNavigator = null;

/**
 * Manages the homepage video to ensure reliable autoplay,
 * handles browser visibility changes, and integrates with Barba.js lifecycle.
 */
class VideoManager {
    constructor() {
        this.video = document.querySelector('.front__cover-video');
        this.hasPlayedOnce = false;

        if (!this.video) {
             // This is now a normal case when not on the homepage, so no error needed.
            return;
        }

        this.boundOnVisibilityChange = this.onVisibilityChange.bind(this);
        this.boundAttemptPlay = this.attemptPlay.bind(this);

        this.addEventListeners();
        this.attemptPlay();
    }

    addEventListeners() {
        document.addEventListener('visibilitychange', this.boundOnVisibilityChange);
        // 'canplay' is a good event to trigger the first play attempt.
        this.video.addEventListener('canplay', this.boundAttemptPlay, { once: true });
    }

    /**
     * Attempts to play the video, handling the promise to catch autoplay errors.
     */
    async attemptPlay() {
        if (!this.video || !this.video.paused) {
            return; // Video doesn't exist or is already playing.
        }

        try {
            // The video is loaded via the `ready` method or `onVisibilityChange`, so we just need to play.
            await this.video.play();
        } catch (error) {
            // This is expected when autoplay is blocked by the browser.
            console.warn("Video autoplay was prevented by the browser:", error.message);
        }
    }

    /**
     * Returns a promise that resolves when the video is ready to be played.
     */
    ready() {
        return new Promise(resolve => {
            if (this.video.readyState >= 3) { // HAVE_FUTURE_DATA state
                resolve();
            } else {
                this.video.addEventListener('canplay', resolve, { once: true });
            }
            this.video.load(); // Trigger the load
        });
    }

    /**
     * Pauses the video when the tab is hidden and plays it when visible.
     */
    onVisibilityChange() {
        if (!this.video) return;

        if (document.visibilityState === 'visible') {
            // When returning to a tab, mobile browsers can leave the video in a broken state.
            // We need to be more forceful to ensure it recovers and plays correctly.
            requestAnimationFrame(() => {
                // Resetting currentTime can help fix rendering glitches on some browsers.
                this.video.currentTime = 0;
                // Calling load() is crucial for mobile browsers that discard video data.
                this.video.load();
                // Now, attempt to play.
                this.attemptPlay();
            });
        } else {
            // When tab is hidden, pause the video to save resources.
            this.video.pause();
        }
    }

    /**
     * Cleans up event listeners to prevent memory leaks when navigating away.
     */
    destroy() {
        if (this.video) {
            this.video.pause();
            this.video.removeEventListener('canplay', this.boundAttemptPlay);
        }
        document.removeEventListener('visibilitychange', this.boundOnVisibilityChange);
    }
}

let videoManager = null;

function initializeVideo() {
        // Ensure any old manager is destroyed before creating a new one.
    if (videoManager) {
        videoManager.destroy();
    }
    videoManager = new VideoManager();
}

function initializeDropdown() {
    seamless.polyfill();
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle.js-only');
    const dropdownWrappers = document.querySelectorAll('.dropdown-wrapper');
    dropdownToggles.forEach((dropdownToggle, index) => {
        const dropdownWrapper = dropdownWrappers[index];
        dropdownToggle.addEventListener('click', function(event) {
            event.stopPropagation();
            const expanded = this.getAttribute('aria-expanded') === 'true';
            dropdownToggles.forEach((toggle, toggleIndex) => {
                const wrapper = dropdownWrappers[toggleIndex];
                if (toggle !== dropdownToggle) {
                    toggle.setAttribute('aria-expanded', 'false');
                    wrapper.classList.remove('open')
                }
            });
            const isNowExpanded = !expanded;
            this.setAttribute('aria-expanded', isNowExpanded);
            dropdownWrapper.classList.toggle('open', isNowExpanded);
            if (isNowExpanded) {
                const offset = 30;
                const rect = dropdownWrapper.getBoundingClientRect();
                const targetScrollPosition = window.scrollY + rect.top - offset;
                seamless.scrollTo(window, {
                    top: targetScrollPosition,
                    behavior: 'smooth'
                })
            }
        })
    });
    document.addEventListener('click', function() {
        dropdownToggles.forEach((toggle, index) => {
            const wrapper = dropdownWrappers[index];
            toggle.setAttribute('aria-expanded', 'false');
            wrapper.classList.remove('open')
        })
    })
}

function closeDropdown() {
    const dropdownCheckbox = document.getElementById('dropdown-checkbox');
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    if (dropdownCheckbox && dropdownToggle) {
        dropdownCheckbox.checked = !1;
        dropdownToggle.setAttribute('aria-expanded', 'false')
    }
    const dropdownWrapper = document.querySelector('.dropdown-wrapper');
    if (dropdownWrapper) {
        dropdownWrapper.classList.remove('open')
    }
}

function overlayEnter() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.classList.add('overlay');
        document.body.appendChild(overlay);
        gsap.fromTo(overlay, {
            x: '-100%'
        }, {
            x: '0%',
            duration: ANIMATION_DURATIONS.overlayEnter,
            ease: ANIMATION_EASES.overlayEnter,
            onComplete: resolve,
        })
    })
}

function overlayLeave() {
    return new Promise((resolve) => {
        const overlay = document.querySelector('.overlay');
        if (!overlay) {
            resolve();
            return
        }
        gsap.to(overlay, {
            x: '100%',
            duration: ANIMATION_DURATIONS.overlayLeave,
            ease: ANIMATION_EASES.overlayLeave,
            onComplete: () => {
                overlay.remove();
                resolve()
            },
        })
    })
}

function gsapFade(element, fromOpacity, toOpacity, duration, ease, onComplete) {
    if (!element) {
        console.error('Element not found for gsapFade');
        return Promise.resolve()
    }
    return new Promise(resolve => {
        gsap.to(element, {
            opacity: toOpacity,
            duration: duration,
            ease: ease,
            onComplete: () => {
                if (onComplete) onComplete();
                resolve()
            },
            onStart: () => {
                element.style.opacity = fromOpacity.toString()
            }
        })
    })
}

function resetScrollPosition() {
    // Use 'auto' for an instant, invisible reset.
    window.scrollTo({
        top: 0,
        behavior: 'auto'
    })
}

document.addEventListener('DOMContentLoaded', () => {
    // Remove preloader logic and ensure content is visible
    const contentContainer = document.querySelector('.content-wrapper') || document.querySelector('.fadein');
    if (contentContainer) {
        contentContainer.style.opacity = '';
        contentContainer.style.visibility = '';
    }

    // Clean up any leftover overlay element if present
    const strayOverlay = document.querySelector('.loading-overlay');
    if (strayOverlay) strayOverlay.remove();

    // Initialize video if on the homepage on initial load
    if (document.querySelector('[data-barba-namespace="home"]')) {
        initializeVideo();
    }

    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual'
    }

    barba.init({
        transitions: [{
            name: 'post-fade',
            from: { namespace: ['post'] },
            to:   { namespace: ['post'] },
            leave(data) {
                closeDropdown();
                const currentContainer = data.current.container.querySelector('.content-wrapper');
                return gsapFade(currentContainer, 1, 0, ANIMATION_DURATIONS.fadeOut, ANIMATION_EASES.fadeOut, () => {
                    data.current.container.style.display = 'none'
                })
            },
            enter(data) {
                const nextContainer = data.next.container.querySelector('.content-wrapper');
                nextContainer.style.display = 'block';
                nextContainer.style.opacity = '0';
                return gsapFade(nextContainer, 0, 1, ANIMATION_DURATIONS.fadeIn, ANIMATION_EASES.fadeIn, initializeDropdown)
            },
        }, {
            name: 'home-to-any',
            from: {
                namespace: ['home']
            },
            to: {
                namespace: ['post', 'default']
            },
            leave(data) {
                return overlayEnter().then(() => {
                    data.current.container.style.display = 'none'
                })
            },
            enter(data) {
                initializeDropdown();
                const nextContainer = data.next.container.querySelector('.content-wrapper');
                nextContainer.style.opacity = '0';
                nextContainer.style.display = 'block';
                const timeline = gsap.timeline();
                timeline.add(overlayLeave());
                timeline.to(nextContainer, {
                    opacity: 1,
                    duration: ANIMATION_DURATIONS.overlayLeave,
                    ease: ANIMATION_EASES.overlayLeave,
                });
                return timeline.finished
            },
        }, {
            name: 'any-to-home',
            from: {
                namespace: ['post', 'default']
            },
            to: {
                namespace: ['home']
            },
            leave(data) {
                return overlayEnter().then(() => {
                    data.current.container.style.display = 'none'
                })
            },
            enter(data) {
                const homeContainer = data.next.container;
                gsap.set(homeContainer, { opacity: 0 });

                initializeVideo();

                // First, wait for the video to be ready to play.
                return videoManager.ready().then(() => {
                    // Once ready, start playing the video.
                    videoManager.attemptPlay();

                    // Now, run the overlay leaving and the container fading in animations simultaneously.
                    return Promise.all([
                        overlayLeave(),
                        gsap.to(homeContainer, {
                            opacity: 1,
                            duration: ANIMATION_DURATIONS.overlayLeave, // Match the overlay's duration
                            ease: ANIMATION_EASES.overlayLeave,
                        })
                    ]);
                });
            },
        }, {
            name: 'post-to-default',
            from: {
                namespace: ['post', 'default']
            },
            to: {
                namespace: ['default']
            },
            leave(data) {
                return overlayEnter().then(() => {
                    data.current.container.style.display = 'none'
                })
            },
            enter(data) {
                const nextContainer = data.next.container.querySelector('.content-wrapper');
                nextContainer.style.opacity = '0';
                nextContainer.style.display = 'block';
                const overlayLeavePromise = overlayLeave();
                const fadeInPromise = new Promise((resolve) => {
                    gsap.to(nextContainer, {
                        opacity: 1,
                        duration: ANIMATION_DURATIONS.overlayLeave,
                        ease: ANIMATION_EASES.overlayLeave,
                        onComplete: resolve,
                    })
                });
                return Promise.all([overlayLeavePromise, fadeInPromise])
            },
        }, {
            name: 'default-to-post',
            from: {
                namespace: ['default']
            },
            to: {
                namespace: ['post']
            },
            leave(data) {
                return overlayEnter().then(() => {
                    data.current.container.style.display = 'none'
                })
            },
            enter(data) {
                const nextContainer = data.next.container.querySelector('.content-wrapper');
                nextContainer.style.opacity = '0';
                nextContainer.style.display = 'block';
                const overlayLeavePromise = overlayLeave();
                const fadeInPromise = new Promise((resolve) => {
                    gsap.to(nextContainer, {
                        opacity: 1,
                        duration: ANIMATION_DURATIONS.overlayLeave * 2,
                        ease: ANIMATION_EASES.overlayLeave,
                        onComplete: resolve,
                    })
                });
                return Promise.all([overlayLeavePromise, fadeInPromise])
            },
        }, ],
    });

    barba.hooks.beforeLeave(() => {});

    // Fix: add data parameter to hook and guard next
    barba.hooks.leave((data) => {

        if (data && data.next && ['post'].includes(data.next.namespace)) {
            closeDropdown()
        }
    });

    barba.hooks.afterLeave((data) => {
        const homeContainer = document.querySelector('[data-barba-namespace="home"]');
        if (homeContainer) {
            homeContainer.style.opacity = '';
            homeContainer.style.display = ''
        }
        // Best practice: Reset scroll after the leave transition is complete.
        resetScrollPosition();

        // Clean up the video manager when leaving the homepage
        if (data.current.namespace === 'home' && videoManager) {
            videoManager.destroy();
            videoManager = null;
        }
        // Clean up the post navigator when leaving a post
        if (data.current.namespace === 'post' && postNavigator) {
            postNavigator.destroy();
            postNavigator = null;
        }
        // Clean up dropdown key listener when leaving relevant pages.
        if (['post', 'default'].includes(data.current.namespace)) {
            document.removeEventListener('keydown', handleDropdownKeys);
        }
    });

    barba.hooks.beforeEnter((data) => {
        // setTimeout(resetScrollPosition, 50); // This was causing the visible scroll.

        updateHead(data.next.html);
        updateFooter(data.next.html);
        updateFooterClass(data.next.namespace);
    });

    barba.hooks.enter(() => {
    });

    barba.hooks.afterEnter((data) => {
        if (['post', 'default'].includes(data.next.namespace)) {
            setActiveLink();
            // Add dropdown key listener on pages that have it.
            document.addEventListener('keydown', handleDropdownKeys);
        }
        // Initialize post navigation
        if (data.next.namespace === 'post') {
            postNavigator = new PostNavigator(data.next.container);
        }
        // Initialize video on initial load if not already handled by a transition.
        if (data.next.namespace === 'home' && !videoManager) {
            initializeVideo();
        }
    })
})