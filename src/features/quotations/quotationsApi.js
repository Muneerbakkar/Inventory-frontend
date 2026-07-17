import { baseApi } from '../api/baseApi';

export const quotationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getQuotations: builder.query({
      query: (params) => ({ url: '/quotations', params }),
      providesTags: ['Quotation'],
    }),
    getQuotationById: builder.query({
      query: (id) => `/quotations/${id}`,
      providesTags: (result, error, id) => [{ type: 'Quotation', id }],
    }),
    createQuotation: builder.mutation({
      query: (data) => ({
        url: '/quotations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Quotation'],
    }),
    convertToInvoice: builder.mutation({
      query: ({ id, data }) => ({
        url: `/quotations/${id}/convert`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Quotation', 'Invoice', 'Product'],
    }),
    updateQuotation: builder.mutation({
      query: ({ id, data }) => ({
        url: `/quotations/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Quotation', id }, 'Quotation'],
    }),
    deleteQuotation: builder.mutation({
      query: (id) => ({
        url: `/quotations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Quotation'],
    }),
    updateQuotationStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/quotations/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Quotation', id }, 'Quotation'],
    }),
  }),
});

export const {
  useGetQuotationsQuery,
  useGetQuotationByIdQuery,
  useCreateQuotationMutation,
  useConvertToInvoiceMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
  useUpdateQuotationStatusMutation,
} = quotationsApi;
