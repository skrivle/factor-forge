import NextAuth, { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { verifyUserPin } from '@/lib/db/queries';

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'Family PIN',
      credentials: {
        name: { label: 'Name', type: 'text' },
        pin: { label: '4-Digit PIN', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.pin) {
          return null;
        }

        const name = credentials.name as string;
        const pin = credentials.pin as string;

        // Verify PIN is 4 digits
        if (!/^\d{4}$/.test(pin)) {
          return null;
        }

        try {
          const user = await verifyUserPin(name, pin);
          
          if (!user) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
