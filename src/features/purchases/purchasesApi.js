import { baseApi } from '../api/baseApi';

export const purchasesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPurchaseBills: builder.query({
      query: (params) => ({ url: '/purchases', params }),
      providesTags: ['Purchase'],
    }),
    getPurchaseBillById: builder.query({
      query: (id) => `/purchases/${id}`,
      providesTags: (result, error, id) => [{ type: 'Purchase', id }],
    }),
    createPurchaseBill: builder.mutation({
      query: (data) => ({
        url: '/purchases',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Purchase', 'Product'],
    }),
    updatePurchaseBill: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/purchases/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Purchase', 'Product'],
    }),
    updatePurchasePaymentStatus: builder.mutation({
      query: ({ id, ...paymentData }) => ({
        url: `/purchases/${id}/payment`,
        method: 'PATCH',
        body: paymentData,
      }),
      invalidatesTags: ['Purchase'],
    }),
    deletePurchaseBill: builder.mutation({
      query: (id) => ({
        url: `/purchases/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Purchase', 'Product'],
    }),
    
    getPurchaseReturns: builder.query({
      query: (params) => ({ url: '/purchase-returns', params }),
      providesTags: ['PurchaseReturn'],
    }),
    getPurchaseReturnById: builder.query({
      query: (id) => `/purchase-returns/${id}`,
      providesTags: (result, error, id) => [{ type: 'PurchaseReturn', id }],
    }),
    createPurchaseReturn: builder.mutation({
      query: (data) => ({
        url: '/purchase-returns',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PurchaseReturn', 'DebitNote', 'Product'],
    }),
    updatePurchaseReturn: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/purchase-returns/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['PurchaseReturn', 'DebitNote', 'Product'],
    }),
    deletePurchaseReturn: builder.mutation({
      query: (id) => ({
        url: `/purchase-returns/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PurchaseReturn', 'DebitNote', 'Product'],
    }),

    getDebitNotes: builder.query({
      query: (params) => ({ url: '/debit-notes', params }),
      providesTags: ['DebitNote'],
    }),
    updateDebitNoteStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/debit-notes/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['DebitNote'],
    }),
    deleteDebitNote: builder.mutation({
      query: (id) => ({
        url: `/debit-notes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DebitNote'],
    }),
  }),
});

export const {
  useGetPurchaseBillsQuery,
  useGetPurchaseBillByIdQuery,
  useCreatePurchaseBillMutation,
  useUpdatePurchaseBillMutation,
  useUpdatePurchasePaymentStatusMutation,
  useDeletePurchaseBillMutation,
  useGetPurchaseReturnsQuery,
  useGetPurchaseReturnByIdQuery,
  useCreatePurchaseReturnMutation,
  useUpdatePurchaseReturnMutation,
  useDeletePurchaseReturnMutation,
  useGetDebitNotesQuery,
  useUpdateDebitNoteStatusMutation,
  useDeleteDebitNoteMutation,
} = purchasesApi;
