// basic JavaScript setup for the form.

console.log('script.js loaded'); // vheck that the file is linked correctly

//get the form and message area from the page
const form = document.getElementById('userForm');
const serverMessage = document.getElementById('serverMessage');

//listen for the form submit event
form.addEventListener('submit', (e) => {
  e.preventDefault(); // Stop the page from reloading

  // reset message styling
  serverMessage.className = 'server-msg';

  // temporary message to confirm submit is captured
  serverMessage.textContent =
    'Form submit captured (validation and server logic coming next).';
});
