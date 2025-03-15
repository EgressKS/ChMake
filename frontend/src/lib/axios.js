import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://ch-make-backend.vercel.app/api",
  withCredentials: true,
});
