import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import type { MouseEvent } from "react";

interface ErrorResponse {
  error?: string;
  message?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const useLogout = () => {
  const navigate = useNavigate();

  const handleLogout = async (event?: MouseEvent<HTMLElement>) => {
    event?.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      toast.info("No active session found");
      navigate("/login", { replace: true });
      return;
    }

    try {
      await axios.post<{ message: string }>(
        `${API_BASE_URL}/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      toast.success("Logged out successfully");
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      const errorMessage =
        axiosError.response?.data?.error ||
        axiosError.response?.data?.message ||
        "Failed to log out";
      toast.error(errorMessage);
      console.error("Logout error:", axiosError);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("isLoggedIn");
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    }
  };

  return { handleLogout };
};

export default useLogout;
