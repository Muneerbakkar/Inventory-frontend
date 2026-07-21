import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout } from '../auth/authSlice';
import toast from 'react-hot-toast';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')}/api`,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});



const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // If we receive a 401 Unauthorized (e.g. from an expired token), automatically log the user out
  if (result.error && result.error.status === 401) {
    api.dispatch(logout());
    toast.error('Session expired. Please log in again.');
  }
  
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Supplier', 'User', 'Product', 'GstSlab', 'StockAdjustment', 'Category', 'Customer', 'Invoice', 'Referral'],
  endpoints: () => ({}),
});
