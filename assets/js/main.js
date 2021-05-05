const toggle = document.querySelector('.menu-toggle');
const submenu = document.getElementById('saturs');
toggle.addEventListener('click', function(event) {
  submenu.classList.toggle('showSubMenu');
      event.preventDefault();
});

const arrow = document.querySelector('.menu-table-of-contents');
arrow.addEventListener('click', function(event) {
  event.target.classList.toggle('menu-table-of-contents-active');
});







    var elems = document.getElementsByClassName('license');
    var confirmIt = function (e) {
        if (!confirm('Vai esat drošs par došanos prom?')) e.preventDefault();
    };
    for (var i = 0, l = elems.length; i < l; i++) {
        elems[i].addEventListener('click', confirmIt, false);
    }