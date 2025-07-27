import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { insertCustomerSchema, insertCustomerNoteSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import type { Customer } from "@shared/schema";
import { z } from "zod";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  mode: 'create' | 'edit' | 'view' | 'note';
}

const customerFormSchema = insertCustomerSchema.extend({
  initialNote: z.string().optional(),
});

export function CustomerModal({ isOpen, onClose, customer, mode }: CustomerModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(mode === 'note' ? z.object({ content: z.string().min(1, "Note content is required") }) : customerFormSchema),
    defaultValues: mode === 'note' ? { content: '' } : {
      firstName: customer?.firstName || '',
      lastName: customer?.lastName || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      company: customer?.company || '',
      role: customer?.role || '',
      status: customer?.status || 'prospect',
      region: customer?.region || 'north-america',
      initialNote: '',
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const { initialNote, ...customerData } = data;
      const response = await apiRequest('POST', '/api/customers', customerData);
      const newCustomer = await response.json();
      
      // Add initial note if provided
      if (initialNote?.trim()) {
        await apiRequest('POST', `/api/customers/${newCustomer.id}/notes`, {
          content: initialNote,
          authorName: 'System User', // In a real app, this would come from auth
        });
      }
      
      return newCustomer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
      toast({ title: "Customer created successfully" });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create customer", variant: "destructive" });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/customers/${customer?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({ title: "Customer updated successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to update customer", variant: "destructive" });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/customers/${customer?.id}/notes`, {
        ...data,
        authorName: 'System User', // In a real app, this would come from auth
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers', customer?.id, 'notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-activity'] });
      toast({ title: "Note added successfully" });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to add note", variant: "destructive" });
    },
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await createCustomerMutation.mutateAsync(data);
      } else if (mode === 'edit') {
        await updateCustomerMutation.mutateAsync(data);
      } else if (mode === 'note') {
        await createNoteMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'create':
        return 'Add New Customer';
      case 'edit':
        return 'Edit Customer';
      case 'view':
        return 'Customer Details';
      case 'note':
        return `Add Note for ${customer?.firstName} ${customer?.lastName}`;
      default:
        return 'Customer';
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        {mode === 'view' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <p className="text-slate-900">{customer?.firstName} {customer?.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <p className="text-slate-900">{customer?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <p className="text-slate-900">{customer?.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                <p className="text-slate-900">{customer?.company}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <p className="text-slate-900">{customer?.role || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <p className="text-slate-900 capitalize">{customer?.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Region</label>
                <p className="text-slate-900 capitalize">{customer?.region.replace('-', ' ')}</p>
              </div>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {mode === 'note' ? (
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add your note here..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isReadOnly} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isReadOnly} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} disabled={isReadOnly} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} disabled={isReadOnly} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company *</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isReadOnly} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isReadOnly} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="prospect">Prospect</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Region</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select region" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="north-america">North America</SelectItem>
                              <SelectItem value="europe">Europe</SelectItem>
                              <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                              <SelectItem value="latin-america">Latin America</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {mode === 'create' && (
                    <FormField
                      control={form.control}
                      name="initialNote"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initial Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any initial notes about this customer..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                {!isReadOnly && (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Customer' : mode === 'note' ? 'Add Note' : 'Update Customer'}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
