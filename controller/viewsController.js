const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Review = require('../models/reviewModel');

exports.getOverview = catchAsync(async (req, res, next) => {
  //1. Get tour data from the collection
  const tours = await Tour.find();

  //2. Buld the template

  //3. Render the template using tour data from 1.
  res.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1. Get the data, for the requested tour including reviews and guides
  const { slug } = req.params;
  const tour = await Tour.findOne({ slug }).populate({
    path: 'reviews',
    //we do not need all the review fields so we specify the ones we need below
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with this name', 404));
  }
  let reviewed = false;
  let booked = false;

  //Check if the booked
  if (req.user) {
    const booking = await Booking.findOne({
      tour: tour._id,
      user: req.user.id,
      status: 'paid',
    });
    console.log('booking', booking);
    if (booking) {
      booked = true;
    }

    //Check if reviewed
    const review = await Review.findOne({
      tour: tour._id,
      user: req.user.id,
    });
    if (review) {
      reviewed = true;
    }
  }
  console.log(booked);

  //2. Build Templates

  //3.Render templates using data from 1.
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "connect-src 'self' https://cdnjs.cloudflare.com"
    )
    .render('tour', {
      title: `${tour.name} Tour`,
      tour,
      booked,
      reviewed,
    });
});

exports.getReviewForm = catchAsync(async (req, res, next) => {
  const { slug } = req.params;

  const tour = await Tour.findOne({ slug }).select('name');
  if (!tour) {
    return next(new AppError('There is no tour with this name', 404));
  }

  res.status(200).render('reviewForm', {
    title: 'Leave a review',
    tour,
  });
});

exports.getBookingPage = async (req, res, next) => {
  const user = await User.findById(req.user.id).populate({
    path: 'bookings',
    match: { status: 'paid' },
  });

  const tours = user.bookings.map((el) => el.tour).filter(Boolean);

  res.status(200).render('bookings', {
    title: 'My bookings',
    tours,
    bookingNav: true,
  });
};

exports.getReviewPage = async (req, res, next) => {
  const reviews = await Review.find({ user: req.user.id }).populate({
    path: 'tour',
    select: 'name',
  });
  console.log(reviews);

  res.status(200).render('reviews', {
    title: 'My Reviews',
    reviews,
    reviewNav: true,
  });
};

exports.getSignupForm = (req, res) => {
  const authType = 'signup';
  res.status(200).render('auth', {
    title: 'Log into your account',
    authType,
  });
};

exports.getLoginForm = (req, res) => {
  const authType = 'login';
  res.status(200).render('auth', {
    title: 'Create an account',
    authType,
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
    accountNav: true,
  });
};

// exports.updateUserData = catchAsync(async (req, res, next) => {
//   const updatedUser = await User.findByIdAndUpdate(
//     req.user.id,
//     {
//       name: req.body.name,
//       email: req.body.email,
//     },
//     {
//       new: true,
//       runValidators: true,
//     }
//   );
//   res.status(200).render('account', {
//     title: 'Your account',
//     user: updatedUser,
//   });
// });
