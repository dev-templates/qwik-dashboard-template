// Server-side exclusive configuration
export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production",
    expiresIn: process.env.SESSION_EXPIRES_IN || "7d",
  },
  twoFactor: {
    issuer: process.env.TWO_FACTOR_ISSUER || "Qwik Dashboard",
    window: 2, // Time window for TOTP
  },
  bcrypt: {
    rounds: 10,
  },
  session: {
    cookieName: "qwik-dashboard-session",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  },
  loginAttempts: {
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },
};
