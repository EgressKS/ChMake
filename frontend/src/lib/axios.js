import axios from "axios";

export const axiosInstance = axios.create({
  // baseURL:  "http://localhost:5001/api" ,
  baseURL: "https://ch-make-backend.vercel.app/api",
  withCredentials: true,
});
