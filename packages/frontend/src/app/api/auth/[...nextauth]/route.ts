import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: AuthOptions = {
  providers: [
    // Credentials Provider (Email + Password)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[NextAuth] Missing credentials');
          return null;
        }

        try {
          // Call our backend API to authenticate user
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;
          console.log('[NextAuth] Calling backend API:', apiUrl);

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await response.json();
          console.log('[NextAuth] Backend response:', {
            status: response.status,
            ok: response.ok,
            success: data.success,
            hasUser: !!data.data?.user,
            hasToken: !!data.data?.token,
          });

          if (response.ok && data.success && data.data?.user) {
            const user = data.data.user;
            console.log('[NextAuth] User authenticated:', {
              id: user.id,
              email: user.email,
              role: user.role,
            });
            return {
              id: user.id, // Backend sends 'id' not '_id'
              email: user.email,
              name: user.name,
              role: user.role,
              isVerified: user.isVerified,
              avatar: user.avatar,
              token: data.data.token, // Store backend JWT token
            };
          }

          console.log(
            '[NextAuth] Authentication failed - invalid response structure'
          );
          return null;
        } catch (error) {
          console.error('[NextAuth] Authentication error:', error);
          return null;
        }
      },
    }),

    // Google OAuth Provider (optional)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          isVerified: user.isVerified,
          avatar: user.avatar,
          backendToken: user.token, // Store backend JWT token
        };
      }

      return token;
    },

    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          isVerified: token.isVerified as boolean,
          avatar: token.avatar as string,
          token: token.backendToken as string, // Expose backend JWT token
        },
      };
    },

    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;

      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;

      return baseUrl;
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  events: {
    async signIn({ user, account }) {
      console.log('User signed in:', {
        user: user.email,
        provider: account?.provider,
      });
    },
    async signOut({ token }) {
      console.log('User signed out:', { user: token?.email });
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
