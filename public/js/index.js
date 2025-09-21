import '@babel/polyfill';
import { displayMap } from './map';
import { login, logout, signup } from './auth';
import { updateSettings } from './updateSetting';
import { bookTour } from './paystack';
import { submitReview } from './review';

//DOM ELEMENT
const map = document.getElementById('map');
const signUpForm = document.querySelector('.form--signup');
const logInForm = document.querySelector('.form--login');
const reviewForm = document.querySelector('.form--review');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const logOutBtn = document.querySelector('.nav__el--logout');
const bookBtn = document.getElementById('book-tour');

//VALUES

//DELELGATION
if (map) {
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations
  );
  displayMap(locations);
}

if (signUpForm) {
  signUpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    signup(name, email, password, passwordConfirm);
  });
}

if (logInForm) {
  logInForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (reviewForm) {
  const ratingInput = document.getElementById('rating');
  const reviewText = document.getElementById('reviewText');
  const stars = document.querySelectorAll('.star-rating .star');
  let currentRating = 0;
  console.log(currentRating);

  stars.forEach((star, idx) => {
    star.addEventListener('mouseover', () => {
      highlightStars(idx + 1);
    });

    star.addEventListener('mouseout', () => {
      highlightStars(currentRating);
    });

    star.addEventListener('click', () => {
      currentRating = idx + 1;
      ratingInput.value = currentRating;
    });
  });

  const highlightStars = (rating) => {
    stars.forEach((star, idx) => {
      star.style.color = idx < rating ? 'gold' : 'grey';
      star.style.cursor = 'pointer';
    });
  };

  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rating = ratingInput.value;
    const review = reviewText.value.trim();
    const tour = reviewForm.dataset.tourId;
    console.log({ rating, review, tour });
    await submitReview(rating, review, tour);
    highlightStars(0);
    ratingInput.value = '';
    reviewText.value = '';
    stars.forEach((star) => {
      star.style.color = 'grey';
    });
  });
}

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    console.log(form);

    updateSettings(form, 'data');
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    console.log(tourId);
    bookTour(tourId);
  });
}
