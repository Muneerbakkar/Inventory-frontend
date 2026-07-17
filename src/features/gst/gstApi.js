import { baseApi } from '../api/baseApi';

export const gstApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGstSlabs: builder.query({
      query: () => '/gst',
      providesTags: ['GstSlab'],
    }),
    createGstSlab: builder.mutation({
      query: (body) => ({ url: '/gst', method: 'POST', body }),
      invalidatesTags: ['GstSlab'],
    }),
    updateGstSlab: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/gst/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['GstSlab'],
    }),
    deleteGstSlab: builder.mutation({
      query: (id) => ({ url: `/gst/${id}`, method: 'DELETE' }),
      invalidatesTags: ['GstSlab'],
    }),
  }),
});

export const {
  useGetGstSlabsQuery,
  useCreateGstSlabMutation,
  useUpdateGstSlabMutation,
  useDeleteGstSlabMutation,
} = gstApi;
