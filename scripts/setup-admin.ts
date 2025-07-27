
import { db } from '../server/db';
import { invitations, users } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function setupAdmin() {
  try {
    // Check if invitation already exists
    const existing = await db
      .select()
      .from(invitations)
      .where(eq(invitations.email, 'bdhall4@yahoo.com'));

    if (existing.length === 0) {
      // Create invitation for admin user
      await db.insert(invitations).values({
        email: 'bdhall4@yahoo.com',
        invitedBy: 'system', // System invitation
        isUsed: false,
        createdAt: new Date(),
      });
      console.log('✅ Admin invitation created for bdhall4@yahoo.com');
    } else {
      // Update existing invitation to be unused if needed
      await db
        .update(invitations)
        .set({ 
          isUsed: false,
          usedAt: null 
        })
        .where(eq(invitations.email, 'bdhall4@yahoo.com'));
      console.log('✅ Admin invitation updated for bdhall4@yahoo.com');
    }

    console.log('Admin setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up admin:', error);
    process.exit(1);
  }
}

setupAdmin();
