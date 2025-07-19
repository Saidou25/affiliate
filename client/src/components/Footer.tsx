import { Link } from "react-router-dom";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";

import "./Footer.css";

export default function Footer() {
  const footerLinks1 = [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms" },
  ];
  const footerLinks2 = [
    { label: "FAQ", href: "/faq" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Support", href: "/support" },
    { label: "Sitemap", href: "/sitemap" },
  ];
  const socialLinks = [
    { label: "Facebook", href: "https://facebook.com", icon: FaFacebook },
    { label: "Twitter", href: "https://twitter.com", icon: FaTwitter },
    { label: "Instagram", href: "https://instagram.com", icon: FaInstagram },
    { label: "LinkedIn", href: "https://linkedin.com", icon: FaLinkedin },
    { label: "YouTube", href: "https://youtube.com", icon: FaYoutube },
  ];

  return (
    <footer className="footer-container bg-dark text-white">
      <div className="container">
        <div className="row">
          {/* Column 1 */}
          <div className="col-md-4">
            <h5 className="footer-h5">Company</h5>
            <ul className="list-unstyled">
              {footerLinks1.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-white text-decoration-none">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 */}
          <div className="col-md-4">
            <h5 className="footer-h5">Resources</h5>
            <ul className="list-unstyled">
              {footerLinks2.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-white text-decoration-none">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 */}
          <div className="col-md-4">
            <h5 className="footer-h5">Follow Us</h5>
            <ul className="list-inline">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <li key={label} className="list-inline-item me-3">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white"
                    aria-label={label}
                  >
                    <Icon size={24} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center mt-3">
          <small>&copy; {new Date().getFullYear()} Your Company Name. All rights reserved.</small>
        </div>
      </div>
    </footer>
  );
}
