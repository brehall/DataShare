import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Edit, MessageSquarePlus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { Customer } from "@shared/schema";

interface CustomerTableProps {
  onEditCustomer: (customer: Customer) => void;
  onViewCustomer: (customer: Customer) => void;
  onAddNote: (customer: Customer) => void;
}

export function CustomerTable({ onEditCustomer, onViewCustomer, onAddNote }: CustomerTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers', { 
      status: statusFilter === "all" ? undefined : statusFilter, 
      region: regionFilter === "all" ? undefined : regionFilter, 
      search: searchFilter || undefined 
    }],
  });

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'customers.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'prospect':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <CardTitle>Customer Database</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="north-america">North America</SelectItem>
                <SelectItem value="europe">Europe</SelectItem>
                <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                <SelectItem value="latin-america">Latin America</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Search customers..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-64"
            />
            
            <Button variant="outline" onClick={handleExport}>
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-slate-700">Customer</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-slate-700">Company</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-slate-700">Status</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-slate-700">Region</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-slate-700">Last Contact</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {customers?.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-medium">
                          {customer.firstName[0]}{customer.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {customer.firstName} {customer.lastName}
                        </p>
                        <p className="text-sm text-slate-500">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-slate-900">{customer.company}</p>
                    <p className="text-sm text-slate-500">{customer.role}</p>
                  </td>
                  <td className="py-4 px-6">
                    <Badge className={getStatusColor(customer.status)}>
                      {customer.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-slate-700 capitalize">
                    {customer.region.replace('-', ' ')}
                  </td>
                  <td className="py-4 px-6">
                    {customer.lastContact ? (
                      <>
                        <p className="text-slate-900">
                          {formatDistanceToNow(new Date(customer.lastContact), { addSuffix: true })}
                        </p>
                        <p className="text-sm text-slate-500">by {customer.lastContactBy}</p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">No contact</p>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewCustomer(customer)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditCustomer(customer)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAddNote(customer)}
                      >
                        <MessageSquarePlus className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {!customers?.length && (
            <div className="text-center py-8">
              <p className="text-slate-500">No customers found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
