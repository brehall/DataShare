import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/sidebar";
import { AnalyticsCards } from "@/components/analytics-cards";
import { CustomerTable } from "@/components/customer-table";
import { TeamActivityFeed } from "@/components/team-activity";
import { CustomerModal } from "@/components/customer-modal";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Customer } from "@shared/schema";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | 'note'>('create');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { isConnected } = useWebSocket();

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleAddNote = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalMode('note');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-slate-900">Customer Dashboard</h2>
              <div className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {isConnected ? (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                    Live updates active
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-slate-400 rounded-full mr-2"></span>
                    Connecting...
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search customers..."
                  className="pl-10 w-64"
                />
              </div>
              
              <Button onClick={handleAddCustomer}>
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <AnalyticsCards />
            <CustomerTable
              onEditCustomer={handleEditCustomer}
              onViewCustomer={handleViewCustomer}
              onAddNote={handleAddNote}
            />
            <TeamActivityFeed />
          </div>
        </div>
      </main>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={closeModal}
        customer={selectedCustomer}
        mode={modalMode}
      />
    </div>
  );
}
