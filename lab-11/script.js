'use strict';

const form = document.getElementById('form');
const card = document.getElementById('card');
const lock = document.getElementById('lock');
const errorBox = document.getElementById('error');
const submitBtn = document.getElementById('submit');
const labelEl = submitBtn.querySelector('.label');
const toggleBtn = document.getElementById('toggle');
const userInput = document.getElementById('username');
const passInput = document.getElementById('password');

// If already signed in, skip the form.
fetch('/api/me').then((r) => { if (r.ok) window.location.replace('/welcome'); }).catch(() => {});

toggleBtn.addEventListener('click', () => {
  const show = passInput.type === 'password';
  passInput.type = show ? 'text' : 'password';
  toggleBtn.textContent = show ? 'Hide' : 'Show';
  toggleBtn.setAttribute('aria-pressed', String(show));
  toggleBtn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
});

function showError(message, fields = []) {
  errorBox.textContent = message;
  errorBox.classList.add('show');

  document.querySelectorAll('.field').forEach((f) => f.classList.remove('invalid'));
  fields.forEach((input) => input.parentElement.classList.add('invalid'));

  // Restart the shake and lock animations.
  card.classList.remove('shake');
  lock.classList.remove('denied');
  void card.offsetWidth;
  card.classList.add('shake');
  lock.classList.add('denied');
}

function clearError() {
  errorBox.classList.remove('show');
  lock.classList.remove('denied');
  document.querySelectorAll('.field').forEach((f) => f.classList.remove('invalid'));
}

function setLoading(on) {
  submitBtn.disabled = on;
  submitBtn.classList.toggle('loading', on);
}

[userInput, passInput].forEach((i) => i.addEventListener('input', clearError));
card.addEventListener('animationend', (e) => { if (e.animationName === 'shake') card.classList.remove('shake'); });

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  const username = userInput.value.trim();
  const password = passInput.value;

  if (!username || !password) {
    const missing = [!username && userInput, !password && passInput].filter(Boolean);
    showError('Enter both your username and password.', missing);
    missing[0].focus();
    return;
  }

  setLoading(true);
  const startedAt = Date.now();

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));

    // Keep the spinner visible briefly so the transition feels smooth.
    const wait = Math.max(0, 450 - (Date.now() - startedAt));
    await new Promise((r) => setTimeout(r, wait));

    if (res.ok && data.ok) {
      setLoading(false);
      submitBtn.classList.add('ok');
      labelEl.textContent = 'Signed in';
      lock.classList.add('open');
      setTimeout(() => {
        card.style.transition = 'opacity .35s, transform .35s';
        card.style.opacity = '0';
        card.style.transform = 'translateY(-12px) scale(.98)';
      }, 750);
      setTimeout(() => window.location.assign(data.redirect || '/welcome'), 1100);
    } else {
      setLoading(false);
      showError(data.message || 'Username or password is incorrect.', [userInput, passInput]);
      passInput.select();
    }
  } catch {
    setLoading(false);
    showError('Cannot reach the server. Check your connection and try again.');
  }
});
