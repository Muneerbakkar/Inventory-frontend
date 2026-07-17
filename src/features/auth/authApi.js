import { baseApi } from '../api/baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    logoutApi: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    updateMe: builder.mutation({
      query: (data) => ({
        url: '/auth/update-me',
        method: 'PATCH',
        body: data,
      }),
    }),
    updatePassword: builder.mutation({
      query: (data) => ({
        url: '/auth/update-password',
        method: 'PATCH',
        body: data,
      }),
    }),
  }),
});

export const { useLoginMutation, useLogoutApiMutation, useUpdateMeMutation, useUpdatePasswordMutation } = authApi;
