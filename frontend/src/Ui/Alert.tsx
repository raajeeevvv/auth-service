import { FcCheckmark, FcHighPriority } from "react-icons/fc";
import { IoClose } from "react-icons/io5";

interface AlertProps {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}

export default function Alert({ type, message, onClose }: AlertProps) {
  const isSuccess = type === "success";

  return (
    <div
      className={`flex items-center justify-between rounded-lg px-5 py-4 w-125 absolute right-2 top-2
      ${
        isSuccess
          ? "bg-green-100 border border-green-50 text-green-700 font-semibold"
          : "bg-red-100 border border-red-50 text-red-900 font-semibold "
      }`}
    >
      <div className="flex items-center gap-3">
        {isSuccess ? (
          <FcCheckmark className="text-xl" />
        ) : (
          <FcHighPriority className="text-xl" />
        )}

        <span>{message}</span>
      </div>

      <button onClick={onClose}>
        <IoClose className="text-lg hover:opacity-70" />
      </button>
    </div>
  );
}
