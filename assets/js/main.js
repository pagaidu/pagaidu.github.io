const ANIMATION_DURATIONS = {
  overlayEnter: 0.8,
  overlayLeave: 0.8,
  fadeIn: 0.8,
  fadeOut: 0.8,
  loadingContentFadeIn: 1.6,
  preloaderFadeOut: 0.8,
  contentReveal: 0.8
};

const ANIMATION_EASES = {
  overlayEnter: 'power2.inOut',
  overlayLeave: 'power2.inOut',
  fadeIn: 'power2.out',
  fadeOut: 'power2.out'
};



function updateHead(newPageRawHTML) {

  const head = document.head;
  const newPageRawHead = newPageRawHTML.match(/<head[^>]*>([\s\S.]*)<\/head>/i)[1];
  const newPageHead = document.createElement('div');
  newPageHead.innerHTML = newPageRawHead;

  const selectors = [
    "meta[name='description']",
    "meta[property='og:description']"
  ];

  selectors.forEach(selector => {
    const existingTag = head.querySelector(selector);
    const newTag = newPageHead.querySelector(selector);

    if (existingTag && newTag) {
      existingTag.setAttribute('content', newTag.getAttribute('content'));
    } else if (newTag) {
      head.appendChild(newTag.cloneNode(true));
    }
  });
}

function updateFooter(newPageRawHTML) {
  const footer = document.querySelector('.footer');
  const newPageRawFooter = newPageRawHTML.match(/<footer[^>]*>([\s\S.]*)<\/footer>/i)[1];
  const newPageFooter = document.createElement('div');
  newPageFooter.innerHTML = newPageRawFooter;

  footer.innerHTML = newPageFooter.innerHTML;
  console.log('Footer updated');
}

function updateFooterClass(namespace) { 
  const footer = document.querySelector('.footer'); 
  if (footer) { // Check if the footer element exists
    if (namespace === 'home') { 
      footer.classList.add('index'); // Use a more descriptive class name
    } else { 
      footer.classList.remove('index'); 
    }
  }
}

function setActiveLink() {
  const currentPath = window.location.pathname.replace(/\/$/, '');
  const footerLinks = Array.from(document.querySelectorAll('.footer-link'));
  
  if (document.activeElement) {
    document.activeElement.blur();
  }

  const classesToAdd = [];
  const classesToRemove = [];

  footerLinks.forEach(link => {
    const linkPath = link.getAttribute('href').replace(/\/$/, '');
    if (linkPath === currentPath) {
      classesToAdd.push(link);
    } else {
      classesToRemove.push(link);
    }
  });

  // Batch class operations
  classesToRemove.forEach(link => link.classList.remove('active'));
  classesToAdd.forEach(link => link.classList.add('active'));
}

function initializeVideo() { 
  const video = document.getElementById('front__cover-video');
   if (video) { 
    video.play(); 
    } 
  }

function initializeDropdown() {
  seamless.polyfill();

  const dropdownToggles = document.querySelectorAll('.dropdown-toggle.js-only');
  const dropdownWrappers = document.querySelectorAll('.dropdown-wrapper');

  dropdownToggles.forEach((dropdownToggle, index) => {
    const dropdownWrapper = dropdownWrappers[index];

    dropdownToggle.addEventListener('click', function (event) {
      event.stopPropagation();

      const expanded = this.getAttribute('aria-expanded') === 'true';

      // Close all other dropdowns
      dropdownToggles.forEach((toggle, toggleIndex) => {
        const wrapper = dropdownWrappers[toggleIndex];
        if (toggle !== dropdownToggle) {
          toggle.setAttribute('aria-expanded', 'false');
          wrapper.classList.remove('open');
        }
      });

      // Toggle the clicked dropdown
      const isNowExpanded = !expanded;
      this.setAttribute('aria-expanded', isNowExpanded);
      dropdownWrapper.classList.toggle('open', isNowExpanded);

      // Scroll to dropdown if expanded
      if (isNowExpanded) {
        const offset = 30; // Adjust the space from the top
        const rect = dropdownWrapper.getBoundingClientRect();
        const targetScrollPosition = window.scrollY + rect.top - offset;

        // Smoothly scroll to the calculated position
        seamless.scrollTo(window, { top: targetScrollPosition, behavior: 'smooth' });
      }
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', function () {
    dropdownToggles.forEach((toggle, index) => {
      const wrapper = dropdownWrappers[index];
      toggle.setAttribute('aria-expanded', 'false');
      wrapper.classList.remove('open');
    });
  });
}

function closeDropdown() {
  const dropdownCheckbox = document.getElementById('dropdown-checkbox');
  const dropdownToggle = document.querySelector('.dropdown-toggle');

  if (dropdownCheckbox && dropdownToggle) {
      dropdownCheckbox.checked = false;
      dropdownToggle.setAttribute('aria-expanded', 'false');
  }

  const dropdownWrapper = document.querySelector('.dropdown-wrapper');
  if (dropdownWrapper) {
      dropdownWrapper.classList.remove('open');
  }
}

function overlayEnter() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    document.body.appendChild(overlay);

    gsap.to(overlay, {
      x: '0%',
      from: { x: '-100%' },
      duration: ANIMATION_DURATIONS.overlayEnter,
      ease: ANIMATION_EASES.overlayEnter,
      onComplete: resolve,
    });
  });
}

