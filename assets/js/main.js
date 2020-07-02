var fontA = new FontFaceObserver('Roboto');
 
Promise.all([fontA.load()]).then(function () {
  console.log('Lemonada & Merriweather have loaded');
});

// Show an element
var show = function (elem) {
	elem.classList.add('is-visible');
};
// Hide an element
var hide = function (elem) {
	elem.classList.remove('is-visible');
};
// Toggle element visibility
var toggle = function (elem) {
	elem.classList.toggle('is-visible');
};
// Listen for click events
document.addEventListener('click', function (event) {
	// Make sure clicked element is our toggle
	if (!event.target.classList.contains('toggle')) return;
	// Prevent default link behavior
	event.preventDefault();
    window.scrollTo(0,document.body.scrollHeight);
	// Get the content
	var content = document.querySelector(event.target.hash);
	if (!content) return;
	// Toggle the content
	toggle(content);
}, false);


var mq = window.matchMedia( "(min-width: 568px)" );
if (mq.matches) {
    // window width is at less than 570px
}
else {
    // window width is greater than 570px
}


localStorage.setItem('visited-'+window.location.pathname,true);
var links = document.getElementsByTagName('a');
for (i=0;i<links.length;i++) {   
  var link = links[i];
  if (link.host == window.location.host
  && localStorage.getItem('visited-' + link.pathname + '/')) {
    link.dataset.visited = true;
  }
}