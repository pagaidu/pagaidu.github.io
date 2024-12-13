const ANIMATION_DURATIONS = {
  overlayEnter: 700,
  overlayLeave: 700,
  fadeIn: 800,
  fadeOut: 800,
  loadingFadeOut: 700,
  loadingDots: 500, 
  fadeOverlap: 300,
  loadingContentFadeIn:1600,
  loadingContentSlide:700

};
// Show loading overlay on initial load
const loadingOverlay = document.createElement('div');
loadingOverlay.classList.add('loading-overlay');
loadingOverlay.innerHTML = `
  <div class="loading-text">Pagaidi</div>
  <div class="loading-percentage">0%</div>
  <div class="fallback-message" style="display: none;">
    Ielāde rit neraksturīgi ilgi.
    <a href="#" class="disable-overlay">Apmeklē vietni, kaut tā nav pilnībā ielādējusies.</a>
  </div>
`;
document.body.appendChild(loadingOverlay);

const loadingPercentage = loadingOverlay.querySelector('.loading-percentage');

// Add fallback message if loading takes too long
setTimeout(() => {
  const fallbackMessage = loadingOverlay.querySelector('.fallback-message');
  fallbackMessage.style.display = 'block';
}, 10000);

// Add event listener to disable overlay
const disableOverlayLink = loadingOverlay.querySelector('.disable-overlay');
disableOverlayLink.addEventListener('click', (event) => {
  event.preventDefault();
  loadingOverlay.remove();
});

// Update loading percentage
const updateLoadingPercentage = (percentage) => {
  loadingPercentage.textContent = `${Math.floor(percentage)}%`;
};

// Simulate loading progress
let loadingProgress = 0;
const loadingInterval = setInterval(() => {
  if (loadingProgress < 100) {
    const increment = loadingProgress < 20 ? Math.random() * 20 : Math.random() * 5;
    loadingProgress += increment;
    if (loadingProgress > 100) loadingProgress = 100; // Cap at 100%
    updateLoadingPercentage(loadingProgress);
  } else {
    clearInterval(loadingInterval);
  }
}, 100);

let initialLoad = true; // Track if this is the initial page load

window.addEventListener('load', async () => {
  if (initialLoad) {
    clearInterval(loadingInterval);
    updateLoadingPercentage(100);
    closeDropdown();
    // Fade out the innerHTML of the loading overlay
    await anime({
      targets: loadingOverlay.children,
      opacity: [1, 0],
      duration: ANIMATION_DURATIONS.loadingFadeOut,
      easing: 'easeInOutQuad'
    }).finished;

    // Uncover the content by sliding the overlay out to the right and fading in the content simultaneously
    const contentContainer = document.querySelector('.fadein'); // Adjust selector as needed
    contentContainer.style.opacity = 0; // Ensure content starts with opacity 0
    await Promise.all([
      anime({
        targets: loadingOverlay,
        translateX: ['0%', '100%'], // Slide out to the right
        duration: ANIMATION_DURATIONS.loadingContentSlide,
        easing: 'easeInOutQuad'
      }).finished,
      anime({
        targets: contentContainer,
        opacity: [0, 1], // Fade in the content
        duration: ANIMATION_DURATIONS.loadingContentFadeIn,
        easing: 'easeInOutQuad'
      }).finished
    ]);
    loadingOverlay.remove(); // Remove preloader from DOM
    initialLoad = false; // Set initial load to false after finishing the animation
  }
});

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
  const currentPath = window.location.pathname.replace(/\/$/, ''); // Normalize trailing slash
  const footerLinks = document.querySelectorAll('.footer-link');

  // Remove focus from any currently focused element
  if (document.activeElement) {
    document.activeElement.blur();
  }

  footerLinks.forEach(link => {
    const linkPath = link.getAttribute('href').replace(/\/$/, ''); // Normalize trailing slash
    if (linkPath === currentPath) {
      link.classList.add('active'); // Add active class to the matching link
    } else {
      link.classList.remove('active'); // Remove active class from non-matching links
    }
  });
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

