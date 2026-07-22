import "./App.css";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import Landing from "./Components/Landing";
import Signup from "./Components/Signup";
import Login from "./Components/Login";
import VerifyEmail from "./Components/VerifyEmail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
