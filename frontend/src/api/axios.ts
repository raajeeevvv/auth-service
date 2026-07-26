// src/api/axios.ts

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    const originalRequest = error.config;
    console.log("this is error config/originalReques",error.config)
    console.log("this is error ",error)


    // Don't try refreshing if the refresh endpoint itself failed
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/api/auth/refresh"
    ) {
      originalRequest._retry = true;

      try {
        // Browser automatically sends the refresh cookie
        await api.post("/api/auth/refresh");

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token is invalid/expired
        console.log(refreshError);
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
