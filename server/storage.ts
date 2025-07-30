import { 
  type Customer, 
  type InsertCustomer, 
  type CustomerNote, 
  type InsertCustomerNote, 
  type TeamActivity, 
  type InsertTeamActivity,
  type User,
  type InsertUser,
  type Invitation,
  type InsertInvitation,
  customers,
  customerNotes,
  teamActivity,
  users,
  invitations
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm"; // Added sql
import { randomUUID } from "crypto";

export interface IStorage {
  // ... (same as before)
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    try {
      const existingCustomers = await db.select().from(customers).limit(1);
      if (existingCustomers.length > 0) return;

      const sampleCustomers = [
        {
          firstName: "Sarah",
          lastName: "Johnson",
          email: "sarah.johnson@techcorp.com",
          phone: "+1-555-0123",
          company: "TechCorp Solutions",
          role: "CTO",
          status: "active",
          region: "north-america",
          lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          lastContactBy: "Alex Chen",
        },
        // ... (add other samples as needed)
      ];

      const insertedCustomers = await db.insert(customers).values(sampleCustomers).returning();

      if (insertedCustomers.length > 0) {
        const sampleNotes = [
          { customerId: insertedCustomers[0].id, content: "Had a great call...", authorName: "Alex Chen" },
          // ... (add other notes)
        ];
        await db.insert(customerNotes).values(sampleNotes);

        const sampleActivities = [
          { action: "updated customer", userName: "Sarah Chen", customerName: "Sarah Johnson", customerId: insertedCustomers[0].id },
          // ... (add other activities)
        ];
        await db.insert(teamActivity).values(sampleActivities);
      }
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  }

  async getCustomers(filters?: { status?: string; region?: string; search?: string }): Promise<Customer[]> {
    let query = db.select().from(customers).orderBy(desc(customers.updatedAt));

    const conditions = [];

    if (filters?.status && filters.status !== 'all') {
      conditions.push(eq(customers.status, filters.status));
    }

    if (filters?.region && filters.region !== 'all') {
      conditions.push(eq(customers.region, filters.region));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    if (filters?.search && filters.search.trim()) {
      const search = `%${filters.search.toLowerCase()}%`;
      query = query.where(
        sql`lower(${customers.firstName}) ILIKE ${search} OR lower(${customers.lastName}) ILIKE ${search} OR lower(${customers.email}) ILIKE ${search} OR lower(${customers.company}) ILIKE ${search}`
      );
    }

    const results = await query;
    return results;
  }

  // ... (keep other methods as they are, ensuring they use sql where needed)

  async getCustomerAnalytics(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    totalNotes: number;
    recentExports: number;
  }> {
    const [totalCustomers] = await db.select({ count: sql`count(*)` }).from(customers);
    const [activeCustomers] = await db.select({ count: sql`count(*)` }).from(customers).where(eq(customers.status, 'active'));
    const [totalNotes] = await db.select({ count: sql`count(*)` }).from(customerNotes);

    return {
      totalCustomers: Number(totalCustomers.count),
      activeCustomers: Number(activeCustomers.count),
      totalNotes: Number(totalNotes.count),
      recentExports: 12, // Mock value
    };
  }

  // ... (rest of the methods remain unchanged)
}

export const storage = new DatabaseStorage();