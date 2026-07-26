import "./App.css";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import Landing from "./Components/Landing";
import Signup from "./Components/Signup";
import Login from "./Components/Login";
import VerifyEmail from "./Components/VerifyEmail";
import ForgotPassword from "./Components/ForgotPassword";
import ResetPassword from "./Components/ResetPassword";
import Setup2FA from "./Components/Setup2FA";
import Verify2FA from "./Components/Verify2FA";
import Login2FA from "./Components/Login2FA";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/setup2fa" element={<Setup2FA />} />
        <Route path="/verify2fa" element={<Verify2FA />} />
        <Route path="/login2fa" element={<Login2FA />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
