import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Initial state
const initialState = {
  contacts: [],
  status: 'idle',
  error: null,
  submitStatus: 'idle',
};

// Submit contact form
export const submitContact = createAsyncThunk('contact/submitContact', async (contactData, { rejectWithValue }) => {
  try {
    const response = await axios.post('/api/contact', contactData);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

// Fetch all contacts (admin only)
export const fetchContacts = createAsyncThunk('contact/fetchContacts', async (_, { rejectWithValue, getState }) => {
  try {
    const { token } = getState().auth;
    const response = await axios.get('/api/contact', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

// Update contact status (admin only)
export const updateContactStatus = createAsyncThunk('contact/updateContactStatus', async ({ id, ...updateData }, { rejectWithValue, getState }) => {
  try {
    const { token } = getState().auth;
    const response = await axios.put(`/api/contact/${id}`, updateData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

// Delete contact (admin only)
export const deleteContact = createAsyncThunk('contact/deleteContact', async (id, { rejectWithValue, getState }) => {
  try {
    const { token } = getState().auth;
    await axios.delete(`/api/contact/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return id;
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

// Contact slice
const contactSlice = createSlice({
  name: 'contact',
  initialState,
  reducers: {
    resetSubmitStatus: (state) => {
      state.submitStatus = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Submit contact
      .addCase(submitContact.pending, (state) => {
        state.submitStatus = 'loading';
      })
      .addCase(submitContact.fulfilled, (state) => {
        state.submitStatus = 'succeeded';
        state.error = null;
      })
      .addCase(submitContact.rejected, (state, action) => {
        state.submitStatus = 'failed';
        state.error = action.payload.message;
      })
      // Fetch contacts
      .addCase(fetchContacts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.contacts = action.payload;
        state.error = null;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message;
      })
      // Update contact status
      .addCase(updateContactStatus.fulfilled, (state, action) => {
        const index = state.contacts.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.contacts[index] = action.payload;
        }
      })
      // Delete contact
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.contacts = state.contacts.filter(c => c._id !== action.payload);
      });
  },
});

export const { resetSubmitStatus } = contactSlice.actions;
export default contactSlice.reducer;
