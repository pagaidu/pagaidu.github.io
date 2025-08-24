const ANIMATION_DURATIONS = {
    overlayEnter: 700,
    overlayLeave: 700,
    fadeIn: 800,
    fadeOut: 800,
    loadingFadeOut: 700,
    fadeOverlap: 300,
    loadingContentFadeIn: 1600,
    loadingContentSlide: 700
};

const ANIMATION_EASES = {
    overlayEnter: 'power1.in',
    overlayLeave: 'power2.out',
    fadeIn: 'power2.in',
    fadeOut: 'sine.out'
};

class LoadingManager {
    constructor() {
      this.loadingProgress = 0;
      this.targetProgress = 0;
      this.animationFrameId = null;
      this.isComplete = false;
      this.isLoadFinished = false;
      this.startTime = Date.now();
      this.minLoadTime = 2000; // Minimum 2 seconds display time
  
      this.circle = null;
      this.percentageElement = null;
      this.circumference = 2 * Math.PI * 50; // radius = 50
      
      this.overlay = document.querySelector('.loading-overlay');
      if (!this.overlay) return; 
  
      this.circle = this.overlay.querySelector('.progress-circle');
      this.percentageElement = this.overlay.querySelector('.loading-percentage');
      
      this.startProgressSimulation();
      this.setupEventListeners();
    }
  
    updateProgress(percentage) {
      this.loadingProgress = Math.min(percentage, 100);
      if (this.percentageElement) {
          this.percentageElement.textContent = `${Math.floor(this.loadingProgress)}%`;
      }
      if (this.circle) {
          const offset = this.circumference - (this.loadingProgress / 100) * this.circumference;
          this.circle.style.strokeDashoffset = offset;
      }
    }
  
    startProgressSimulation() {
      let lastTargetUpdateTime = 0;
  
      const animate = (timestamp) => {
        if (this.isComplete) return;
  
        if (!this.isLoadFinished && timestamp - lastTargetUpdateTime > 150) {
          lastTargetUpdateTime = timestamp;
          if (this.targetProgress < 99) {
            let increment;
            if (this.targetProgress < 30) increment = Math.random() * 10 + 5;
            else if (this.targetProgress < 70) increment = Math.random() * 8 + 3;
            else if (this.targetProgress < 90) increment = Math.random() * 4 + 1;
            else increment = Math.random() * 2 + 0.5;
            this.targetProgress = Math.min(this.targetProgress + increment, 99);
          }
        }
  
        const diff = this.targetProgress - this.loadingProgress;
        if (Math.abs(diff) > 0.1) {
          const easingFactor = this.isLoadFinished ? 0.3 : 0.1;
          const step = diff * easingFactor;
          this.updateProgress(this.loadingProgress + step);
        } else if (this.isLoadFinished) {
          this.complete();
        } else {
          if (this.loadingProgress !== this.targetProgress) {
              this.updateProgress(this.targetProgress);
          }
        }
  
        this.animationFrameId = requestAnimationFrame(animate);
      };
  
      this.animationFrameId = requestAnimationFrame(animate);
    }
  
    stopProgressSimulation() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
  
