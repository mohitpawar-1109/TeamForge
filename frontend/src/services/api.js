import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auto JWT Injection
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('teamforge_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Global response error handler
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear and optionally redirect
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        localStorage.removeItem('teamforge_token');
        localStorage.removeItem('teamforge_user');
      }
    }
    return Promise.reject(error);
  }
);

// Endpoints mapping
export const authAPI = {
  register: (userData) => API.post('/auth/register', userData),
  login: (credentials) => API.post('/auth/login', credentials),
  getMe: () => API.get('/auth/me')
};

export const userAPI = {
  getUsers: (params) => API.get('/users', { params }),
  getUserById: (id) => API.get(`/users/${id}`),
  updateProfile: (data) => API.put('/users/profile', data)
};

export const projectAPI = {
  getProjects: (params) => API.get('/projects', { params }),
  getProjectById: (id) => API.get(`/projects/${id}`),
  createProject: (data) => API.post('/projects', data),
  updateProject: (id, data) => API.put(`/projects/${id}`, data),
  deleteProject: (id) => API.delete(`/projects/${id}`),
  leaveTeam: (id) => API.post(`/projects/${id}/team/leave`),
  getMatches: (id) => API.get(`/projects/${id}/matches`),
  getSkillGap: (id) => API.get(`/projects/${id}/skill-gap`)
};

export const aiAPI = {
  analyzeProject: (data) => API.post('/ai/analyze-project', data)
};

export const inviteAPI = {
  getInvitations: () => API.get('/invitations'),
  sendInvitation: (data) => API.post('/invitations', data),
  respondInvitation: (id, status) => API.patch(`/invitations/${id}`, { status })
};

export const taskAPI = {
  getTasks: (projectId) => API.get(`/projects/${projectId}/tasks`),
  createTask: (projectId, data) => API.post(`/projects/${projectId}/tasks`, data),
  updateTask: (id, data) => API.put(`/tasks/${id}`, data),
  deleteTask: (id) => API.delete(`/tasks/${id}`)
};

export const notifAPI = {
  getNotifications: () => API.get('/notifications'),
  markRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllRead: () => API.patch('/notifications/mark-all-read')
};

export const postAPI = {
  getPosts: (params) => API.get('/posts', { params }),
  getPostById: (id) => API.get(`/posts/${id}`),
  createPost: (data) => API.post('/posts', data),
  updatePost: (id, data) => API.put(`/posts/${id}`, data),
  deletePost: (id) => API.delete(`/posts/${id}`),
  likePost: (id) => API.post(`/posts/${id}/like`),
  unlikePost: (id) => API.delete(`/posts/${id}/like`),
  toggleLike: (id, currentlyLiked) => currentlyLiked ? API.delete(`/posts/${id}/like`) : API.post(`/posts/${id}/like`)
};

export const commentAPI = {
  getComments: (postId) => API.get(`/posts/${postId}/comments`),
  createComment: (postId, data) => API.post(`/posts/${postId}/comments`, data),
  updateComment: (commentId, data) => API.put(`/comments/${commentId}`, data),
  deleteComment: (commentId) => API.delete(`/comments/${commentId}`)
};

export const teamRequestAPI = {
  joinTeamPost: (postId, data) => API.post(`/posts/${postId}/join`, data),
  getTeamRequests: (params) => API.get('/team-requests', { params }),
  updateRequestStatus: (id, status) => API.patch(`/team-requests/${id}`, { status })
};

export default API;
