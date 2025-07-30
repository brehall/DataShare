import type { Express } from "express";
import { setupAuth, requireAuth } from "./auth";
import { storage } from "./storage";
import { insertCustomerSchema, insertCustomerNoteSchema, insertInvitationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<void> {
  // Setup authentication
  setupAuth(app);

  // Customer routes (protected)
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const filters = {
        status: req.query.status === 'all' ? undefined : req.query.status as string,
        region: req.query.region === 'all' ? undefined : req.query.region as string,
        search: req.query.search as string,
      };
      const customers = await storage.getCustomers(filters);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, validatedData);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteCustomer(req.params.id);
      if (!success) return res.status(404).json({ message: "Customer not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Customer notes routes
  app.get("/api/customers/:id/notes", requireAuth, async (req, res) => {
    try {
      const notes = await storage.getCustomerNotes(req.params.id);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer notes" });
    }
  });

  app.post("/api/customers/:id/notes", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCustomerNoteSchema.parse({
        ...req.body,
        customerId: req.params.id,
      });
      const note = await storage.createCustomerNote(validatedData);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  // Team activity routes
  app.get("/api/team-activity", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getTeamActivity(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team activity" });
    }
  });

  // Analytics routes
  app.get("/api/analytics", requireAuth, async (req, res) => {
    try {
      const analytics = await storage.getCustomerAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Invitation management routes
  app.get("/api/invitations", requireAuth, async (req, res) => {
    try {
      const invitations = await storage.getInvitations();
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.post("/api/invitations", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const validatedData = insertInvitationSchema.parse({
        ...req.body,
        invitedBy: user.id,
      });
      const invitation = await storage.createInvitation(validatedData);
      res.status(201).json(invitation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invitation data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  // Export data route
  app.get("/api/export", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      await storage.createTeamActivity({
        action: 'exported customer data',
        userName: 'System',
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
      const headers = 'First Name,Last Name,Email,Phone,Company,Role,Status,Region,Last Contact';
      const rows = customers.map(c => 
        `"${c.firstName}","${c.lastName}","${c.email}","${c.phone || ''}","${c.company}","${c.role || ''}","${c.status}","${c.region}","${c.lastContact || ''}"`
      );
      res.send([headers, ...rows].join('\n'));
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });
}