const express = require('express');
const bookingController = require('./../controller/bookingController');
const authController = require('./../controller/authController');

const router = express.Router();

router.use(authController.protect);

router.post('/checkout-session', bookingController.getCheckoutSession);

router.post('/webhook/paystack', bookingController.handlePaystackWebhook);

// router.post('/verify-payment/:reference', bookingController.verifyPayment);

router.use(authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getOneBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);
module.exports = router;
