import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId) => {
  try {
    const session = await axios({
      url: '/api/v1/bookings/checkout-session',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        tourId,
      },
    });

    const PAYSTACK_PUBLIC_KEY =
      'pk_test_e3eb58bd9657b232940c549f93546960b8a6df35';

    // 2) Open Paystack inline checkout
    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      access_code: session.data.access_code,
      ref: session.data.reference,
      email: session.data.email,
      amount: session.data.amount,
      callback: function (response) {
        if (response.status === 'success') {
          showAlert(
            'success',
            "Your booking was successful! Please check your email for a confirmation. If your booking doesn't show up here immediatly, please come back later.",
            30
          );
          window.location.href = '/my-tours';
        }
      },
      onClose: function () {
        showAlert('error', 'Payment cancelled');
        window.location.reload();
      },
    });
    handler.openIframe();
  } catch (err) {
    console.error(err.message);
    showAlert('error', 'An error occured');
  }
};
