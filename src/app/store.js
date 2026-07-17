import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '../features/api/baseApi';
import authReducer from '../features/auth/authSlice';
import '../features/users/userApi';
import '../features/gst/gstApi';
import '../features/products/productApi';
import '../features/stock/stockApi';
import '../features/categories/categoryApi';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});
