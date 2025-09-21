const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const Review = require('./../models/reviewModel');
const factory = require('./handleFactory');

exports.setTourUserId = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

//Check if user has book a tour (b4 leaving a review)
exports.checkUserBooking = catchAsync(async (req, res, next) => {
  const tour = req.body.tour;
  const user = req.user.id;

  const booking = await Booking.findOne({ tour, user });
  if (!booking) {
    return res.status(403).json({
      status: 'fail',
      message: 'You can only review a tour you booked',
    });
  }
  next();
});

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.addReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
