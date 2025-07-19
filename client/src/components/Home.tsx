import { Link } from "react-router-dom";
import LandingPageTitle from "./LandingPageTitle";
import clicks from "../assets/images/affiliateclicks.jpg";
import commissions from "../assets/images/affiliatecommissions.jpg";
import sales from "../assets/images/affiliatesales.jpg";
import { useEffect, useState } from "react";

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <>
      <LandingPageTitle />
      <div
        className="but-container"
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          marginTop: "5%",
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
            textAlign: "center",
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
            textAlign: "center",
          }}
        >
          Login
        </Link>
      </div>
      <div className="image-wrapper">
        {/* Image on the left */}
        <div
          className="floating-image left-img"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        >
          <img
            className="img-fluid"
            src={commissions}
            alt="commission bar chart"
          />
        </div>

        {/* Text block to the right of the image */}
        <div
          className="floating-text text-block"
          style={{
            transform: `translateY(${scrollY * 0.2}px)`,
          }}
        >
          <h2>Track Your Affiliate Growth</h2>
          <p className="text-black">
            View clicks, sales, and commissions in real time. Our dashboard
            gives you everything you need to optimize performance and increase
            revenue.
          </p>
        </div>

        {/* Middle image */}
        <div
          className="floating-image center-img"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        >
          <img className="img-fluid" src={sales} alt="sales bar chart" />
        </div>

        {/* Image on the right */}
        <div
          className="floating-image right-img"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        >
          <img className="img-fluid" src={clicks} alt="clicks bar chart" />
        </div>
      </div>
    </>
  );
}
//  <h2>Track Your Affiliate Growth</h2>
// <p>
//   View clicks, sales, and commissions in real time. Our dashboard gives
//   you everything you need to optimize performance and increase revenue.
// </p>
