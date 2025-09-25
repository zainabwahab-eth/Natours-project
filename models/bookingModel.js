const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a tour'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a user'],
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  reference: {
    type: String,
    require: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
});

bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({
    path: 'tour',
    select: '-guides -description',
  });

  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
