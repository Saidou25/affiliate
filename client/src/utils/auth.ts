import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
  [key: string]: any;
}

class AuthService {
  getUser() {
    const token = this.getToken();
    if (!token) return null;
    return jwtDecode<DecodedToken>(token);
  }

  loggedIn() {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      if (decoded.exp < Date.now() / 1000) {
        localStorage.removeItem("id_token");
        return true;
      }
      return false;
    } catch (error) {
      localStorage.removeItem("id_token");
      return true;
    }
  }

  getToken(): string | null {
    return localStorage.getItem("id_token");
  }

  login(idToken: string) {
    localStorage.setItem("id_token", idToken);
    // window.location.assign("/Dashboard");
  }

  logout() {
    localStorage.removeItem("id_token");
    // window.location.replace("/");
  }
}

export default new AuthService();
