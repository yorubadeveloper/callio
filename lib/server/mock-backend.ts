import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import { agentProfile } from "@/lib/agents/catalog";
import { plan as planById, type PlanId } from "@/lib/pricing";
import type { Call, Highlights, Memory, Schedule, Task, User, UserAgent } from "@/lib/types";
import { geminiKey, SUMMARY_MODEL } from "./models";

// Development-only stand-in for the FastAPI backend, so every screen can be
// previewed before the real one is deployed. Turned on with MOCK_BACKEND=1 and
// never in production. Data lives in memory and resets when the server restarts.

export const mockEnabled = () => process.env.NODE_ENV !== "production" && process.env.MOCK_BACKEND === "1";

interface Db {
  users: Map<string, User>;
  agents: UserAgent[];
  memories: Memory[];
  calls: (Call & { user_id: string; max_seconds: number })[];
  schedules: (Schedule & { user_id: string })[];
  tasks: (Task & { user_id: string })[];
}

const g = globalThis as unknown as { __callioMock?: Db };
const db: Db = (g.__callioMock ??= { users: new Map(), agents: [], memories: [], calls: [], schedules: [], tasks: [] });

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

export class MockError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Body = Record<string, unknown>;

/** Handles one backend request. Returns the JSON body, or undefined for 204. */
export async function mockBackend(
  method: string,
  path: string,
  body: Body | undefined,
  userId?: string,
): Promise<unknown> {
  const url = new URL(path, "http://mock");
  const parts = url.pathname.replace(/^\/v1\//, "").split("/");
  const route = `${method} ${parts.map((p, i) => (i > 0 && /^[0-9a-f-]{36}$/.test(p) ? ":id" : p)).join("/")}`;

  if (route === "POST users/sync") return sync(body!);
  const user = userId ? db.users.get(userId) : undefined;
  if (!user) throw new MockError(404, "Account not found.");
  const mine = <T extends { user_id?: string; agent_id?: string | null }>(rows: T[]) =>
    rows.filter((r) => (r.user_id ? r.user_id === user.id : true));
  const myAgents = () => db.agents.filter((a) => (a as UserAgent & { user_id: string }).user_id === user.id);
  const rid = parts[1];

  switch (route) {
    case "GET me":
      return user;
    case "PATCH me":
      Object.assign(
        user,
        pick(body!, [
          "nickname",
          "city",
          "timezone",
          "languages",
          "onboarded",
          "about",
          "interests",
          "tone",
          "detail",
          "style",
          "name",
        ]),
      );
      return user;
    case "DELETE me":
      db.users.delete(user.id);
      return undefined;
    case "GET me/export":
      return { user, agents: myAgents(), memories: mine(db.memories.map(withUser)), calls: mine(db.calls) };
    case "GET me/highlights":
      return highlights(user);

    case "GET agents":
      return myAgents();
    case "POST agents": {
      const limit = planById(user.plan).agents;
      if (limit !== "unlimited" && myAgents().length >= limit)
        throw new MockError(
          403,
          `Your ${planById(user.plan).name} plan includes ${limit} agent${limit === 1 ? "" : "s"}.`,
        );
      const base = agentProfile(String(body!.template))!;
      const agent = {
        id: id(),
        user_id: user.id,
        template: String(body!.template).toLowerCase(),
        name: String(body!.name ?? base.name),
        voice: (body!.voice as string) ?? null,
        look: (body!.look as UserAgent["look"]) ?? null,
        personality: (body!.personality as UserAgent["personality"]) ?? null,
        instructions: (body!.instructions as string) ?? null,
        created_at: now(),
      };
      db.agents.push(agent);
      return agent;
    }
    case "PATCH agents/:id": {
      const agent = myAgents().find((a) => a.id === rid);
      if (!agent) throw new MockError(404, "Agent not found.");
      Object.assign(agent, pick(body!, ["name", "voice", "look", "personality", "instructions"]));
      return agent;
    }
    case "DELETE agents/:id":
      db.agents = db.agents.filter((a) => a.id !== rid);
      db.memories = db.memories.filter((m) => m.agent_id !== rid);
      return undefined;

    case "GET memory": {
      const agentId = url.searchParams.get("agent_id");
      return db.memories.filter((m) => owns(m, user.id) && (!agentId || m.agent_id === agentId || m.agent_id === null));
    }
    case "POST memory": {
      const m = {
        id: id(),
        text: String(body!.text),
        agent_id: (body!.agent_id as string) ?? null,
        source: "manual" as const,
        created_at: now(),
      };
      remember(user.id, m);
      return m;
    }
    case "DELETE memory/:id":
      db.memories = db.memories.filter((m) => m.id !== rid);
      return undefined;
    case "POST memory/import/parse":
      return parseImport(String(body!.text ?? ""));
    case "POST memory/import/commit": {
      const facts = (body!.facts as string[]) ?? [];
      facts.forEach((text) =>
        remember(user.id, { id: id(), text, agent_id: null, source: "import", created_at: now() }),
      );
      const profile = (body!.profile as Body) ?? {};
      for (const [k, v] of Object.entries(profile)) {
        if (k === "interests" || k === "languages") {
          (user as unknown as Body)[k] = [...new Set([...(user[k] as string[]), ...(v as string[])])];
        } else if (v !== null && v !== undefined) {
          (user as unknown as Body)[k] = v;
        }
      }
      return { saved: facts.length + Object.keys(profile).length, user };
    }

    case "POST calls/start": {
      const agent = myAgents().find((a) => a.id === body!.agent_id);
      if (!agent) throw new MockError(403, "That agent isn't one of yours.");
      if (user.credits.total < 1) throw new MockError(402, "You're out of credits. Top up to keep talking.");
      const call = {
        id: id(),
        user_id: user.id,
        agent_id: agent.id,
        channel: "app" as const,
        status: "live" as const,
        started_at: now(),
        ended_at: null,
        seconds: 0,
        credits: 0,
        summary: null,
        transcript: [],
        max_seconds: Math.min(30 * 60, user.credits.total * 60),
      };
      db.calls.unshift(call);
      return {
        call_id: call.id,
        max_seconds: call.max_seconds,
        user,
        agent,
        memory: {
          facts: db.memories
            .filter((m) => owns(m, user.id) && (m.agent_id === null || m.agent_id === agent.id))
            .map((m) => m.text),
          recent_calls: db.calls
            .filter((c) => c.agent_id === agent.id && c.summary)
            .slice(0, 3)
            .map((c) => ({ when: c.started_at.slice(0, 10), summary: c.summary! })),
        },
      };
    }
    case "POST calls/:id/tool":
      return runTool(
        user,
        db.calls.find((c) => c.id === rid)!,
        String(body!.name),
        (body!.args as Body) ?? {},
      );
    case "POST calls/:id/ping": {
      const call = db.calls.find((c) => c.id === rid && c.user_id === user.id);
      if (!call) throw new MockError(404, "Call not found.");
      return call;
    }
    case "POST calls/:id/end": {
      const call = db.calls.find((c) => c.id === rid && c.user_id === user.id);
      if (!call) throw new MockError(404, "Call not found.");
      if (call.status === "ended") return call;
      const seconds = Math.min((Date.now() - Date.parse(call.started_at)) / 1000, call.max_seconds);
      call.status = "ended";
      call.ended_at = now();
      call.seconds = Math.round(seconds);
      call.transcript = (body!.transcript as Call["transcript"]) ?? [];
      call.credits = call.transcript.length ? Math.max(1, Math.ceil(seconds / 60)) : 0;
      spend(user, call.credits);
      call.summary = await summarise(call.transcript ?? []);
      return call;
    }
    case "GET calls":
      return mine(db.calls).map((c) => ({ ...c, transcript: undefined }));
    case "GET calls/:id":
      return mine(db.calls).find((c) => c.id === rid);

    case "GET schedules":
      return mine(db.schedules).filter((s) => s.status === "pending");
    case "DELETE schedules/:id":
      db.schedules = db.schedules.filter((s) => s.id !== rid);
      return undefined;
    case "GET notifications":
      return [];
    // Connectors and the morning call need the real backend (they reach outside services); the mock shows
    // the empty states so the page still renders.
    case "GET connectors":
      return [];
    case "GET briefing":
      return {
        enabled: false,
        agent_id: null,
        time: "07:00",
        repeat: "daily",
        next_at: null,
        schedule_id: null,
        prefs: { calendar: true, weather: true, news: true },
        topics: user.interests,
      };
    case "POST connectors":
    case "PUT briefing":
    case "POST briefing/preview":
      throw new MockError(503, "Connections need the real backend. Set MOCK_BACKEND=0.");
    // Phone calls go through Twilio, so the mock only shows the empty states.
    case "GET phone":
      return {
        number: null,
        verified_at: null,
        fallback: true,
        pending: null,
        available: false,
        plan_allows: planById(user.plan).id === "plus" || user.plan === "pro",
        caller_id: null,
      };
    case "GET contacts":
      return [];
    case "POST contacts":
    case "POST phone/verify":
      throw new MockError(503, "Phone calls need the real backend. Set MOCK_BACKEND=0.");
    case "POST push/subscribe":
    case "DELETE push/subscribe":
      return undefined;

    case "GET tasks":
      return mine(db.tasks);
    case "GET tasks/:id":
      return advance(mine(db.tasks).find((t) => t.id === rid));
    case "POST tasks": {
      if (!["plus", "pro"].includes(user.plan)) throw new MockError(403, "Computer tasks are included in Plus.");
      const task = newTask(user.id, body!);
      db.tasks.unshift(task);
      return task;
    }
    case "POST tasks/:id/confirm": {
      const task = mine(db.tasks).find((t) => t.id === rid)!;
      task.confirmation = null;
      task.status = body!.approve ? "running" : "cancelled";
      return task;
    }
    case "POST tasks/:id/cancel": {
      const task = mine(db.tasks).find((t) => t.id === rid)!;
      task.status = "cancelled";
      return task;
    }

    case "GET billing":
      return {
        plan: user.plan,
        plan_status: user.plan_status,
        interval: user.plan === "free" ? null : "month",
        renews_at: user.plan === "free" ? null : new Date(Date.now() + 20 * 86_400_000).toISOString(),
        cancel_at: null,
        credits: user.credits,
        ledger: [{ delta: 20, bucket: "plan", reason: "signup", created_at: user.created_at }],
      };
    case "POST billing/checkout":
    case "POST billing/portal":
    case "POST billing/cancel":
    case "POST billing/resume":
    case "POST billing/withdraw":
      throw new MockError(503, "Billing isn't set up yet");
  }
  throw new MockError(404, `Mock backend has no route for ${route}`);
}

function sync(body: Body): User {
  const existing = [...db.users.values()].find((u) => u.email === body.email);
  if (existing) return existing;
  const plan = (process.env.MOCK_PLAN as PlanId) || "free";
  const credits = planById(plan).credits;
  const user: User = {
    id: id(),
    email: String(body.email),
    name: String(body.name),
    image: (body.image as string) ?? null,
    timezone: "Europe/Berlin",
    locale: "en-GB",
    city: null,
    plan,
    plan_status: plan === "free" ? "none" : "active",
    credits: { plan: credits, topup: 0, total: credits },
    onboarded: false,
    nickname: null,
    about: null,
    interests: [],
    tone: "balanced",
    detail: "normal",
    languages: ["en"],
    style: null,
    integrations: { google_calendar: { connected: false, account_email: null, connected_at: null } },
    created_at: now(),
  };
  db.users.set(user.id, user);
  return user;
}

// The owner is stored on the row (not in a module-level map) so it survives hot reloads.
type OwnedMemory = Memory & { user_id?: string };
function remember(userId: string, m: Memory) {
  db.memories.unshift({ ...m, user_id: userId } as OwnedMemory);
}
const owns = (m: OwnedMemory, userId: string) => m.user_id === userId;
const withUser = (m: OwnedMemory) => m;

function spend(user: User, credits: number) {
  const fromPlan = Math.min(user.credits.plan, credits);
  user.credits.plan -= fromPlan;
  user.credits.topup = Math.max(0, user.credits.topup - (credits - fromPlan));
  user.credits.total = user.credits.plan + user.credits.topup;
}

function highlights(user: User): Highlights {
  const week = Date.now() - 7 * 86_400_000;
  const calls = db.calls.filter((c) => c.user_id === user.id && Date.parse(c.started_at) > week);
  const next = db.schedules
    .filter((s) => s.user_id === user.id && s.status === "pending")
    .sort((a, b) => a.when.localeCompare(b.when))[0];
  return {
    calls_this_week: calls.length,
    minutes_this_week: Math.round(calls.reduce((n, c) => n + c.seconds, 0) / 60),
    memories: db.memories.filter((m) => owns(m, user.id)).length,
    next_schedule: next ?? null,
    streak_days: calls.length ? 1 : 0,
  };
}

async function runTool(user: User, call: Db["calls"][number], name: string, args: Body) {
  const agentId = call.agent_id;
  switch (name) {
    case "remember":
      remember(user.id, { id: id(), text: String(args.fact), agent_id: agentId, source: "call", created_at: now() });
      return { ok: true, result: { saved: args.fact } };
    case "forget": {
      const word = String(args.about ?? "").toLowerCase();
      const before = db.memories.length;
      db.memories = db.memories.filter((m) => !(owns(m, user.id) && m.text.toLowerCase().includes(word)));
      return { ok: true, result: { removed: before - db.memories.length } };
    }
    case "schedule_call":
    case "set_reminder": {
      const local = String(args.when);
      const s = {
        id: id(),
        user_id: user.id,
        agent_id: agentId,
        type: name === "schedule_call" ? ("call" as const) : ("reminder" as const),
        when: new Date(local).toISOString(),
        local_when: local,
        text: String(args.purpose ?? args.text ?? ""),
        repeat: (args.repeat as Schedule["repeat"]) ?? "none",
        status: "pending" as const,
      };
      db.schedules.push(s);
      return { ok: true, result: { scheduled: s } };
    }
    case "list_upcoming":
      return {
        ok: true,
        result: { upcoming: db.schedules.filter((s) => s.user_id === user.id && s.status === "pending") },
      };
    case "get_calendar_events":
      return { ok: false, result: { connected: false, message: "Their calendar isn't connected yet." } };
    case "get_weather":
      return {
        ok: true,
        result: {
          place: args.place ?? user.city ?? "their city",
          now: "14°C, partly cloudy",
          rainLikelyAt: ["16:00", "17:00"],
        },
      };
    case "send_recap":
      return { ok: true, result: { sent: "to the Callio app" } };
    case "start_computer_task": {
      if (!["plus", "pro"].includes(user.plan))
        return { ok: false, result: { error: "Computer tasks are on the Plus plan." } };
      const task = newTask(user.id, { agent_id: agentId, goal: args.goal, constraints: args.constraints });
      db.tasks.unshift(task);
      return { ok: true, result: { task_id: task.id, status: task.status } };
    }
    default:
      return { ok: true, result: {} };
  }
}

function newTask(userId: string, body: Body): Task & { user_id: string } {
  return {
    id: id(),
    user_id: userId,
    agent_id: String(body.agent_id ?? ""),
    goal: String(body.goal ?? ""),
    constraints: (body.constraints as string) ?? null,
    status: "running",
    steps: [],
    confirmation: null,
    result: null,
    credits: 5,
    url: "https://www.google.com",
    created_at: now(),
    updated_at: now(),
  };
}

const FAKE_STEPS = [
  ["navigate", "Opened google.com"],
  ["type", "Searched for the restaurant"],
  ["click", "Opened the booking page"],
  ["click", "Picked Friday, 8pm, party of 4"],
] as const;

/** Moves a fake task forward a step each time it's polled, pausing once for confirmation. */
function advance(task?: Db["tasks"][number]) {
  if (!task || task.status !== "running") return task;
  const n = task.steps.length;
  if (n < FAKE_STEPS.length) {
    task.steps.push({ n: n + 1, action: FAKE_STEPS[n][0], detail: FAKE_STEPS[n][1], at: now() });
  } else if (!task.result && !task.confirmation && n === FAKE_STEPS.length) {
    task.status = "needs_confirmation";
    task.confirmation = { question: "Book a table for 4 on Friday at 8pm under your name?" };
    task.steps.push({ n: n + 1, action: "wait", detail: "Waiting for your OK", at: now() });
  } else {
    task.status = "done";
    task.result = "Booked: table for 4, Friday at 8pm. Confirmation sent to your email.";
  }
  task.updated_at = now();
  return task;
}

async function summarise(lines: NonNullable<Call["transcript"]>) {
  if (!lines.length) return null;
  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey() });
    const res = await ai.models.generateContent({
      model: SUMMARY_MODEL,
      contents: `Summarise this call in one short sentence: what was discussed or decided.\n\n${lines.map((l) => `${l.who}: ${l.text}`).join("\n")}`,
    });
    return res.text?.trim() ?? null;
  } catch {
    return "A short call.";
  }
}

