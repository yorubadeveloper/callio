"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneCall, MapPin, Spinner, Warning } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { User } from "@/types/user";

interface PhoneDisplayProps {
  user: User | null;
  onUpdate: () => void;
}

export function PhoneDisplay({ user, onUpdate }: PhoneDisplayProps) {
  const hasPhone = !!user?.phone_number;
  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.phone_number) {
      setPhoneNumber(user.phone_number);
    }
    if (user?.location) {
      setLocation(user.location);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!phoneNumber.trim()) {
      toast.error("Phone number is required");
      return;
    }

    setIsLoading(true);
    try {
      await api.users.update(user.id, {
        phone_number: phoneNumber.trim(),
        location: location.trim() || undefined,
      });
      setIsEditing(false);
      toast.success(hasPhone ? "Details updated" : "Phone number saved");
      onUpdate();
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setIsLoading(false);
    }
  };

  // Show inline setup form if no phone number
  const showForm = isEditing || !hasPhone;

  return (
    <Card className={!hasPhone ? "border-foreground/20" : ""}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PhoneCall className="h-5 w-5" />
          <CardTitle>Phone & Location</CardTitle>
        </div>
        <CardDescription>
          {hasPhone
            ? "Your phone number and location for briefings"
            : "Add your phone number to start receiving calls"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasPhone && (
          <div className="flex items-start gap-2 mb-4 text-sm text-muted-foreground">
            <Warning className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="font-light">Phone number is required to receive daily briefings and meeting reminders</p>
          </div>
        )}
        {showForm ? (
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
                autoFocus={!hasPhone}
              />
              <p className="text-xs text-muted-foreground font-light">
                E.164 format (e.g., +1234567890)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="New York"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground font-light">
                City name or zip code for weather updates
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={isLoading} className="rounded-full">
                {isLoading && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
                {hasPhone ? "Save" : "Get Started"}
              </Button>
              {hasPhone && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setPhoneNumber(user?.phone_number || "");
                    setLocation(user?.location || "");
                  }}
                  disabled={isLoading}
                  className="rounded-full"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-mono tracking-tight text-foreground">
                {phoneNumber}
              </span>
            </div>
            {user?.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{user.location}</span>
              </div>
            )}
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="rounded-full">
              Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
