// auth.ts
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
  role?: "admin" | "affiliate";
  affiliateId?: string;
  sub?: string;
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

  getRole(): "admin" | "affiliate" | null {
    return this.getUser()?.role ?? null;
  }

  isAdmin(): boolean {
    return this.loggedIn() && this.getRole() === "admin";
  }

  getUserId(): string | null {
    const u = this.getUser();
    return (u?.affiliateId as string) || (u?.sub as string) || null;
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
    // 🔴 ensure this matches everywhere (Apollo link, etc.)
    return localStorage.getItem("token");
  }

  login(idToken: string) {
    localStorage.setItem("token", idToken);
  }

  logout() {
    localStorage.removeItem("token");
    window.location.replace("/");
  }
}

export default new AuthService();



// import { jwtDecode } from "jwt-decode";

// interface DecodedToken {
//   exp: number;
//   [key: string]: any;
// }

// class AuthService {
//   getUser() {
//     const token = this.getToken();
//     if (!token) return null;
//     try {
//       return jwtDecode<DecodedToken>(token);
//     } catch {
//       return null;
//     }
//   }

//   loggedIn() {
//     const token = this.getToken();
//     if (!token) return false;
//     return !this.isTokenExpired(token);
//   }

//   isTokenExpired(token: string): boolean {
//     try {
//       const decoded = jwtDecode<DecodedToken>(token);
//       return decoded.exp < Date.now() / 1000;
//     } catch {
//       return true;
//     }
//   }

//   getToken(): string | null {
//     return localStorage.getItem("token");
//   }

//   login(idToken: string) {
//     localStorage.setItem("token", idToken);
//     // window.location.assign("/Dashboard");
//   }

//   logout() {
//     localStorage.removeItem("token");
//     window.location.replace("/");
//       // window.location.replace("/?loggedOut=true");
//   }
// }

// export default new AuthService();
