import { useState } from "react";
import axios from "axios";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import Alert from "../Ui/Alert";

const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}`;

interface UserDataProp {
  email: string;
  password: string;
}

export default function Login() {
  const [userData, setUserData] = useState<UserDataProp>({
    email: "",
    password: "",
  });
  const [alert, setAlert] = useState({
    show: false,
    type: "success" as "success" | "error",
    message: "",
  });
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const targetname: string = e.target.name;
    const value: string = e.target.value;

    
    setUserData((prev) => {
      return {
        ...prev,
        [targetname]: value,
      };
    });
  }
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    setIsLoading(true);
    e.preventDefault();
    let response;
    try {
      response = await axios.post(`${BACKEND_URL}/api/auth/login`, userData, {
        withCredentials: true,
      });
      setAlert({
        show: true,
        type: "success",
        message: response.data.message,
      });
      navigate("/");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setAlert({
          show: true,
          type: "error",
          message: error.response?.data.message,
        });
      }
      if (response) {
        console.log(response.data.message, error);
      }
    } finally {
      setIsLoading(false);
    }
  }
  async function handleOAuth() {
    window.location.href = `${BACKEND_URL}/api/auth/google`;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Heading */}
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Login in to your account
        </h1>

        {/* Card */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                onChange={handleChange}
                autoComplete="email"
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-900"
                >
                  Password
                </label>

                <a
                  href="/forgot-password"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </a>
              </div>

              <input
                id="password"
                name="password"
                type="password"
                required
                onChange={handleChange}
                autoComplete="current-password"
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-indigo-600 py-2.5 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50"
            >
              {isLoading ? "Submitting..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>

            <span className="px-4 text-sm text-gray-500">Or continue with</span>

            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 rounded-md border border-gray-300 py-2.5 hover:bg-gray-50"
            onClick={handleOAuth}
          >
            <FcGoogle className="text-xl" />

            <span className="font-medium text-gray-700">Google</span>
          </button>
        </div>
      </div>
      {alert.show ? (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() =>
            setAlert((prev) => ({
              ...prev,
              show: false,
            }))
          }
        />
      ) : (
        <></>
      )}
    </div>
  );
}
