import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { LOGO_BLOBS } from "@/components/brand/logo-paths";
import { AgentFace } from "@/components/landing/agent-face";
import { AGENTS } from "@/components/landing/agents";

export const alt = "Callio: personal AI agents that call you, pick up when you call, and get things done.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (file: string) => readFile(join(process.cwd(), "node_modules/@fontsource", file));

// The OG renderer only understands plain elements inside an <svg>, so expand
// function components (like the face's hair) into what they render.
function expand(node: ReactNode): ReactNode {
  if (!isValidElement(node)) return node;
  const el = node as ReactElement<{ children?: ReactNode }>;
  if (typeof el.type === "function") return expand((el.type as (p: object) => ReactNode)(el.props));
  const { children } = el.props;
  return children === undefined ? el : cloneElement(el, {}, ...Children.toArray(children).map(expand));
}

const face = (name: string, px: number) => expand(<AgentFace agent={AGENTS.find((a) => a.name === name)!} size={px} />);

// Faces on an arc over the top of the dial, like the landing page.
const CENTER = { x: 280, y: 330 };
const ARC = ["Kemi", "Maya", "Laura", "Theo", "Ada"].map((name, i, all) => {
  const angle = (-72 + (144 / (all.length - 1)) * i) * (Math.PI / 180);
  return { name, x: CENTER.x + Math.sin(angle) * 168, y: CENTER.y - Math.cos(angle) * 168 };
});

export default async function OpengraphImage() {
  const [display, body] = await Promise.all([
    font("instrument-sans/files/instrument-sans-latin-500-normal.woff"),
    font("hanken-grotesk/files/hanken-grotesk-latin-400-normal.woff"),
  ]);

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#F3F2EE", fontFamily: "Hanken" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 0 60px 72px",
          width: 640,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <svg viewBox="0 0 100 100" width={44} height={44}>
            {LOGO_BLOBS.map((b) => (
              <path key={b.name} d={b.d} fill={b.fill} />
            ))}
          </svg>
          <span style={{ fontFamily: "Instrument", fontSize: 34, color: "#121212", letterSpacing: -0.8 }}>Callio</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontFamily: "Instrument",
              fontSize: 76,
              lineHeight: 1.02,
              letterSpacing: -3.2,
              maxWidth: 560,
              color: "#121212",
            }}
          >
            Agents that pick up the phone.
          </span>
          <span style={{ marginTop: 26, fontSize: 28, lineHeight: 1.35, color: "#5E5C57", maxWidth: 520 }}>
            They call you, answer when you call, remember what matters and get things done.
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              display: "flex",
              background: "#121212",
              color: "#F3F2EE",
              borderRadius: 999,
              padding: "12px 26px",
              fontSize: 24,
            }}
          >
            Start free
          </span>
          <span style={{ fontSize: 24, color: "#5E5C57" }}>callio.site</span>
        </div>
      </div>

      <div style={{ display: "flex", position: "relative", flex: 1, alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "absolute",
            left: CENTER.x - 245,
            top: CENTER.y - 245,
            width: 490,
            height: 490,
            borderRadius: 999,
            background: "#FFFFFF",
            boxShadow: "0 30px 80px -30px rgba(18,18,18,0.3)",
          }}
        />
        {ARC.map(({ name, x, y }) => (
          <div
            key={name}
            style={{
              display: "flex",
              position: "absolute",
              left: x - 52,
              top: y - 52,
              width: 104,
              height: 104,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            {face(name, 104)}
          </div>
        ))}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            position: "absolute",
            top: CENTER.y + 70,
            background: "#121212",
            color: "#F3F2EE",
            borderRadius: 999,
            padding: "10px 24px 10px 10px",
            fontSize: 24,
          }}
        >
          <div style={{ display: "flex", width: 52, height: 52, borderRadius: 999, overflow: "hidden" }}>
            {face("Laura", 52)}
          </div>
          <span style={{ display: "flex" }}>
            <span style={{ fontWeight: 600 }}>Laura</span>
            <span style={{ color: "rgba(243,242,238,0.6)" }}>&nbsp;is calling…</span>
          </span>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Instrument", data: display, weight: 500, style: "normal" },
        { name: "Hanken", data: body, weight: 400, style: "normal" },
      ],
    },
  );
}
