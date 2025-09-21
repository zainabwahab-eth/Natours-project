import axios from 'axios';
import { showAlert } from './alert';

export const submitReview = async (rating, review, tour) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/reviews',
      data: {
        rating,
        review,
        tour,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Review Sent successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
