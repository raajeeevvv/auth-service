import { useSearchParams } from "react-router-dom";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    console.log(searchParams);
    const token = searchParams.get("token")
    console.log(token);

  return <div></div>;
}
