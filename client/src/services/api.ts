import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
});

export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    if (err.response?.data?.error?.message) {
      return err.response.data.error.message;
    }
    if (typeof err.response?.data?.message === 'string') {
      return err.response.data.message;
    }
    if (err.code === 'ERR_NETWORK') {
      return 'Cannot reach the server. Make sure the backend server is running.';
    }
    if (err.response?.status === 500 || err.response?.status === 502 || err.response?.status === 504) {
      return 'Server error. Please ensure the backend server and database are running.';
    }
    return `Request failed with status ${err.response?.status ?? 'unknown'}`;
  }
  return err instanceof Error ? err.message : 'Something went wrong';
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
