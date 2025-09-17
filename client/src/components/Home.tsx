import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import clicks from "../assets/images/affiliateclicks.jpg";
import commissions from "../assets/images/affiliatecommissions.jpg";
import sales from "../assets/images/affiliatesales.jpg";
import AuthService from "../utils/auth";
import Button from "./Button";

import "./Home.css";

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  const isLoggedIn = AuthService.loggedIn();

  const handleLogout = () => {
    AuthService.logout();
  };

  const fadeStart = 400;
  const fadeEnd = 750;

  const fadeProgress = Math.min(
    Math.max((scrollY - fadeStart) / (fadeEnd - fadeStart), 0),
    1
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      
      <div className="image-wrapper">
        {/* Text block 1 */}
        <div
          className="floating-image text-left-top"
          style={{
            marginTop: `${scrollY * -0.2}px`,
          }}
        >
          <div className="text-block">
            <h2>Join. Promote. Earn.</h2>
            <p className="turn">
              Our affiliate program makes it easy to start earning commissions
              with zero startup costs and real-time tracking.
            </p>
          </div>
        </div>

        {/* Image 1 */}
        <div
          className="floating-image right-img-top"
          style={{ marginTop: `${scrollY * -0.1}px` }}
        >
          <img
            className="img-fluid mg-thick"
            src={commissions}
            alt="commission bar chart"
          />
        </div>

        {/* Image 2 */}
        <div
          className="floating-image center-img"
          style={{ marginTop: `${scrollY * -0.17}px` }}
        >
          <img className="img-fluid" src={sales} alt="sales bar chart" />
        </div>

        {/* Text block 2 */}
        <div
          className="floating-image text-right-center"
          style={{
            marginTop: `${scrollY * -0.3}px`,
          }}
        >
          <div className="text-block">
            <h2>Track Your Affiliate Growth</h2>
            <p className="turn">
              View clicks, sales, and commissions in real time. Our dashboard
              gives you everything you need to optimize performance and increase
              revenue.
            </p>
          </div>
        </div>

        {/* Text block 3 */}
        <div
          className="floating-image text-left-bottom"
          style={{
            marginTop: `${scrollY * -0.27}px`,
          }}
        >
          <div className="text-block">
            <h2>Performance-Based Commissions</h2>
            <p className="turn">
              The more you sell, the more you earn — our commission structure
              rewards your success. Start with a competitive base rate and
              unlock higher percentages as your sales grow, with rates reaching
              up to 37%.
            </p>
          </div>
        </div>

        {/* Image 3 */}
        <div
          className="floating-image right-img-bottom"
          style={{ marginTop: `${scrollY * -0.25}px` }}
        >
          <img className="img-fluid" src={clicks} alt="clicks bar chart" />
        </div>
      </div>
      <div
        className="fade-in-section bg-dark"
        style={{
          opacity: fadeProgress,
          transform: `translateY(${(1 - fadeProgress) * 50}px)`,
        }}
      >
        <h2 className="ready-tojoin">Ready to Join?</h2>
        <p className="turn">
          Turn your influence into income. Register now and start earning with
          every click and sale.
        </p>
        <div className="link-home">
          {isLoggedIn ? (
            <Button
              className="blue-btn"
              type="button"
              onClick={() => handleLogout()}
            >
              Logout
            </Button>
          ) : (
          <>
            <Link to="/register" className="register-link mt-2">
              Become an Affiliate
            </Link>
            <Link to="/login" className="login-link mt-2">
              Login
            </Link>
          </>
        )} 
        </div>
      </div>
      <div className="home-log">
        <img
          src="https://assets.zyrosite.com/mP47Mwo0WQhVBkl5/pgp-logo-favicon-2025-mnlvrQoloKTvJvO7.png"
          alt="Pg logo"
        />
      </div>
    </>
  );
}
