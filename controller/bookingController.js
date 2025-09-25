const paystack = require('paystack-api')(process.env.PAYSTACK_SECRET_KEY);
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handleFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //Check that user have not book this tour before
  const booking = await Booking.findOne({
    tour: req.body.tourId,
    user: req.user.id,
  });
  if (booking) {
    return res.status(403).json({
      status: 'fail',
      message: 'You cannot book a tour twice',
    });
  }

  //1.) Get the currently booked tour
  const { tourId } = req.body;
  const tour = await Tour.findById(tourId);

  //2.) Create Paystack transaction
  const reference = `NATOURS_${uuidv4()}`;
  const payload = {
    amount: tour.price * 100, // Paystack uses kobo (multiply by 100)
    currency: 'NGN',
    email: req.user.email,
    callback_url: `${req.protocol}://${req.get('host')}/`,
    reference: reference,
    channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
  };

  try {
    const response = await paystack.transaction.initialize(payload);
    console.log('response...', response);

    if (response.status) {
      console.log('first reference', response.data.reference);
      const booking = await Booking.create({
        tour: tour._id,
        user: req.user._id,
        price: tour.price,
        reference: response.data.reference,
        status: 'pending',
      });
      console.log(`Pending booking created: ${booking._id}`);
      res.status(200).json({
        status: 'success',
        paymentLink: response.data.authorization_url,
        reference: response.data.reference,
        access_code: response.data.access_code,
        email: payload.email,
        amount: payload.amount,
        userId: req.user._id,
      });
    } else {
      return next(new AppError('Payment initialization failed', 400));
    }
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
});

exports.handlePaystackWebhook = catchAsync(async (req, res, next) => {
  console.log('webhook says hi');
  // 1. Verify the webhook signature
  const secret = process.env.PAYSTACK_SECRET_KEY;

  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  console.log('crypto-hash', hash);

  if (hash !== req.headers['x-paystack-signature']) {
    return next(new AppError('Invalid Paystack webhook signature', 401));
  }

  // 2. Process the event
  const { event, data } = req.body;
  console.log('Webhook event received:', event);

  if (event === 'charge.success') {
    const { reference, amount } = data;
    console.log('reference', reference);
    try {
      const booking = await Booking.findOneAndUpdate(
        { reference, status: 'pending' },
        { status: 'paid', price: amount / 100 },
        { new: true }
      );

      if (!booking) {
        console.log('No pending booking found for reference:', reference);
        return res.status(200).json({ status: 'success' });
      }
      console.log(
        `Booking updated to paid for reference: ${reference}`,
        booking
      );
    } catch (err) {
      console.log('Error updating booking:', err.message);
      return res.status(200).json({ status: 'success' });
    }
  } else if (event === 'charge.failed') {
    try {
      // Update booking to failed
      const booking = await Booking.findOneAndUpdate(
        { reference, status: 'pending' },
        { status: 'failed', paid: false },
        { new: true }
      );
      if (booking) {
        console.log(
          `Booking updated to failed for reference: ${reference}`,
          booking
        );
      }
    } catch (err) {
      console.error('Error updating booking:', err.message);
    }
  }

  // 3. Acknowledge the webhook
  res.status(200).json({ status: 'success' });
});

exports.getAllBookings = factory.getAll(Booking);
exports.getOneBooking = factory.getOne(Booking, { path: 'user' });
exports.updateBooking = factory.updateOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
