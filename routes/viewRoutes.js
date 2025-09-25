const express = require('express');
const viewController = require('./../controller/viewsController');
const authController = require('./../controller/authController');
const router = express.Router();

router.get('/', authController.isLoggedIn, viewController.getOverview);
router.get(
  '/review/:slug',
  authController.protect,
  authController.isLoggedIn,
  viewController.getReviewForm
);
router.get(
  '/tour/:slug',
  authController.isLoggedIn,
  viewController.getTour
);
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/signup', authController.isLoggedIn, viewController.getSignupForm);
router.get('/me', authController.protect, viewController.getAccount);
router.get('/my-tours', authController.protect, viewController.getBookingPage);
router.get('/my-reviews', authController.protect, viewController.getReviewPage);

// router.post(
//   '/submit-user-data',
//   authController.protect,
//   viewController.updateUserData
// );

module.exports = router;
