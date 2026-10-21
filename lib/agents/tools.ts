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
  create_calendar_event: {
    kind: "calendar",
    label: (a) => `Adding to your calendar: ${str(a.title)}`,
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
    declaration: {
      name: "create_calendar_event",
      description: "Add an event to the person's Google Calendar. Confirm title and time out loud first.",
      behavior: Behavior.BLOCKING,
      parametersJsonSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          start: { type: "string", description: "Local ISO date-time in the person's timezone, e.g. 2026-10-23T13:00." },
          end: { type: "string", description: "Local ISO date-time. Defaults to 30 minutes after start." },
          description: { type: "string" },
        },
        required: ["title", "start"],
      },
    },
  },
  move_calendar_event: {
    kind: "calendar",
    label: (a) => `Moving ${str(a.query) || "your event"}`,
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
    declaration: {
      name: "move_calendar_event",
      description:
        "Move an existing event to a new time, keeping its length. Pass event_id from get_calendar_events, or a short query like 'call with Dana'. Confirm first.",
      behavior: Behavior.BLOCKING,
      parametersJsonSchema: {
        type: "object",
        properties: {
          event_id: { type: "string" },
          query: { type: "string", description: "Words from the event title, if you don't have the id." },
          new_start: { type: "string", description: "Local ISO date-time in the person's timezone." },
          new_end: { type: "string", description: "Local ISO date-time. Defaults to keeping the same length." },
        },
        required: ["new_start"],
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
  get_briefing: {
    kind: "search",
    label: () => "Putting your briefing together",
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
    declaration: {
      name: "get_briefing",
      description:
        "Today's briefing: their sites, servers and analytics, calendar, weather and news, ranked by what matters. Use when they ask how things are, what they missed, or for their morning briefing. If none was prepared it takes a few seconds; say \"give me a sec\".",
      behavior: Behavior.BLOCKING,
      parametersJsonSchema: {
        type: "object",
        properties: { fresh: { type: "boolean", description: "True to ignore the one prepared earlier today." } },
      },
    },
  },
  check_sources: {
    kind: "search",
    label: (a) => (a.source ? `Checking ${str(a.source)}` : "Checking your sites and servers"),
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
    declaration: {
      name: "check_sources",
      description:
        "A fresh look at their connected sources right now: whether sites are up, which apps or deploys failed on Dokploy, and recent traffic from Analytix. Always use this instead of memory for anything about how these are doing.",
      behavior: Behavior.BLOCKING,
      parametersJsonSchema: {
        type: "object",
        properties: {
          source: {
            type: "string",
            description: "A connection's name or what it covers (\"my sites\", \"Dokploy\", \"analytics\"). Empty for all.",
          },
        },
      },
    },
  },
  use_connector_tool: {
    kind: "search",
    label: (a) => (a.tool ? `Asking ${str(a.connector)}` : `Looking at what ${str(a.connector)} can do`),
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
    declaration: {
      name: "use_connector_tool",
      description:
        "Ask Analytix or a custom connector something. Call it first with just `connector` to see its tools and their inputs, then with `tool` and `arguments`. Tools marked as changing things need a clear yes from them first.",
      behavior: Behavior.BLOCKING,
      parametersJsonSchema: {
        type: "object",
        properties: {
          connector: { type: "string", description: "The connection's name, e.g. Analytix." },
          tool: { type: "string", description: "A tool name from the list. Leave out to list tools." },
          arguments: { type: "object", description: "The tool's inputs, matching its input schema." },
        },
        required: ["connector"],
      },
    },
  },
  call_contact: {
    kind: "schedule",
    label: (a) => `Booking a call to ${str(a.contact)}`,
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
    declaration: {
      name: "call_contact",
      description:
        "Book a real phone call to one of their contacts that passes a message on, now or at a time. Say back who, what and when, and get a yes first.",
      behavior: Behavior.BLOCKING,
      parametersJsonSchema: {
        type: "object",
        properties: {
          contact: { type: "string", description: "A name from 'People you can call', e.g. Mum." },
          message: {
            type: "string",
            description: "What to tell them, in the person's words, e.g. \"I'm doing well and I'll visit in December\".",
          },
          when: {
            type: "string",
            description: "Local ISO date-time in the person's timezone, e.g. 2026-10-21T19:00. Leave out to call now.",
          },
          repeat: { type: "string", enum: ["none", "daily", "weekdays", "weekly"] },
        },
        required: ["contact", "message"],
      },
    },
  },
  stop_calls: {
    kind: "other",
    label: () => "They asked not to be called again",
    scheduling: FunctionResponseScheduling.WHEN_IDLE,
    declaration: {
      name: "stop_calls",
      description: "The person you called asked not to be called by Callio again. Confirm, then say goodbye.",
      behavior: Behavior.BLOCKING,
      parametersJsonSchema: { type: "object", properties: {} },
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

/** On a call to one of their contacts the agent can only end the call or record an opt-out. */
export const CONTACT_CALL_TOOLS: Tool[] = [
  { functionDeclarations: [TOOLS.stop_calls.declaration, TOOLS.end_call.declaration] },
];

/** When each tool's result goes back to the model, for the phone bridge (it runs tools server-side). */
export const TOOL_SCHEDULING: Record<string, FunctionResponseScheduling> = Object.fromEntries(
  Object.entries(TOOLS).map(([name, t]) => [name, t.scheduling]),
);

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
