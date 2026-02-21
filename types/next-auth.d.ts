import 'next-auth';

declare module 'next-auth' {
  interface User {
    role?: 'parent' | 'child' | 'admin';
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: 'parent' | 'child' | 'admin';
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: 'parent' | 'child' | 'admin';
  }
}
