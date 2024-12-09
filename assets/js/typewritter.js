// animations.js
const TRANSITION_DURATION = 30000; // Consistent transition speed across files

// Function to fade in content for page transitions
function fadeInContent(element, speed = TRANSITION_DURATION) {
  return new Promise((resolve) => {
    element.style.opacity = '0'; // Initially hide element
    element.style.transition = `opacity ${speed}ms ease`;

    // Trigger reflow to start transition
    element.offsetHeight;

    // Start fade-in effect
    element.style.opacity = '1';

    // Resolve promise after transition ends
    setTimeout(resolve, speed);
  });
}
