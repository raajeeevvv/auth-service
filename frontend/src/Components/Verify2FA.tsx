import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import axios from "axios";
import { MdOutlineSecurity } from "react-icons/md";
import Alert from "../Ui/Alert";

const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}`;
interface UserDataProp {
  otp: string;
}

export default function Verify2FA() {
  const [userData, setUserData] = useState<UserDataProp>({
    otp: "",
  });
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [alert, setAlert] = useState({
    show: false,
    type: "success" as "success" | "error",
    message: "",
  });

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
    try {
      await api.post(`${BACKEND_URL}/api/auth/twofactor/verify`, userData, {
        withCredentials: true,
      });
      navigate("/"); //navigate it to the page where two factor enable/disable button is present
    } catch (error) {
      if (axios.isAxiosError<{ message: string }>(error)) {
        setAlert({
          show: true,
          type: "error",
          message: error.response?.data.message ?? "Something went wrong",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Heading */}
        <div className="flex flex-col gap-3 items-center ">
          <MdOutlineSecurity className="text-4xl" />
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Two-Factor Authentication
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <input
                id="otp"
                name="otp"
                type="number"
                required
                placeholder="OTP"
                onChange={handleChange}
                autoComplete="otp"
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-900 mt-5"
              >
                Enter verification code displayed in you authentication app
              </label>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full cursor-pointer rounded-md bg-indigo-600 py-2.5 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50"
            >
              {isLoading ? "Submitting..." : "Verify"}
            </button>
          </form>
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
