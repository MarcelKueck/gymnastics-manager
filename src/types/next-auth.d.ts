// Save as: src/types/next-auth.d.ts

import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    userType: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      userType: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    userType: string;
    id: string;
  }
}