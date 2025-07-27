import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TeamActivity } from "@shared/schema";

export function TeamActivityFeed() {
  const { data: activities, isLoading } = useQuery<TeamActivity[]>({
    queryKey: ['/api/team-activity'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Team Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/4 mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const defaultAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Team Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities?.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <img 
                src={defaultAvatar}
                alt={activity.userName}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium text-slate-900">{activity.userName}</span>
                  <span className="text-slate-600"> {activity.action} </span>
                  {activity.customerName && (
                    <span className="font-medium text-slate-900">{activity.customerName}</span>
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {activity.createdAt && formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
          {!activities?.length && (
            <p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
