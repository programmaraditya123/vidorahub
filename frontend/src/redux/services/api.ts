import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    credentials: 'include', // optional
  }),
  tagTypes: ['User', 'Post'],
  endpoints: (builder) => ({
    
    getUsers: builder.query<any[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),

    createUser: builder.mutation({
      query: (data) => ({
        url: '/users',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

  }),
})

export const {
  useGetUsersQuery,
  useCreateUserMutation,
} = api
