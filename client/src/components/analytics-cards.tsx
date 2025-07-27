import { useQuery } from "@tanstack/react-query";
import { Users, TrendingUp, MessageSquare, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AnalyticsData {
  totalCustomers: number;
  activeCustomers: number;
  totalNotes: number;
  recentExports: number;
}

export function AnalyticsCards() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-slate-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Customers",
      value: analytics ? analytics.totalCustomers : 0,
      icon: Users,
      color: "blue",
      change: "+12%",
      period: "from last month",
    },
    {
      title: "Active This Month",
      value: analytics ? analytics.activeCustomers : 0,
      icon: TrendingUp,
      color: "emerald",
      change: "+8%",
      period: "from last month",
    },
    {
      title: "Team Comments",
      value: analytics ? analytics.totalNotes : 0,
      icon: MessageSquare,
      color: "purple",
      change: "+23%",
      period: "this week",
    },
    {
      title: "Data Exports",
      value: analytics ? analytics.recentExports : 0,
      icon: Download,
      color: "orange",
      change: "Last export:",
      period: "2 hours ago",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{card.title}</p>
                  <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                </div>
                <div className={`w-12 h-12 bg-${card.color}-100 rounded-lg flex items-center justify-center`}>
                  <Icon className={`text-${card.color}-600 w-5 h-5`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-emerald-600 font-medium">{card.change}</span>
                <span className="text-slate-500 ml-1">{card.period}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
