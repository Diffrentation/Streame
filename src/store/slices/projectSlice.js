import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Initial state
const initialState = {
  projects: [],
  currentProject: null,
  status: 'idle',
  error: null,
};

// Fetch all projects
export const fetchProjects = createAsyncThunk('projects/fetchProjects', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get('/api/projects');
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

// Create new project
export const createProject = createAsyncThunk('projects/createProject', async (projectData, { rejectWithValue, getState }) => {
  try {
    const { token } = getState().auth;
    const response = await axios.post('/api/projects', projectData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

// Update project
export const updateProject = createAsyncThunk('projects/updateProject', async ({ id, ...projectData }, { rejectWithValue, getState }) => {
  try {
    const { token } = getState().auth;
    const response = await axios.put(`/api/projects/${id}`, projectData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

// Delete project
export const deleteProject = createAsyncThunk('projects/deleteProject', async (id, { rejectWithValue, getState }) => {
  try {
    const { token } = getState().auth;
    await axios.delete(`/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return id;
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

// Project slice
const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch projects
      .addCase(fetchProjects.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.projects = action.payload;
        state.error = null;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message;
      })
      // Create project
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload);
      })
      // Update project
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
      })
      // Delete project
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter(p => p._id !== action.payload);
      });
  },
});

export const { setCurrentProject, clearCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;
