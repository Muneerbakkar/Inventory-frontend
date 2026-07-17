import { baseApi } from '../api/baseApi';

export const salesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query({
      query: (params) => ({ url: '/sales', params }),
      providesTags: ['Invoice'],
    }),
    getInvoiceById: builder.query({
      query: (id) => `/sales/${id}`,
      providesTags: (result, error, id) => [{ type: 'Invoice', id }],
    }),
    createInvoice: builder.mutation({
      query: (invoiceData) => ({
        url: '/sales',
        method: 'POST',
        body: invoiceData,
      }),
      // Invalidates product as stock is deducted, invoice, and referral as commission is updated
      invalidatesTags: ['Invoice', 'Product', 'Referral'],
    }),
    updateInvoice: builder.mutation({
      query: ({ id, ...invoiceData }) => ({
        url: `/sales/${id}`,
        method: 'PUT',
        body: invoiceData,
      }),
      invalidatesTags: ['Invoice', 'Product', 'Referral'],
    }),
    updateInvoicePayment: builder.mutation({
      query: ({ id, ...paymentData }) => ({
        url: `/sales/${id}/payment`,
        method: 'PATCH',
        body: paymentData,
      }),
      invalidatesTags: ['Invoice'],
    }),
    deleteInvoice: builder.mutation({
      query: (id) => ({
        url: `/sales/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Invoice', 'Product', 'Referral'],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetInvoiceByIdQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useUpdateInvoicePaymentMutation,
  useDeleteInvoiceMutation,
} = salesApi;
