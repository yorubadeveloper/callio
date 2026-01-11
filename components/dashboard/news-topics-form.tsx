"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Newspaper, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { UserPreferences } from "@/types/preferences";

interface NewsTopicsFormProps {
  userId?: string;
  preferences: UserPreferences | null;
  onUpdate: () => void;
}

export function NewsTopicsForm({ userId, preferences, onUpdate }: NewsTopicsFormProps) {
  const [topic1, setTopic1] = useState("");
  const [topic2, setTopic2] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (preferences) {
      setTopic1(preferences.news_topic_1 || "");
      setTopic2(preferences.news_topic_2 || "");
    }
  }, [preferences]);

  const handleSave = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      await api.preferences.update(userId, {
        news_topic_1: topic1 || null,
        news_topic_2: topic2 || null,
      });
      toast.success("News topics updated");
      onUpdate();
    } catch (error) {
      toast.error("Failed to update news topics");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5" />
          <CardTitle>News Topics</CardTitle>
        </div>
        <CardDescription>
          Choose up to 2 topics for your daily news briefing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="topic1">Topic 1</Label>
          <Input
            id="topic1"
            value={topic1}
            onChange={(e) => setTopic1(e.target.value)}
            placeholder="e.g., AI, Technology, Startups"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="topic2">Topic 2</Label>
          <Input
            id="topic2"
            value={topic2}
            onChange={(e) => setTopic2(e.target.value)}
            placeholder="e.g., Crypto, Business, Politics"
            disabled={isLoading}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Suggestions: AI, Tech, Startups, Crypto, Business, Politics, Sports
        </p>
        <Button size="sm" onClick={handleSave} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Topics
        </Button>
      </CardContent>
    </Card>
  );
}
