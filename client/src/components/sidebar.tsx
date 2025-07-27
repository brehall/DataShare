import { Users, BarChart3, MessageSquare, Download, Database } from "lucide-react";
import { Link, useLocation } from "wouter";

const navigation = [
  { name: "Dashboard", href: "/", icon: Database, current: true },
  { name: "Customers", href: "/customers", icon: Users, count: 247 },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Team Activity", href: "/activity", icon: MessageSquare, hasActivity: true },
  { name: "Export Data", href: "/export", icon: Download },
];

const teamMembers = [
  { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=32&h=32&fit=crop&crop=face" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      {/* Logo and Company */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Users className="text-white w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">CustomerHub</h1>
            <p className="text-xs text-slate-500">Acme Corp Team</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isCurrent = location === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                      isCurrent
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    {item.count && (
                      <span className="ml-auto bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded-full">
                        {item.count}
                      </span>
                    )}
                    {item.hasActivity && (
                      <span className="ml-auto w-2 h-2 bg-emerald-500 rounded-full"></span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Team Members */}
      <div className="p-4 border-t border-slate-200">
        <h3 className="text-sm font-medium text-slate-900 mb-3">Team Online</h3>
        <div className="space-y-2">
          {teamMembers.map((member) => (
            <div key={member.name} className="flex items-center space-x-2">
              <div className="relative">
                <img 
                  src={member.avatar} 
                  alt={member.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
              </div>
              <span className="text-sm text-slate-700">{member.name}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
