"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { UserPreferences } from "@/types/preferences";

interface LanguageSelectorProps {
  userId?: string;
  preferences: UserPreferences | null;
  onUpdate: () => void;
}

const SUPPORTED_LANGUAGES = [
  { value: "English", label: "🇺🇸 English", flag: "🇺🇸" },
  { value: "Spanish", label: "🇪🇸 Español", flag: "🇪🇸" },
  { value: "French", label: "🇫🇷 Français", flag: "🇫🇷" },
  { value: "German", label: "🇩🇪 Deutsch", flag: "🇩🇪" },
  { value: "Italian", label: "🇮🇹 Italiano", flag: "🇮🇹" },
  { value: "Portuguese", label: "🇵🇹 Português", flag: "🇵🇹" },
  { value: "Chinese", label: "🇨🇳 中文", flag: "🇨🇳" },
  { value: "Japanese", label: "🇯🇵 日本語", flag: "🇯🇵" },
  { value: "Korean", label: "🇰🇷 한국어", flag: "🇰🇷" },
  { value: "Arabic", label: "🇸🇦 العربية", flag: "🇸🇦" },
  { value: "Hindi", label: "🇮🇳 हिन्दी", flag: "🇮🇳" },
  { value: "Russian", label: "🇷🇺 Русский", flag: "🇷🇺" },
  { value: "Dutch", label: "🇳🇱 Nederlands", flag: "🇳🇱" },
  { value: "Polish", label: "🇵🇱 Polski", flag: "🇵🇱" },
];

export function LanguageSelector({ userId, preferences, onUpdate }: LanguageSelectorProps) {
  const [language, setLanguage] = useState("English");

  useEffect(() => {
    if (preferences?.preferred_language) {
      setLanguage(preferences.preferred_language);
    }
  }, [preferences]);

  const handleLanguageChange = async (value: string) => {
    if (!userId) return;

    setLanguage(value);

    try {
      await api.preferences.update(userId, {
        preferred_language: value,
      });
      toast.success(`Language changed to ${value}`);
      onUpdate();
    } catch (error) {
      // Revert on error
      setLanguage(preferences?.preferred_language || "English");
      toast.error("Failed to update language");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          <CardTitle>Language</CardTitle>
        </div>
        <CardDescription>
          Choose the language for your briefings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="language">Briefing Language</Label>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Callio will speak to you in the selected language during your briefings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
