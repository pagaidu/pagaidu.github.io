var fontA = new FontFaceObserver('Lemonada');
var fontB = new FontFaceObserver('Merriweather');
 
Promise.all([fontA.load(), fontB.load()]).then(function () {
  console.log('Lemonada & Merriweather have loaded');
});