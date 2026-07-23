import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}`;
interface UserDataProp {
  email: string;
}

export default function ForgotPassword() {
  const [userData, setUserData] = useState<UserDataProp>({
    email: "",
  });
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const targetname: string = e.target.name;
    const value: string = e.target.value;

    console.log(targetname, value);
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
      response = await axios.post(
        `${BACKEND_URL}/api/auth/forgot-password`,
        userData,
        {
          withCredentials: true,
        },
      );
      navigate("/login");
    } catch (error) {
      if (response) {
        console.log(response.data.message, error);
      }
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Heading */}
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Forgot Password
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

            {/* Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full cursor-pointer rounded-md bg-indigo-600 py-2.5 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50"
            >
              {isLoading ? "Submitting..." : "Send Resent Link"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