function overlayLeave() {
  return new Promise((resolve) => {
    const overlay = document.querySelector('.overlay');

    if (!overlay) {
      resolve(); // Fallback if overlay doesn't exist
      return;
    }

    gsap.to(overlay, {
      x: '100%',
      duration: ANIMATION_DURATIONS.overlayLeave,
      ease: ANIMATION_EASES.overlayLeave,
      onComplete: () => {
        overlay.remove();
        resolve();
      },
    });
  });
}

function gsapFade(element, fromOpacity, toOpacity, duration, ease, onComplete) {
  if (!element) {
    console.error('Element not found for gsapFade');
    return Promise.resolve(); // Return an immediately resolved promise if the element doesn't exist
  }
  
  return new Promise(resolve => {
    gsap.to(element, {
      opacity: toOpacity,
      duration: duration,
      ease: ease,
      onComplete: () => {
        if (onComplete) onComplete();
        resolve();
      },
      onStart: () => {
        element.style.opacity = fromOpacity.toString(); // Ensure starting opacity
      }
    });
  });
}

function resetScrollPosition() {
  console.log('Resetting scroll position');
  window.scrollTo({ top: 0, behavior: 'auto' });
  console.log(`Current scroll position: ${window.scrollY}`);
}

document.addEventListener('DOMContentLoaded', () => { 
  document.documentElement.className = document.documentElement.className.replace('no-js', 'js');
  initializeVideo();
  
    // Check if the preloader should run
    const preloaderKey = 'preloaderShown';
    const isInitialVisit = !sessionStorage.getItem(preloaderKey);

    const loadingOverlay = document.querySelector('.loading-overlay');
    const loadingCircleBase = document.querySelector('.loading-circle');
    const loadingCircle = document.querySelector('.circle-progress');
    const loadingText = document.querySelector('.loading-text');
    const fallbackMessage = document.querySelector('.fallback-message');

    // Show fallback message if loading takes too long
    setTimeout(() => {
      fallbackMessage.style.display = 'block';
    }, 10000);

    // Add event listener to disable overlay
    const disableOverlayLink = loadingOverlay.querySelector('.disable-overlay');
    disableOverlayLink.addEventListener('click', (event) => {
      event.preventDefault();
      loadingOverlay.style.display = 'none';
    });

    // Animate loading progress
    let progress = 0;

    const updateProgress = () => {
      const offset = (100 - progress) * (314 / 100); // 314 is the circumference of the circle
      loadingCircle.style.strokeDashoffset = offset;
    };

    const progressInterval = setInterval(() => {
      if (progress < 100) {
        progress += Math.random() * (progress < 20 ? 20 : 5); // Faster at the start
        progress = Math.min(progress, 100); // Cap at 100%
        updateProgress();
      } else {
        clearInterval(progressInterval);
      }
    }, 100);

    // Handle initial page load
    let initialLoad = true;

    window.addEventListener('load', async () => {
      if (initialLoad) {
        clearInterval(progressInterval);
        progress = 100;
        updateProgress();
    
        // Fade out text and circle
        await gsap.to([loadingText, loadingCircleBase, fallbackMessage], {
          opacity: 0,
          duration: ANIMATION_DURATIONS.fadeOut,
          ease: ANIMATION_EASES.fadeOut,
        });
    
        // Target content to hide initially
        const contentContainer = document.querySelector('.content-wrapper');
        if (contentContainer) {
          contentContainer.style.opacity = 0; // Ensure content starts hidden
        }
    
        // Transform loading-overlay into overlayLeave animation
        const overlayLeaveAnimation = gsap.to(loadingOverlay, {
          x: '100%', // Move overlay to the right
          duration: ANIMATION_DURATIONS.overlayLeave,
          ease: 'power2.inOut',
          onComplete: () => {
            loadingOverlay.remove(); // Remove preloader from DOM
          },
        });
    
        // Play overlayLeave animation and reveal content
        overlayLeaveAnimation.play(); // Start overlayLeave animation
        if (contentContainer) {
          await gsap.to(contentContainer, {
            opacity: 1,
            duration: ANIMATION_DURATIONS.fadeIn,
            ease: 'power2.out',
            delay: ANIMATION_DURATIONS.overlayLeave / 2, // Slight delay to sync with overlay
          });
        }
    
        // Mark initial load as completed
        initialLoad = false;
        sessionStorage.setItem(preloaderKey, 'true');
      }
    });
    
    

  initializeDropdown();

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  barba.hooks.afterLeave(() => { 
    resetScrollPosition(); 
    const homeContainer = document.querySelector('[data-barba-namespace="home"]');
    if (homeContainer) {
      homeContainer.style.opacity = ''; // Reset styles
      homeContainer.style.display = ''; 
    }
  }); 
  
  barba.hooks.beforeEnter((data) => { 
    updateHead(data.next.html); 
    updateFooter(data.next.html);
    updateFooterClass(data.next.namespace); 
  }); 

  barba.hooks.afterEnter(() => { 
    sessionStorage.removeItem('barba-transition');
  });

  barba.init({
    transitions: [
      {
        name: 'post-fade',
        from: { namespace: ['post'] },
        to: { namespace: ['post'] },
  
        leave(data) {
          resetScrollPosition();
          closeDropdown();
          const currentContainer = data.current.container.querySelector('.content-wrapper');
  
          return gsapFade(currentContainer, 1, 0, ANIMATION_DURATIONS.fadeOut, 'power2.out', () => {
            data.current.container.style.display = 'none';
          });
        },

        enter(data) {
          const nextContainer = data.next.container.querySelector('.content-wrapper');

          nextContainer.style.display = 'block';
          nextContainer.style.opacity = '0';

          return gsapFade(nextContainer, 0, 1, ANIMATION_DURATIONS.fadeIn, 'power2.inOut', initializeDropdown);
        },
      },
      {
        name: 'home-to-any',
        from: { namespace: ['home'] },
        to: { namespace: ['post', 'default'] },
  
        leave(data) {
          return overlayEnter().then(() => {
            data.current.container.style.display = 'none';
          });
        },
  
        enter(data) {
          const nextContainer = data.next.container.querySelector('.content-wrapper');
          nextContainer.style.opacity = '0';
          nextContainer.style.display = 'block';
          if (data.next.namespace === 'post') {
            initializeDropdown();
          }
          const timeline = gsap.timeline();
          timeline.add(overlayLeave()); // Overlay animation
          timeline.to(nextContainer, {
            opacity: 1,
            duration: ANIMATION_DURATIONS.overlayEnter * 2, // Match duration
            ease: 'power2.inOut',
          });
  
          return timeline.finished;
        },
      },
      {
        name: 'any-to-home',
        from: { namespace: ['post', 'default'] },
        to: { namespace: ['home'] },
  
        leave(data) {
          return overlayEnter().then(() => {
            data.current.container.style.display = 'none';
          });
        },
  
        enter(data) {
          const homeContainer = data.next.container;
          
          // Set initial state
          gsap.set(homeContainer, { opacity: 0 }); // Ensure it's visible but transparent
          
          // Create promises for both animations
          const overlayLeavePromise = overlayLeave();
          const fadeInPromise = gsap.to(homeContainer, {
            opacity: 1,
            duration: ANIMATION_DURATIONS.fadeIn * 2,
            ease: 'power2.inOut',
          }).then();
        
          // Run both animations at the same time
          return Promise.all([overlayLeavePromise, fadeInPromise]);
        },
      },
      {
        name: 'post-to-default',
        from: { namespace: ['post'] },
        to: { namespace: ['default'] },
  
        leave(data) {
          closeDropdown();
  
          return overlayEnter().then(() => {
            data.current.container.style.display = 'none';
          });
        },
  
        enter(data) {
          const nextContainer = data.next.container.querySelector('.content-wrapper');
  
          nextContainer.style.opacity = '0';
          nextContainer.style.display = 'block';
  
          const overlayLeavePromise = overlayLeave();
          const fadeInPromise = new Promise((resolve) => {
            gsap.to(nextContainer, {
              opacity: 1,
              duration: ANIMATION_DURATIONS.overlayEnter * 2,
              ease: 'power2.inOut',
              onComplete: resolve,
            });
          });
  
          return Promise.all([overlayLeavePromise, fadeInPromise]);
        },
      },
    ],
  });
});