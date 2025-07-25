import { type Customer, type InsertCustomer, type CustomerNote, type InsertCustomerNote, type TeamActivity, type InsertTeamActivity } from "@shared/schema";
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
  
  // Analytics
  getCustomerAnalytics(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    totalNotes: number;
    recentExports: number;
  }>;
}

export class MemStorage implements IStorage {
  private customers: Map<string, Customer>;
  private customerNotes: Map<string, CustomerNote>;
  private teamActivity: Map<string, TeamActivity>;

  constructor() {
    this.customers = new Map();
    this.customerNotes = new Map();
    this.teamActivity = new Map();
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Add some sample customers
    const sampleCustomers = [
      {
        id: "cust-1",
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@techcorp.com",
        phone: "+1-555-0123",
        company: "TechCorp Solutions",
        role: "CTO",
        status: "active",
        region: "north-america",
        lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        lastContactBy: "Alex Chen",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: "cust-2",
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
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        id: "cust-3",
        firstName: "Emma",
        lastName: "Thompson",
        email: "emma.thompson@eurotech.eu",
        phone: "+44-20-7946-0958",
        company: "EuroTech Limited",
        role: "Head of Operations",
        status: "active",
        region: "europe",
        lastContact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        lastContactBy: "Sarah Chen",
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: "cust-4",
        firstName: "Chen",
        lastName: "Wei",
        email: "chen.wei@asiapacific.com",
        phone: "+86-138-0013-8000",
        company: "Asia Pacific Ventures",
        role: "Director",
        status: "inactive",
        region: "asia-pacific",
        lastContact: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        lastContactBy: "Marcus Brown",
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      },
    ];

    // Add sample customers to storage
    sampleCustomers.forEach(customer => {
      this.customers.set(customer.id, customer as Customer);
    });

    // Add sample notes
    const sampleNotes = [
      {
        id: "note-1",
        customerId: "cust-1",
        content: "Had a great call discussing their Q2 expansion plans. They're interested in scaling their infrastructure.",
        authorName: "Alex Chen",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: "note-2",
        customerId: "cust-1",
        content: "Follow-up meeting scheduled for next week to present our enterprise package.",
        authorName: "Sarah Chen",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: "note-3",
        customerId: "cust-3",
        content: "Emma mentioned they're evaluating multiple vendors. Need to highlight our European data center advantages.",
        authorName: "Marcus Brown",
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
    ];

    sampleNotes.forEach(note => {
      this.customerNotes.set(note.id, note as CustomerNote);
    });

    // Add sample team activities
    const sampleActivities = [
      {
        id: "act-1",
        action: "updated customer",
        userName: "Sarah Chen",
        customerName: "Sarah Johnson",
        customerId: "cust-1",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: "act-2",
        action: "added a note to",
        userName: "Alex Chen",
        customerName: "Sarah Johnson",
        customerId: "cust-1",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
      {
        id: "act-3",
        action: "created customer",
        userName: "Marcus Brown",
        customerName: "Marcus Rodriguez",
        customerId: "cust-2",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: "act-4",
        action: "exported customer data",
        userName: "Sarah Chen",
        customerName: null,
        customerId: null,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      },
    ];

    sampleActivities.forEach(activity => {
      this.teamActivity.set(activity.id, activity as TeamActivity);
    });
  }

  async getCustomers(filters?: { status?: string; region?: string; search?: string }): Promise<Customer[]> {
    let results = Array.from(this.customers.values());
    
    if (filters?.status && filters.status !== 'all') {
      results = results.filter(c => c.status === filters.status);
    }
    
    if (filters?.region && filters.region !== 'all') {
      results = results.filter(c => c.region === filters.region);
    }
    
    if (filters?.search && filters.search.trim()) {
      const search = filters.search.toLowerCase();
      results = results.filter(c => 
        c.firstName.toLowerCase().includes(search) ||
        c.lastName.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.company.toLowerCase().includes(search)
      );
    }
    
    return results.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const now = new Date();
    const customer: Customer = {
      ...insertCustomer,
      id,
      createdAt: now,
      updatedAt: now,
      role: insertCustomer.role || null,
      phone: insertCustomer.phone || null,
      lastContact: insertCustomer.lastContact || null,
      lastContactBy: insertCustomer.lastContactBy || null,
      status: insertCustomer.status || 'prospect',
    };
    this.customers.set(id, customer);
    
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
    const existing = this.customers.get(id);
    if (!existing) return undefined;
    
    const updated: Customer = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.customers.set(id, updated);
    
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
    const customer = this.customers.get(id);
    if (!customer) return false;
    
    this.customers.delete(id);
    
    // Remove associated notes
    Array.from(this.customerNotes.entries()).forEach(([noteId, note]) => {
      if (note.customerId === id) {
        this.customerNotes.delete(noteId);
      }
    });
    
    // Create team activity
    await this.createTeamActivity({
      action: 'deleted customer',
      userName: 'System',
      customerName: `${customer.firstName} ${customer.lastName}`,
    });
    
    return true;
  }

  async getCustomerNotes(customerId: string): Promise<CustomerNote[]> {
    return Array.from(this.customerNotes.values())
      .filter(note => note.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createCustomerNote(insertNote: InsertCustomerNote): Promise<CustomerNote> {
    const id = randomUUID();
    const note: CustomerNote = {
      ...insertNote,
      id,
      createdAt: new Date(),
    };
    this.customerNotes.set(id, note);
    
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
    return Array.from(this.teamActivity.values())
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, limit);
  }

  async createTeamActivity(insertActivity: InsertTeamActivity): Promise<TeamActivity> {
    const id = randomUUID();
    const activity: TeamActivity = {
      ...insertActivity,
      id,
      createdAt: new Date(),
      customerId: insertActivity.customerId || null,
      customerName: insertActivity.customerName || null,
    };
    this.teamActivity.set(id, activity);
    return activity;
  }

  async getCustomerAnalytics(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    totalNotes: number;
    recentExports: number;
  }> {
    const customers = Array.from(this.customers.values());
    const notes = Array.from(this.customerNotes.values());
    
    return {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === 'active').length,
      totalNotes: notes.length,
      recentExports: 12, // Mock value for exports
    };
  }
}

export const storage = new MemStorage();
