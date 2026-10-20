import { Behavior, FunctionResponseScheduling, type FunctionDeclaration, type Tool } from "@google/genai";
import type { PlanId } from "@/lib/pricing";
import type { CallAction } from "@/lib/call/types";
import { planAllows, SKILLS } from "./skills";

// Function tools the agent can call mid-conversation. Each one carries how the
// call screen should describe it and how its result re-enters the conversation:
//   BLOCKING      the agent needs the answer before it can reply (calendar, weather)
//   NON_BLOCKING  the agent keeps talking while it runs (memory, long tasks)

interface ToolMeta {
  declaration: FunctionDeclaration;
  kind: CallAction["kind"];
  /** Label for the call screen while it runs, from the call's arguments. */
  label: (args: Record<string, unknown>) => string;
  /** When the result is handed back to the model. */
  scheduling: FunctionResponseScheduling;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

export const TOOLS: Record<string, ToolMeta> = {
  remember: {
    kind: "memory",
    label: (a) => `Remembered: ${str(a.fact)}`,
    scheduling: FunctionResponseScheduling.SILENT,
    declaration: {
      name: "remember",
      description: "Save a durable fact or preference about the person for future calls.",
      behavior: Behavior.NON_BLOCKING,
      parametersJsonSchema: {
        type: "object",
        properties: { fact: { type: "string", description: "One short sentence, in the third person." } },
        required: ["fact"],
      },
    },
  },
  forget: {
    kind: "memory",
    label: (a) => `Forgot: ${str(a.about)}`,
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
    declaration: {
      name: "forget",
      description: "Delete remembered facts that match what the person asked you to forget.",
      behavior: Behavior.NON_BLOCKING,
      parametersJsonSchema: {
        type: "object",
        properties: { about: { type: "string", description: "What to forget, in a few words." } },
        required: ["about"],
      },
    },
  },
  schedule_call: {
    kind: "schedule",
    label: (a) => `Scheduling a call: ${str(a.purpose)}`,
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
    declaration: {
      name: "schedule_call",
      description: "Book a future call from you to the person. Confirm the time out loud first.",
      behavior: Behavior.BLOCKING,
      parametersJsonSchema: {
        type: "object",
        properties: {
          when: {
            type: "string",
            description: "ISO 8601 local date-time in the person's timezone, e.g. 2026-10-21T18:00.",
          },
          purpose: { type: "string", description: "What the call is for, in a few words." },
          repeat: {
            type: "string",
            enum: ["none", "daily", "weekdays", "weekly"],
            description: "How often it repeats.",
          },
        },
        required: ["when", "purpose"],
      },
    },
  },
  set_reminder: {
    kind: "schedule",
    label: (a) => `Reminder: ${str(a.text)}`,
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
    declaration: {
      name: "set_reminder",
      description: "Set a short written reminder that pops up at a time. Use schedule_call if it needs a conversation.",
      behavior: Behavior.BLOCKING,
      parametersJsonSchema: {
        type: "object",
        properties: {
          when: { type: "string", description: "ISO 8601 local date-time in the person's timezone." },
          text: { type: "string" },
        },
        required: ["when", "text"],
      },
    },
  },
  list_upcoming: {
    kind: "schedule",
    label: () => "Checking what's coming up",
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
    declaration: {
      name: "list_upcoming",
      description: "List scheduled calls and reminders.",
      behavior: Behavior.BLOCKING,
      parametersJsonSchema: { type: "object", properties: {} },
    },
  },
  cancel_upcoming: {
    kind: "schedule",
    label: (a) => `Cancelling: ${str(a.what)}`,
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
    declaration: {
      name: "cancel_upcoming",
      description: "Cancel a scheduled call or reminder that matches the description.",
      behavior: Behavior.BLOCKING,
      parametersJsonSchema: {
        type: "object",
        properties: { what: { type: "string" } },
        required: ["what"],
      },
    },
  },
  get_calendar_events: {
    kind: "calendar",
    label: () => "Checking your calendar",
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
    declaration: {
      name: "get_calendar_events",
      description: "Get the person's calendar events for a day.",
      behavior: Behavior.BLOCKING,
      parametersJsonSchema: {
        type: "object",
        properties: {
          date: { type: "string", description: "YYYY-MM-DD in the person's timezone. Defaults to today." },
        },
      },
    },
  },
  get_weather: {
    kind: "search",
    label: (a) => `Checking the weather${a.place ? ` in ${str(a.place)}` : ""}`,
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
    declaration: {
      name: "get_weather",
      description: "Current weather and today's forecast for a place.",
      behavior: Behavior.BLOCKING,
      parametersJsonSchema: {
        type: "object",
        properties: { place: { type: "string", description: "City name. Defaults to where the person lives." } },
      },
    },
  },
  start_computer_task: {
    kind: "task",
    label: (a) => `Working on: ${str(a.goal)}`,
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
    declaration: {
      name: "start_computer_task",
      description:
        "Start a task in a web browser for the person, e.g. finding and booking a table, filling a form, comparing prices. Runs in the background; you'll get the result later.",
      behavior: Behavior.NON_BLOCKING,
      parametersJsonSchema: {
        type: "object",
        properties: {
          goal: { type: "string", description: "What done looks like, in one sentence." },
          constraints: { type: "string", description: "Budget, times, names, anything that must be respected." },
        },
        required: ["goal"],
      },
    },
  },
  send_recap: {
    kind: "recap",
    label: () => "Sending you a written recap",
    scheduling: FunctionResponseScheduling.SILENT,
    declaration: {
      name: "send_recap",
      description: "Send the person something in writing: a list, an address, a summary.",
      behavior: Behavior.NON_BLOCKING,
      parametersJsonSchema: {
        type: "object",
        properties: { content: { type: "string" } },
        required: ["content"],
      },
    },
  },
  end_call: {
    kind: "other",
    label: () => "Wrapping up",
    scheduling: FunctionResponseScheduling.SILENT,
    declaration: {
      name: "end_call",
      description: "Hang up after you've said goodbye and the person has nothing else.",
      behavior: Behavior.NON_BLOCKING,
      parametersJsonSchema: { type: "object", properties: {} },
    },
  },
};

/** The Live API tools for a call, limited to what the person's plan includes. */
export function toolsForPlan(plan: PlanId): Tool[] {
  const skills = SKILLS.filter((s) => s.status === "live" && planAllows(plan, s.minPlan));
  const names = new Set(skills.flatMap((s) => s.tools));
  const declarations = Object.values(TOOLS)
    .filter((t) => names.has(t.declaration.name!) || t.declaration.name === "end_call")
    .map((t) => t.declaration);
  const tools: Tool[] = [{ functionDeclarations: declarations }];
  if (names.has("google_search")) tools.push({ googleSearch: {} });
  return tools;
}
