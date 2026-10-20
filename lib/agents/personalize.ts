import type { PersonalityId, UserAgent } from "@/lib/types";
import { AGENT_PROFILES, agentProfile, type AgentProfile } from "./catalog";

// A template (Laura, Theo…) plus the person's own choices: its name, voice,
// look, personality and extra instructions. This is the agent they talk to.

export interface PersonalAgent extends AgentProfile {
  id: string;
  template: string;
  /** The person's own instructions for this agent, verbatim. */
  customInstructions: string | null;
}

export const PERSONALITIES: Record<PersonalityId, { label: string; hint: string; prompt: string }> = {
  warm: { label: "Warm", hint: "Kind, encouraging, checks in on you", prompt: "warm, kind and encouraging" },
  direct: { label: "Direct", hint: "Gets to the point, no fluff", prompt: "direct, efficient and to the point" },
  playful: { label: "Playful", hint: "Light, funny, a bit cheeky", prompt: "playful, witty and light-hearted" },
  calm: { label: "Calm", hint: "Steady, unhurried, soothing", prompt: "calm, steady and unhurried" },
};

/** Gemini Live voices worth offering, with how they sound. */
export const VOICES = [
  { id: "Aoede", hint: "Breezy" },
  { id: "Kore", hint: "Firm" },
  { id: "Leda", hint: "Youthful" },
  { id: "Zephyr", hint: "Bright" },
  { id: "Sulafat", hint: "Warm" },
  { id: "Achernar", hint: "Soft" },
  { id: "Vindemiatrix", hint: "Gentle" },
  { id: "Despina", hint: "Smooth" },
  { id: "Puck", hint: "Upbeat" },
  { id: "Orus", hint: "Firm" },
  { id: "Charon", hint: "Informative" },
  { id: "Fenrir", hint: "Excitable" },
  { id: "Achird", hint: "Friendly" },
  { id: "Algieba", hint: "Smooth" },
  { id: "Gacrux", hint: "Mature" },
  { id: "Sadachbia", hint: "Lively" },
] as const;

export function personalize(agent: UserAgent): PersonalAgent {
  const base = agentProfile(agent.template) ?? AGENT_PROFILES[0];
  return {
    ...base,
    id: agent.id,
    template: agent.template,
    name: agent.name,
    face: agent.look ?? base.face,
    persona: {
      ...base.persona,
      voice: agent.voice ?? base.persona.voice,
      personality: agent.personality ? PERSONALITIES[agent.personality].prompt : base.persona.personality,
    },
    customInstructions: agent.instructions,
  };
}