    setupEventListeners() {
      setTimeout(() => {
        if (!this.isComplete) this.showFallbackMessage();
      }, 8000);
  
      this.overlay.addEventListener('click', (e) => {
        if (e.target.classList.contains('disable-overlay-btn')) {
          e.preventDefault();
          this.forceComplete();
        }
      });
  
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.stopProgressSimulation();
        else if (!this.isComplete) this.startProgressSimulation();
      });
    }
  
    showFallbackMessage() {
      const fallbackMessage = this.overlay.querySelector('.fallback-message');
      if (fallbackMessage) fallbackMessage.style.display = 'block';
    }
  
    async complete() {
      if (this.isComplete) return;
      this.isComplete = true;
      this.stopProgressSimulation();
  
      await anime({
        targets: this,
        loadingProgress: 100,
        duration: 400,
        easing: 'easeInOutQuad',
        update: () => this.updateProgress(this.loadingProgress)
      }).finished;
  
      const elapsedTime = Date.now() - this.startTime;
      const remainingTime = this.minLoadTime - elapsedTime;
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
  
      this.finishLoading();
    }
  
    async finishLoading() {
      await new Promise(resolve => setTimeout(resolve, 400));
      closeDropdown();
      
      await anime({
        targets: this.overlay.querySelector('.loading-container'),
        opacity: [1, 0],
        duration: ANIMATION_DURATIONS.loadingFadeOut,
        easing: 'easeInOutQuad'
      }).finished;
  
      const contentContainer = document.querySelector('.content-wrapper');
      if (contentContainer) contentContainer.style.opacity = 0;
      
      await Promise.all([
        anime({
          targets: this.overlay,
          translateX: ['0%', '100%'],
          duration: ANIMATION_DURATIONS.loadingContentSlide,
          easing: 'easeInOutQuad'
        }).finished,
        anime({
          targets: contentContainer,
          opacity: [0, 1],
          duration: ANIMATION_DURATIONS.loadingContentFadeIn,
          easing: 'easeInOutQuad'
        }).finished
      ]);
      
      this.remove();
    }
  
    forceComplete() {
      this.isComplete = true;
      this.remove();
    }
  
    remove() {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.remove();
      }
      this.stopProgressSimulation();
    }
  
    pageLoadFinished() {
      const elapsedTime = Date.now() - this.startTime;
      const remainingTime = this.minLoadTime - elapsedTime;
  
      setTimeout(() => {
        this.isLoadFinished = true;
        this.targetProgress = 99;
      }, Math.max(0, remainingTime));
    }
  }
  
  let loadingManager = null;
  const preloaderKey = 'preloaderShown';
  const isInitialVisit = !sessionStorage.getItem(preloaderKey);
  
  if (isInitialVisit) {
    loadingManager = new LoadingManager();
    window.addEventListener('load', () => {
      if (loadingManager) {
        loadingManager.pageLoadFinished();
        sessionStorage.setItem(preloaderKey, 'true');
      }
    });
  } else {
      const loadingOverlay = document.querySelector('.loading-overlay');
      if(loadingOverlay) loadingOverlay.remove();
  }

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
            head.appendChild(newTag.cloneNode(true))
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

function initializeVideo() {
    const video = document.getElementById('front__cover-video');
    video.load();
    video.addEventListener('canplay', () => {
        video.play()
    })
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
        dropdownCheckbox.checked = false;
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
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    })
}

document.addEventListener('DOMContentLoaded', () => {

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            if (window.location.pathname === '/') {
                const video = document.getElementById('front__cover-video');
                if (video) {
                    video.load();
                    video.play()
                }
            }
        }
    });

    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual'
    }

    barba.init({
        transitions: [{
            name: 'post-fade',
            from: {
                namespace: ['post']
            },
            to: {
                namespace: ['post']
            },
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
                gsap.set(homeContainer, {
                    opacity: 0
                });
                return Promise.all([overlayLeave(), gsap.to(homeContainer, {
                    opacity: 1,
                    duration: ANIMATION_DURATIONS.overlayLeave,
                    ease: ANIMATION_EASES.overlayLeave,
                }), ])
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

    barba.hooks.leave((data) => {
        if (['post'].includes(data.next.namespace)) {
            closeDropdown()
        }
    });

    barba.hooks.afterLeave(() => {
        const homeContainer = document.querySelector('[data-barba-namespace="home"]');
        if (homeContainer) {
            homeContainer.style.opacity = '';
            homeContainer.style.display = ''
        }
    });

    barba.hooks.beforeEnter((data) => {
        updateHead(data.next.html);
        updateFooter(data.next.html);
        updateFooterClass(data.next.namespace);
        if (data.next.namespace === 'home') {
            const video = document.getElementById('front__cover-video');
            video.load();
            video.play();
            video.loop = true
        }
    });

    barba.hooks.enter(() => {
        setTimeout(resetScrollPosition, 50)
    });

    barba.hooks.afterEnter((data) => {
        if (['post', 'default'].includes(data.next.namespace)) {
            setActiveLink()
        }
        if (data.next.namespace === 'home') {
            initializeVideo();
        }
        if (data.next.namespace === 'post') {
            initializeDropdown();
        }
    })
})