import axios from 'axios';

const apiUrl = 'https://api.staging.fewsats.com';

const apiClient = axios.create({
  baseURL: apiUrl,
  withCredentials: true, // Ensure cookies are sent with requests
});

// No need to manually handle cookies in localStorage
apiClient.interceptors.response.use(
  (response) => {
    // Response handling logic
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.request.use(
  (config) => {
    // Request configuration logic
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
