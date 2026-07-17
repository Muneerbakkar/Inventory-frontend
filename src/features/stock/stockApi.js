import { baseApi } from '../api/baseApi';

export const stockApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdjustmentHistory: builder.query({
      query: (params) => ({ url: '/stock-adjustments', params }),
      providesTags: ['StockAdjustment'],
    }),
    createAdjustment: builder.mutation({
      query: (body) => ({ url: '/stock-adjustments', method: 'POST', body }),
      // Invalidating Product to reflect new quantity, and StockAdjustment to refresh history
      invalidatesTags: (result, error, { product }) => [
        'StockAdjustment', 
        { type: 'Product', id: product },
        'Product'
      ],
    }),
  }),
});

export const {
  useGetAdjustmentHistoryQuery,
  useCreateAdjustmentMutation,
} = stockApi;
