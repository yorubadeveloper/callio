"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { User } from "@/types/user";

interface PhoneDisplayProps {
  user: User | null;
  onUpdate: () => void;
}

export function PhoneDisplay({ user, onUpdate }: PhoneDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.phone_number) {
      setPhoneNumber(user.phone_number);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await api.users.update(user.id, { phone_number: phoneNumber });
      setIsEditing(false);
      toast.success("Phone number updated");
      onUpdate();
    } catch (error) {
      toast.error("Failed to update phone number");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          <CardTitle>Phone Number</CardTitle>
        </div>
        <CardDescription>
          Your phone number for receiving briefing calls
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Use E.164 format (e.g., +1234567890)
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-lg font-mono">
              {phoneNumber || "No phone number set"}
            </div>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
