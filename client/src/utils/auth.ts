import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
  [key: string]: any;
}

class AuthService {
  getUser() {
    const token = this.getToken();
    if (!token) return null;
    try {
      return jwtDecode<DecodedToken>(token);
    } catch {
      return null;
    }
  }

  loggedIn() {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }

  getToken(): string | null {
    return localStorage.getItem("token");
  }

  login(idToken: string) {
    localStorage.setItem("token", idToken);
    // window.location.assign("/Dashboard");
  }

  logout() {
    localStorage.removeItem("token");
    window.location.replace("/");
      // window.location.replace("/?loggedOut=true");
  }
}

export default new AuthService();
