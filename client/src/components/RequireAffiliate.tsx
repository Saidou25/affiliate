import { Navigate, useLocation } from "react-router-dom";
import Auth from "../utils/auth";
import { ReactNode } from "react";

export default function RequireAffiliate({
  children,
}: {
  children: ReactNode;
}) {
  const loc = useLocation();
  return Auth.loggedIn() && Auth.getRole() === "affiliate" ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: loc }} />
  );
}