function fadeOut(container) {
  return new Promise((resolve) => {
    if (container) {
      anime({
        targets: container,
        opacity: [1, 0],
        duration: ANIMATION_DURATIONS.fadeOut,
        easing: 'easeInOutQuad',
        complete: () => {
          resolve();
        },
      });
    } else {
      resolve();
    }
  });
}

function fadeIn(container) {
  return new Promise((resolve) => {
    if (container) {
      // Ensure container is hidden and then fade in
      container.style.visibility = 'hidden';
      container.style.opacity = '0';

      requestAnimationFrame(() => {
        container.style.visibility = 'visible';
        anime({
          targets: container,
          opacity: [0, 1],
          duration: ANIMATION_DURATIONS.fadeIn,
          easing: 'easeInOutQuad',
          complete: resolve,
        });
      });
    } else {
      resolve();
    }
  });
}

function overlayEnter() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    document.body.appendChild(overlay);

    anime({
      targets: overlay,
      translateX: ['-100%', '0%'],
      duration: ANIMATION_DURATIONS.overlayEnter,
      easing: 'easeInOutQuad',
      complete: resolve
    });
  });
}

function overlayLeave() {
  return new Promise((resolve) => {
    const overlay = document.querySelector('.overlay');
    anime({
      targets: overlay,
      translateX: ['0%', '100%'],
      duration: ANIMATION_DURATIONS.overlayLeave,
      easing: 'easeInOutQuad',
      complete: () => {
        overlay.remove();
        resolve();
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
  initializeDropdown();

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }



  barba.hooks.afterLeave(() => { 
    resetScrollPosition(); 
    }); 
  barba.hooks.beforeEnter((data) => { 
      updateHead(data.next.html); 
      setActiveLink(); 
      updateFooterClass(data.next.namespace); 
  }); 

  barba.init({
    transitions: [
      {
        name: 'post-fade',
        from: { namespace: ['post'] },
        to: { namespace: ['post'] },
        beforeLleave() {
        },   
        leave(data) {
          resetScrollPosition(); 
          closeDropdown();
          const currentContainer = data.current.container.querySelector('.content-wrapper');

          return fadeOut(currentContainer).then(() => { 
            data.current.container.style.display = 'none'; 
          })
        },
        
        enter(data) {
          const nextContainer = data.next.container.querySelector('.content-wrapper'); 
          nextContainer.style.opacity = '0'; 
          nextContainer.style.display = 'block'; 
          return fadeIn(nextContainer).then(() => { 
            initializeDropdown(); 
          });
        }
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
            setTimeout(() => {
              fadeIn(nextContainer);
              resolve();
            }, ANIMATION_DURATIONS.fadeOverlap);
          });
          return Promise.all([overlayLeavePromise, fadeInPromise]);
        }
      },
      {
        name: 'default-to-default',
        from: { namespace: ['default'] },
        to: { namespace: ['default'] },
        
        leave(data) {

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
            setTimeout(() => {
              fadeIn(nextContainer);
              resolve();
            }, ANIMATION_DURATIONS.fadeOverlap);
          });
          return Promise.all([overlayLeavePromise, fadeInPromise]);
        }
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
          initializeDropdown();
          const overlayLeavePromise = overlayLeave();
          const fadeInPromise = new Promise((resolve) => {
            setTimeout(() => {
              fadeIn(nextContainer);
              resolve();
            }, ANIMATION_DURATIONS.fadeOverlap);
          });
          return Promise.all([overlayLeavePromise, fadeInPromise]);
        }
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
      
        enter(data) { // Fade in the new content 
          const newContainer = document.querySelector('.fadein');
          newContainer.style.opacity = 0; 
          return Promise.all([ 
            overlayLeave(), 
            anime({ 
              targets: newContainer, 
              opacity: [0, 1],
              duration: ANIMATION_DURATIONS.loadingContentFadeIn, 
              easing: 'easeInOutQuad' 
            }).finished 
          ]).then(() => {
            initializeVideo();
          });
        }
      }      
    ],
  });




  


  
});
