const paystack = require('paystack-api')(process.env.PAYSTACK_SECRET_KEY);
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
  const payload = {
    amount: tour.price * 100, // Paystack uses kobo (multiply by 100)
    currency: 'NGN',
    email: req.user.email,
    callback_url: `${req.protocol}://${req.get('host')}/`,
    metadata: {
      tourId: tour._id,
      userId: req.user._id,
      tourName: tour.name,
      userName: req.user.name,
    },
    channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
  };

  try {
    const response = await paystack.transaction.initialize(payload);
    console.log('response...', response);

    if (response.status) {
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
  // 1. Verify the webhook signature
  const secret = process.env.PAYSTACK_SECRET_KEY; // Store in .env
  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  if (hash !== req.headers['x-paystack-signature']) {
    return next(new AppError('Invalid Paystack webhook signature', 401));
  }

  // 2. Process the event
  const { event, data } = req.body;
  console.log('Webhook event received:', event, data);

  if (event === 'charge.success') {
    const { reference, amount, metadata } = data;

    // Validate metadata
    const { tourId, userId } = metadata;
    if (!tourId || !userId) {
      console.log('Missing tourId or userId in metadata:', metadata);
      return res.status(200).json({ status: 'success' }); // Return 200 to avoid retries
    }

    // Create booking
    await Booking.create({
      tour: tourId,
      user: userId,
      price: amount / 100, // Convert kobo to NGN
      reference,
      paid: true,
    });

    console.log(`Booking created for reference: ${reference}`);
  }

  // 3. Acknowledge the webhook
  res.status(200).json({ status: 'success' });
});

// exports.verifyPayment = catchAsync(async (req, res, next) => {
//   const { reference } = req.params;
//   const { tourId, userId } = req.body;

//   try {
//     const response = await paystack.transaction.verify({
//       reference,
//     });
//     console.log(response);

//     if (response.status && response.data.status === 'success') {
//       // const { metadata } = response.data;
//       await Booking.create({
//         tour: tourId,
//         user: userId,
//         price: response.data.amount / 100,
//         reference,
//         paid: true,
//       });

//       res.status(200).json({
//         status: 'success',
//         message: 'Payment verified successfully',
//         data: response.data,
//       });
//     } else {
//       return next(new AppError('Payment verification failed', 400));
//     }
//   } catch (err) {
//     return next(new AppError(err.message, 500));
//   }
// });

exports.getAllBookings = factory.getAll(Booking);
exports.getOneBooking = factory.getOne(Booking, { path: 'user' });
exports.updateBooking = factory.updateOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
