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

    console.log('session.....', session);

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
        console.log('paystack res', response);
        if (response.status === 'success') {
          showAlert('success', 'Payment successful!');
          // window.location.reload();
          window.location.href = '/';
        }
      },
      onClose: function () {
        showAlert('error', 'Payment cancelled');
      },
    });
    handler.openIframe();
  } catch (err) {
    console.log(err);
    console.log(err.message);
    showAlert('error', 'An error occured');
  }
};
