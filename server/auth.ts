import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import type { Express, RequestHandler } from 'express';
import { db } from './db';
import { users, invitations } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
  throw new Error("FACEBOOK_APP_ID and FACEBOOK_APP_SECRET must be set");
}

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set");
}

// Configure session store
export function getSessionStore() {
  const pgStore = connectPg(session);
  return new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: 7 * 24 * 60 * 60, // 7 days
    tableName: 'sessions',
  });
}

// Configure passport Facebook strategy
export function setupPassport() {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID!,
    clientSecret: process.env.FACEBOOK_APP_SECRET!,
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'email', 'picture.type(large)']
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email found in Facebook profile'));
      }

      // Check if user has an invitation
      const [invitation] = await db
        .select()
        .from(invitations)
        .where(and(
          eq(invitations.email, email),
          eq(invitations.isUsed, false)
        ));

      if (!invitation) {
        return done(new Error('No invitation found for this email address'));
      }

      // Check if user already exists
      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        // Create new user
        [user] = await db
          .insert(users)
          .values({
            id: profile.id,
            email,
            name: profile.displayName || 'Unknown User',
            facebookId: profile.id,
            profilePicture: profile.photos?.[0]?.value,
            isActive: true,
          })
          .returning();

        // Mark invitation as used
        await db
          .update(invitations)
          .set({ isUsed: true, usedAt: new Date() })
          .where(eq(invitations.id, invitation.id));
      } else if (!user.isActive) {
        return done(new Error('Your account has been deactivated'));
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));
      
      if (!user || !user.isActive) {
        return done(null, false);
      }
      
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

// Authentication middleware
export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
};

// Setup authentication routes and middleware
export function setupAuth(app: Express) {
  // Session middleware
  app.use(session({
    store: getSessionStore(),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }));

  // Initialize passport
  setupPassport();
  app.use(passport.initialize());
  app.use(passport.session());

  // Auth routes
  app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login?error=auth_failed' }),
    (req, res) => {
      res.redirect('/');
    }
  );

  app.post('/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Get current user
  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated() && req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });
}