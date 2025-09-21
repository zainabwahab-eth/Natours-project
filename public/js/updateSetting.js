import axios from 'axios';
import { showAlert } from './alert';

//type is either 'passsword' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url = type === 'password' ? 'http://localhost:3000/api/v1/users/updateMyPassword': 'http://localhost:3000/api/v1/users/updateMe'
    const res = await axios({
      method: 'PATCH',
      url,
      data
    });
    
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} has been successfully updated`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
