import { useEffect, useState } from "react";
import Loader from "../Ui/Loader";
import axios from "axios";
import { MdQrCodeScanner } from "react-icons/md";

const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}`;
export default function Setup2FA() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [qrcode, setQrcode] = useState<string>();
  useEffect(() => {
    axios
      .post(
        `${BACKEND_URL}/api/auth/twofactor/setup`,
        {},
        { withCredentials: true },
      )
      .then((response) => {
        setQrcode(response.data.qrCodeDataUrl);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      {isLoading ? (
        <div className="flex flex-col gap-3 items-center">
          <Loader />
        </div>
      ) : (
        <div>
          <div className="w-full max-w-md">
            {/* Heading */}
            <div className="flex flex-col justify-center items-center gap-2 mb-2">
              <MdQrCodeScanner className="text-4xl" />
              <h1 className="text-3xl font-bold text-center text-gray-900">
                Scan QR code
              </h1>
              <p className="font-semibold text-gray-500 text-sm">
                Scan this QR code in-app to verify a device
              </p>
            </div>

            {/* Card */}
            <div className=" p-4 flex flex-col gap-5">
              <img
                src={qrcode}
                alt="OOPS !!"
                className="border rounded-2xl border-gray-300 m-3"
              />
              <button
                type="submit"
                className="w-full rounded-md mb-5 bg-indigo-600 py-2.5 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
