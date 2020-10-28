

const toggle = document.querySelector('.toggle');
const submenu = document.getElementById('saturs');

toggle.addEventListener('click', function(e) {
   
  submenu.classList.toggle('showSubMenu');
      e.preventDefault();
});


var arrow = document.querySelector('.menu-table-of-contents');
arrow.addEventListener('click', function(event) {
  event.target.classList.toggle('menu-table-of-contents-active');
});