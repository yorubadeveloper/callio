"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface ContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  currentContext?: string | null;
  onUpdate: () => void;
}

export function ContextDialog({
  open,
  onOpenChange,
  userId,
  currentContext,
  onUpdate,
}: ContextDialogProps) {
  const [context, setContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setContext(currentContext || "");
  }, [currentContext]);

  const handleSave = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      await api.preferences.update(userId, {
        additional_context: context || null,
      });
      toast.success("Context saved successfully");
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save context");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Additional Context</DialogTitle>
          <DialogDescription>
            Provide context about yourself that Callio can use to personalize your briefings and
            answer questions. This could include your interests, current projects, preferences, or
            anything else you'd like Callio to know about you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="context">Your Context</Label>
          <Textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Example: I'm a software engineer working on AI projects. I love hiking and photography. I'm currently learning Spanish and planning a trip to Barcelona in March. I'm interested in startup news and emerging technologies..."
            className="min-h-[200px] resize-y"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            {context.length} characters {context.length > 2000 && "(keep it under 10,000 for best results)"}
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Context
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
