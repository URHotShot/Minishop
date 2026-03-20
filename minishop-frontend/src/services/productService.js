import api from './api';

// 取得商品列表（支援搜尋、排序、分頁）
export const getProducts = ({ keyword = "", sort = "newest", page = 1, limit = 12 } = {}) =>
  api.get("/products", {
    params: { keyword, sort, page, limit },
  });

export const getProduct    = (id)       => api.get(`/products/${id}`);
export const createProduct = (data)     => api.post("/products", data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id)       => api.delete(`/products/${id}`);