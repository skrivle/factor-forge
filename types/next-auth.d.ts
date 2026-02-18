import 'next-auth';

declare module 'next-auth' {
  interface User {
    role?: 'parent' | 'child';
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: 'parent' | 'child';
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: 'parent' | 'child';
  }
}
