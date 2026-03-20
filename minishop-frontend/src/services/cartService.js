import api from './api';

export const getCart      = ()           => api.get('/cart');
export const addToCart    = (data)       => api.post('/cart/items', data);
export const updateItem   = (id, data)   => api.put(`/cart/items/${id}`, data);
export const deleteItem   = (id)         => api.delete(`/cart/items/${id}`);
export const checkout     = ()           => api.post('/cart/checkout');