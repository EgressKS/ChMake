import axios from "axios";

let baseURL;

if (import.meta.env.MODE === 'development') {
  baseURL = "http://localhost:5001/api";  // Development URL
} else {
  baseURL = "https://ch-make-backend.vercel.app/api";  // Production URL
}

export const axiosInstance = axios.create({
  baseURL: baseURL,
  withCredentials: true,
});
