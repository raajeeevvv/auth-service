import { useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";

const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}`;

interface UserDataProp {
  newPassword: string;
  confirmNewPassword: string;
}

export default function ResetPassword() {
  const [userData, setUserData] = useState<UserDataProp>({
    newPassword: "",
    confirmNewPassword: "",
  });
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const isPasswordMatch =
    userData.newPassword.length > 0 &&
    userData.newPassword === userData.confirmNewPassword;

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
    e.preventDefault();

    if (!isPasswordMatch) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      await axios.post(
        `${BACKEND_URL}/api/auth/reset-password`,
        {
          newPassword: userData.newPassword,
          token,
        },
        {
          withCredentials: true,
        },
      );
      navigate("/login");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setErrorMessage(
          error.response.data?.message || "Failed to reset password.",
        );
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Heading */}
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Reset Password
        </h1>
        {/* Card */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-900"
              >
                Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                value={userData.newPassword}
                onChange={handleChange}
                autoComplete="new-password"
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <div className="flex justify-between items-center">
                <label
                  htmlFor="confirmNewPassword"
                  className="block text-sm font-medium text-gray-900"
                >
                  Confirm password
                </label>
              </div>
              <input
                id="confirmNewPassword"
                name="confirmNewPassword"
                type="password"
                required
                value={userData.confirmNewPassword}
                onChange={handleChange}
                autoComplete="new-password"
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Match indicator - only show once user starts typing confirm field */}
            {userData.confirmNewPassword.length > 0 && (
              <p
                className={`${
                  isPasswordMatch
                    ? "text-green-700 font-semibold"
                    : "text-red-700 font-semibold"
                } text-xs`}
              >
                {isPasswordMatch
                  ? "Password matched"
                  : "Passwords didn't match"}
              </p>
            )}

            {/* Server / submit error */}
            {errorMessage && (
              <p className="text-red-700 font-semibold text-xs">
                {errorMessage}
              </p>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-indigo-600 py-2.5 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50"
            >
              {isLoading ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
