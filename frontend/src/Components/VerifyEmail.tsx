import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Loader from "../Ui/Loader";
import Alert from "../Ui/Alert";
const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}`;

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState({
    show: false,
    type: "success" as "success" | "error",
    message: "",
  });
  const token = searchParams.get("token");
  async function sendVerifyEmailRequest() {
    axios
      .post(`${BACKEND_URL}/api/auth/verify-email`, {
        token,
      })
      .then((res) => {
        console.log(res.data);
        setAlert({
          show: true,
          type: "success",
          message: "Verification Successfull, redirecting to Login",
        });
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      })
      .catch((err) => {
        console.error(err.response.data);
        setAlert({
          show: true,
          type: "error",
          message: "Invalid or expired verification link.",
        });
      });
  }
  useEffect(() => {
    sendVerifyEmailRequest();
  }, []);

  //   console.log(verifyEmail);
  return (
    <div className="h-screen w-screen flex flex-col gap-5 justify-center items-center ">
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
        <div className="h-screen w-screen flex flex-col gap-5 justify-center items-center ">
          <Loader />
          <div>Please wait, we are processing !!</div>
        </div>
      )}
    </div>
  );
}
