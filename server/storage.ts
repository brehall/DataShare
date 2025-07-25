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
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Customer operations
  getCustomers(filters?: { status?: string; region?: string; search?: string }): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  
  // Customer notes operations
  getCustomerNotes(customerId: string): Promise<CustomerNote[]>;
  createCustomerNote(note: InsertCustomerNote): Promise<CustomerNote>;
  
  // Team activity operations
  getTeamActivity(limit?: number): Promise<TeamActivity[]>;
  createTeamActivity(activity: InsertTeamActivity): Promise<TeamActivity>;
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Invitation operations
  getInvitations(): Promise<Invitation[]>;
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  
  // Analytics
  getCustomerAnalytics(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    totalNotes: number;
    recentExports: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    try {
      // Check if data already exists
      const existingCustomers = await db.select().from(customers).limit(1);
      if (existingCustomers.length > 0) {
        return; // Data already initialized
      }

      // Add sample customers
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
        {
          firstName: "Marcus",
          lastName: "Rodriguez",
          email: "m.rodriguez@globalfinance.com",
          phone: "+1-555-0234",
          company: "Global Finance Inc",
          role: "VP Engineering",
          status: "prospect",
          region: "north-america",
          lastContact: null,
          lastContactBy: null,
        },
        {
          firstName: "Emma",
          lastName: "Thompson",
          email: "emma.thompson@eurotech.eu",
          phone: "+44-20-7946-0958",
          company: "EuroTech Limited",
          role: "Head of Operations",
          status: "active",
          region: "europe",
          lastContact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          lastContactBy: "Sarah Chen",
        },
        {
          firstName: "Chen",
          lastName: "Wei",
          email: "chen.wei@asiapacific.com",
          phone: "+86-138-0013-8000",
          company: "Asia Pacific Ventures",
          role: "Director",
          status: "inactive",
          region: "asia-pacific",
          lastContact: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          lastContactBy: "Marcus Brown",
        },
      ];

      const insertedCustomers = await db.insert(customers).values(sampleCustomers).returning();

      // Add sample notes
      if (insertedCustomers.length > 0) {
        const sampleNotes = [
          {
            customerId: insertedCustomers[0].id,
            content: "Had a great call discussing their Q2 expansion plans. They're interested in scaling their infrastructure.",
            authorName: "Alex Chen",
          },
          {
            customerId: insertedCustomers[0].id,
            content: "Follow-up meeting scheduled for next week to present our enterprise package.",
            authorName: "Sarah Chen",
          },
          {
            customerId: insertedCustomers[2].id,
            content: "Emma mentioned they're evaluating multiple vendors. Need to highlight our European data center advantages.",
            authorName: "Marcus Brown",
          },
        ];

        await db.insert(customerNotes).values(sampleNotes);

        // Add sample team activities
        const sampleActivities = [
          {
            action: "updated customer",
            userName: "Sarah Chen",
            customerName: "Sarah Johnson",
            customerId: insertedCustomers[0].id,
          },
          {
            action: "added a note to",
            userName: "Alex Chen",
            customerName: "Sarah Johnson",
            customerId: insertedCustomers[0].id,
          },
          {
            action: "created customer",
            userName: "Marcus Brown",
            customerName: "Marcus Rodriguez",
            customerId: insertedCustomers[1].id,
          },
          {
            action: "exported customer data",
            userName: "Sarah Chen",
            customerName: null,
            customerId: null,
          },
        ];

        await db.insert(teamActivity).values(sampleActivities);
      }
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  }

  async getCustomers(filters?: { status?: string; region?: string; search?: string }): Promise<Customer[]> {
    let query = db.select().from(customers);
    
    // Apply filters using SQL
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
    
    let results = await query.orderBy(desc(customers.updatedAt));
    
    // Apply search filter in application (could be optimized with full-text search)
    if (filters?.search && filters.search.trim()) {
      const search = filters.search.toLowerCase();
      results = results.filter(c => 
        c.firstName.toLowerCase().includes(search) ||
        c.lastName.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.company.toLowerCase().includes(search)
      );
    }
    
    return results;
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    
    // Create team activity
    await this.createTeamActivity({
      action: 'created customer',
      userName: 'System', // In a real app, this would come from auth
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerId: customer.id,
    });
    
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    
    if (!updated) return undefined;
    
    // Create team activity
    await this.createTeamActivity({
      action: 'updated customer',
      userName: updates.lastContactBy || 'System',
      customerName: `${updated.firstName} ${updated.lastName}`,
      customerId: updated.id,
    });
    
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const customer = await this.getCustomer(id);
    if (!customer) return false;
    
    // Remove associated notes first
    await db.delete(customerNotes).where(eq(customerNotes.customerId, id));
    
    // Remove customer
    await db.delete(customers).where(eq(customers.id, id));
    
    // Create team activity
    await this.createTeamActivity({
      action: 'deleted customer',
      userName: 'System',
      customerName: `${customer.firstName} ${customer.lastName}`,
    });
    
    return true;
  }

  async getCustomerNotes(customerId: string): Promise<CustomerNote[]> {
    return await db
      .select()
      .from(customerNotes)
      .where(eq(customerNotes.customerId, customerId))
      .orderBy(desc(customerNotes.createdAt));
  }

  async createCustomerNote(insertNote: InsertCustomerNote): Promise<CustomerNote> {
    const [note] = await db.insert(customerNotes).values(insertNote).returning();
    
    // Create team activity
    const customer = await this.getCustomer(note.customerId);
    await this.createTeamActivity({
      action: 'added a note to',
      userName: note.authorName,
      customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown Customer',
      customerId: note.customerId,
    });
    
    return note;
  }

  async getTeamActivity(limit = 10): Promise<TeamActivity[]> {
    return await db
      .select()
      .from(teamActivity)
      .orderBy(desc(teamActivity.createdAt))
      .limit(limit);
  }

  async createTeamActivity(insertActivity: InsertTeamActivity): Promise<TeamActivity> {
    const [activity] = await db.insert(teamActivity).values(insertActivity).returning();
    return activity;
  }

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
      recentExports: 12, // Mock value for exports
    };
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Invitation operations
  async getInvitations(): Promise<Invitation[]> {
    return await db.select().from(invitations).orderBy(desc(invitations.createdAt));
  }

  async createInvitation(insertInvitation: InsertInvitation): Promise<Invitation> {
    const [invitation] = await db.insert(invitations).values(insertInvitation).returning();
    return invitation;
  }
}

export const storage = new DatabaseStorage();
