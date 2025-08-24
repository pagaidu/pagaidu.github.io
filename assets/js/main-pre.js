document.addEventListener('DOMContentLoaded', () => { 
  // Define animation durations
  const ANIMATION_DURATIONS = {
    overlayEnter: 600,
    overlayLeave: 600,
    fadeIn: 600,
    fadeOut: 600,
    loadingFadeOut: 0,
    loadingDots: 500, // Interval for the loading dots animation
    fadeOverlap: 200 // Overlap between overlay leave and fade-in
  };

  // Show loading overlay on initial load
  const loadingOverlay = document.createElement('div');
  loadingOverlay.classList.add('loading-overlay');
  loadingOverlay.innerHTML = `
    <div class="loading-text">Pagaidi</div>
    <div class="dots"></div>
    <div class="loading-percentage">0%</div>
    <div class="fallback-message" style="display: none;">
      If loading takes too long, please visit the site even if not fully loaded.
      <a href="#" class="disable-overlay">Disable overlay</a>
    </div>
  `;
  document.body.appendChild(loadingOverlay);

  const dots = loadingOverlay.querySelector('.dots');
  const loadingPercentage = loadingOverlay.querySelector('.loading-percentage');
  let dotCount = 0;
  const maxDots = 3; // Maximum number of dots to display before resetting

  setInterval(() => {
    // Add one dot each time until maxDots
    if (dotCount < maxDots) {
      dots.textContent += '.';
      dotCount++;
    } else {
      // Reset to 0 dots after maxDots
      dots.textContent = '';
      dotCount = 0;
    }
  }, ANIMATION_DURATIONS.loadingDots);

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
  }, 100); // Adjust the interval as needed

  window.addEventListener('load', () => {
    // Remove loading overlay once the page is fully loaded
    clearInterval(loadingInterval);
    updateLoadingPercentage(100); // Ensure it shows 100%
    overlayEnter().then(() => {
      closeDropdown();
      anime({
        targets: loadingOverlay,
        opacity: [1, 0],
        duration: ANIMATION_DURATIONS.loadingFadeOut,
        easing: 'easeInOutQuad',
        complete: () => {
          loadingOverlay.remove();
          overlayLeave();
        }
      });
    });
  });

  function fadeOut(container) {
    return new Promise((resolve) => {
      if (container) {
        anime({
          targets: container,
          opacity: [1, 0],
          duration: ANIMATION_DURATIONS.fadeOut,
          easing: 'easeInOutQuad',
          complete: () => {
            container.style.display = 'none';
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  function fadeIn(container) { 
    return new Promise((resolve) => { 
      if (container) { 
        container.style.display = 'block'; 
        container.style.opacity = '0'; 
        anime({ 
          targets: container, 
          opacity: [0, 1], 
          duration: ANIMATION_DURATIONS.fadeIn, 
          easing: 'easeInOutQuad', 
          complete: resolve // Resolve the promise when the animation completes 
        }); 
      } else { 
        resolve(); // Resolve the promise immediately if there's no container
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
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function closeDropdown() { 
    const dropdownCheckbox = document.getElementById('dropdown-checkbox'); 
    if (dropdownCheckbox && dropdownCheckbox.checked) { 
      dropdownCheckbox.checked = false; 
    } 
  }

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  barba.init({ 
    transitions: [
      {
        name: 'post-fade',
        from: { namespace: ['post'] },
        to: { namespace: ['post'] },
        
        leave(data) {
          const currentContainer = data.current.container.querySelector('.content-wrapper');
          closeDropdown();
          return fadeOut(currentContainer);
        },
        
        enter(data) {
          const nextContainer = data.next.container.querySelector('.content-wrapper');
          fadeIn(nextContainer);
        }
      },
      {
        name: 'home-to-any',
        from: { namespace: ['home'] },
        to: { namespace: ['post', 'contact', 'other'] },
        
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
        name: 'any-to-home',
        from: { namespace: ['post', 'contact', 'other'] },
        to: { namespace: ['home'] },

        leave(data) {
          return overlayEnter().then(() => {
            data.current.container.style.display = 'none';
          });
        },

        enter(data) {
          const nextContainer = data.next.container.querySelector('.content-wrapper');
          return overlayLeave().then(() => {
            fadeIn(nextContainer);
          });
        }
      }
    ]
  });

  barba.hooks.before(() => {
    resetScrollPosition();
  });

  barba.hooks.beforeEnter(() => {
    resetScrollPosition();
  });

  barba.hooks.after(() => {
    resetScrollPosition();
  });

  barba.hooks.enter(() => {
    resetScrollPosition();
  });

  barba.hooks.afterEnter(() => {
    resetScrollPosition();
  });
});
