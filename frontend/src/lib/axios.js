import axios from "axios";

let baseURL;

if (import.meta.env.MODE === 'development') {
  baseURL = "http://localhost:5001/api";  
} else {
  baseURL = "https://chmake-1.onrender.com/api";  // Production URL
}

export const axiosInstance = axios.create({
  baseURL: baseURL,
  withCredentials: true,
});
