"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface PhoneSetupDialogProps {
  open: boolean;
  email: string;
  name: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  onComplete: () => void;
}

export function PhoneSetupDialog({ open, email, name, accessToken, refreshToken, expiresAt, onComplete }: PhoneSetupDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber) {
      toast.error("Phone number is required");
      return;
    }

    setIsLoading(true);
    try {
      // Create user in backend
      const user = await api.users.create({
        phone_number: phoneNumber,
        email: email,
        name: name,
        location: location || undefined,
      });

      // Store calendar tokens if available
      if (accessToken && refreshToken && expiresAt) {
        try {
          await api.users.updateCalendarTokens(user.id, {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: new Date(expiresAt * 1000).toISOString(),
          });
        } catch (tokenError) {
          console.error("Failed to store calendar tokens:", tokenError);
          // Don't fail the whole flow if token storage fails
        }
      }

      toast.success("Account created successfully!");
      onComplete();
    } catch (error) {
      toast.error("Failed to create account. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Complete Your Setup</DialogTitle>
          <DialogDescription>
            We need your phone number to send you daily briefings via call.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Use E.164 format (e.g., +1234567890)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="New York"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              For weather updates in your briefings
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete Setup
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
