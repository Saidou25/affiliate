import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div
      className="but-container"
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        marginTop: "30%",
      }}
    >
      <Link
        className=""
        to="/register"
        style={{
          padding: "1%",
          borderRadius: "10px",
          width: "20%",
          margin: "5px",
        }}
      >
        Register
      </Link>
      <Link
        className=""
        to="/login"
        style={{
          padding: "1%",
          borderRadius: "10px",
          width: "20%",
          margin: "5px",
        }}
      >
        Login
      </Link>
    </div>
  );
}
