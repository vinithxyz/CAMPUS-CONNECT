import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
});

export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    return (
      err.response?.data?.error?.message ??
      (err.code === 'ERR_NETWORK'
        ? 'Cannot reach the server. Check your connection.'
        : 'Request failed')
    );
  }
  return 'Something went wrong';
};

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !err.config.url?.includes('/auth/')) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);
