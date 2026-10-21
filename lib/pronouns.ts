import type { Pronouns } from "@/lib/types";

export const PRONOUN_FORMS: Record<Pronouns, { they: string; them: string; their: string }> = {
  he: { they: "he", them: "him", their: "his" },
  she: { they: "she", them: "her", their: "her" },
  they: { they: "they", them: "them", their: "their" },
};

/** How agents refer to the person: what they chose on the You page, else what their About says, else "they". */
export function pronounsOf(user: { pronouns?: Pronouns | null; about?: string | null }): Pronouns {
  if (user.pronouns) return user.pronouns;
  const about = user.about ?? "";
  const he = about.match(/\b(he|him|his|himself)\b/gi)?.length ?? 0;
  const she = about.match(/\b(she|her|hers|herself)\b/gi)?.length ?? 0;
  return he > she ? "he" : she > he ? "she" : "they";
}
