const mongoose = require('mongoose');
const Tour = require('./tourModel');
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      trim: true,
      require: [true, 'Please enter your review'],
    },
    rating: {
      type: Number,
      min: 1.0,
      max: 5.0,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'What tour are you reviewing'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//To make sure a user only write a review on a tour once
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name',
  // });
  // next();

  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //In statics method this keyword points to the model like Review. Tour etc

  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },

    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  //this points to the correct review
  //this.tour is the current review tourId we're passing to calcAverageRating
  //Review.calcAverageRatings(this.tour);
  //this.constructor points to the current model(instead of using Review). this points to the current review and constructor points to the model that created that review

  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  //in query middleware like this one this points to the current query(find)
  //But we need the current document to the ratings calculations how do we go about it?
  //use .findOne() to find the document from the this query
  //this.r will save the document we found to the this property then we can access it in the post middleware or another query middleware bc it is the same this property.
  this.r = await this.findOne();
  console.log(this.r);
  next();
  //we can't calc the ratting yet bc this is a pre middleware and the query (update or delete) has not yet been executed. To do the calc. we use post middleware
});

reviewSchema.post(/^findOneAnd/, async function () {
  // await .this.findOne() will not work here bc since it is a post middleware the query has already been executed

  //this.r is the current review doc we found in the pre-middleware and .constructor gives us the model that created that review
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
