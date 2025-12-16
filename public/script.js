// client-side validation

// regex rules
const namePattern = /^[A-Za-z0-9]{1,20}$/;        // letters and numbers, max 20
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\d{10}$/;                  // exactly 10 digits
const eircodePattern = /^[0-9][A-Za-z0-9]{5}$/;   // starts with number, 6 chars

// get the form element
const form = document.getElementById('userForm');

// store all input fields in one object
const fields = {
  firstName: document.getElementById('firstName'),
  secondName: document.getElementById('secondName'),
  email: document.getElementById('email'),
  phone: document.getElementById('phone'),
  eircode: document.getElementById('eircode')
};

// store error message
const errors = {
  firstName: document.getElementById('firstNameError'),
  secondName: document.getElementById('secondNameError'),
  email: document.getElementById('emailError'),
  phone: document.getElementById('phoneError'),
  eircode: document.getElementById('eircodeError')
};

const serverMessage = document.getElementById('serverMessage');
const submitBtn = document.getElementById('submitBtn');

// validate one field using its regex rule
function validateField(key, pattern, message) {
  const value = fields[key].value.trim();
  const valid = pattern.test(value);
  errors[key].textContent = valid ? '' : message;
  return valid;
}

// check all fields in the form
function validateForm() {
  const v1 = validateField('firstName', namePattern,
    'first name must be alphanumeric and max 20 characters.');

  const v2 = validateField('secondName', namePattern,
    'second name must be alphanumeric and max 20 characters.');

  const v3 = validateField('email', emailPattern,
    'please enter a valid email address.');

  const v4 = validateField('phone', phonePattern,
    'phone number must be exactly 10 digits.');

  const v5 = validateField('eircode', eircodePattern,
    'eircode must start with a number and be 6 characters.');

  return v1 && v2 && v3 && v4 && v5;
}

// run validation while the user is typing
Object.keys(fields).forEach(key => {
  fields[key].addEventListener('input', validateForm);
});

// handle form submit
form.addEventListener('submit', (e) => {
  e.preventDefault();

  serverMessage.textContent = '';
  serverMessage.className = 'server-msg';

  // show error message if validation failed
  if (!validateForm()) {
    serverMessage.className = 'server-msg error';
    serverMessage.textContent = 'please fix the errors above.';
    return;
  }

  // success message
  serverMessage.className = 'server-msg success';
  serverMessage.textContent = 'client-side validation passed.';
});
