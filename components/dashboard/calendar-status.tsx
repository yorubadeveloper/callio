"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check, X, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";

export function CalendarStatus() {
  const { data: session } = useSession();
  const [isConnected] = useState(!!session?.accessToken);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    // TODO: Implement disconnect logic
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Google Calendar</CardTitle>
          </div>
          {isConnected ? (
            <Badge variant="default" className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1">
              <X className="h-3 w-3" />
              Not Connected
            </Badge>
          )}
        </div>
        <CardDescription>
          {isConnected
            ? "Your calendar is connected and syncing"
            : "Connect your Google Calendar to include events in briefings"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Connected as: {session?.user?.email}
            </div>
            <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disconnect Calendar
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={handleConnect} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect Calendar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