async function parseImport(text: string) {
  const ai = new GoogleGenAI({ apiKey: geminiKey() });
  const res = await ai.models.generateContent({
    model: SUMMARY_MODEL,
    contents: `This is what another AI assistant knows about a person. Turn it into short third-person facts and a profile. Drop passwords, account, card and ID numbers. Max 60 facts.\n\n${text.slice(0, 30000)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          facts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                category: {
                  type: Type.STRING,
                  enum: ["about", "people", "work", "preferences", "routines", "goals", "other"],
                },
              },
              required: ["text", "category"],
            },
          },
          profile: {
            type: Type.OBJECT,
            properties: {
              nickname: { type: Type.STRING, nullable: true },
              about: { type: Type.STRING, nullable: true },
              style: { type: Type.STRING, nullable: true },
              tone: { type: Type.STRING, enum: ["casual", "balanced", "formal"], nullable: true },
              detail: { type: Type.STRING, enum: ["brief", "normal", "detailed"], nullable: true },
              interests: { type: Type.ARRAY, items: { type: Type.STRING } },
              languages: { type: Type.ARRAY, items: { type: Type.STRING } },
              city: { type: Type.STRING, nullable: true },
            },
          },
        },
        required: ["facts", "profile"],
      },
    },
  });
  return JSON.parse(res.text ?? '{"facts":[],"profile":{}}');
}

function pick(body: Body, keys: string[]) {
  return Object.fromEntries(Object.entries(body).filter(([k]) => keys.includes(k)));
}
