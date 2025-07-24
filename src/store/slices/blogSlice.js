import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Initial state
const initialState = {
  posts: [],
  currentPost: null,
  status: 'idle',
  error: null,
};

// Fetch all blog posts
export const fetchPosts = createAsyncThunk('blog/fetchPosts', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get('/api/blog');
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

// Fetch single blog post
export const fetchPost = createAsyncThunk('blog/fetchPost', async (slug, { rejectWithValue }) => {
  try {
    const response = await axios.get(`/api/blog/${slug}`);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

// Create new blog post
export const createPost = createAsyncThunk('blog/createPost', async (postData, { rejectWithValue, getState }) => {
  try {
    const { token } = getState().auth;
    const response = await axios.post('/api/blog', postData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

// Update blog post
export const updatePost = createAsyncThunk('blog/updatePost', async ({ slug, ...postData }, { rejectWithValue, getState }) => {
  try {
    const { token } = getState().auth;
    const response = await axios.put(`/api/blog/${slug}`, postData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

// Delete blog post
export const deletePost = createAsyncThunk('blog/deletePost', async (slug, { rejectWithValue, getState }) => {
  try {
    const { token } = getState().auth;
    await axios.delete(`/api/blog/${slug}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return slug;
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

// Blog slice
const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    setCurrentPost: (state, action) => {
      state.currentPost = action.payload;
    },
    clearCurrentPost: (state) => {
      state.currentPost = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch posts
      .addCase(fetchPosts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.posts = action.payload;
        state.error = null;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message;
      })
      // Fetch single post
      .addCase(fetchPost.fulfilled, (state, action) => {
        state.currentPost = action.payload;
      })
      // Create post
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload);
      })
      // Update post
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(p => p.slug === action.payload.slug);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
        if (state.currentPost && state.currentPost.slug === action.payload.slug) {
          state.currentPost = action.payload;
        }
      })
      // Delete post
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter(p => p.slug !== action.payload);
        if (state.currentPost && state.currentPost.slug === action.payload) {
          state.currentPost = null;
        }
      });
  },
});

export const { setCurrentPost, clearCurrentPost } = blogSlice.actions;
export default blogSlice.reducer;
