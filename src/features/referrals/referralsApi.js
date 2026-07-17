import { baseApi } from '../api/baseApi';

export const referralsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReferrals: builder.query({
      query: (params) => ({ url: '/referrals', params }),
      providesTags: ['Referral'],
    }),
    getReferralById: builder.query({
      query: (id) => `/referrals/${id}`,
      providesTags: (result, error, id) => [{ type: 'Referral', id }],
    }),
    createReferral: builder.mutation({
      query: (referralData) => ({
        url: '/referrals',
        method: 'POST',
        body: referralData,
      }),
      invalidatesTags: ['Referral'],
    }),
    markAsPaid: builder.mutation({
      query: ({ id, amount }) => ({
        url: `/referrals/${id}/pay`,
        method: 'POST',
        body: { amount },
      }),
      invalidatesTags: ['Referral'],
    }),
    updateReferral: builder.mutation({
      query: ({ id, data }) => ({
        url: `/referrals/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Referral'],
    }),
    deleteReferral: builder.mutation({
      query: (id) => ({
        url: `/referrals/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Referral'],
    }),
  }),
});

export const {
  useGetReferralsQuery,
  useGetReferralByIdQuery,
  useCreateReferralMutation,
  useMarkAsPaidMutation,
  useUpdateReferralMutation,
  useDeleteReferralMutation,
} = referralsApi;
