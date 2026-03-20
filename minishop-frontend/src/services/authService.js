import api from './api';

export const register = (data) => api.post('/register', data);
export const login    = (data) => api.post('/login', data);
export const getProfile = ()   => api.get('/profile');