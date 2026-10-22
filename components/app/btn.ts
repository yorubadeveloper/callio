// Button styles shared by server and client screens. Kept out of ui.tsx (a client module) so server
// components get the real class names rather than a client reference.

export const btn = {
  primary:
    "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-page transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50",
  call: "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-teal px-6 text-[15px] font-semibold text-[#0E0E10] shadow-[0_10px_30px_-12px_#64B2AF] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50",
  soft: "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink/[0.06] px-6 text-[15px] font-semibold text-ink transition-colors hover:bg-ink/10 disabled:pointer-events-none disabled:opacity-50",
  danger:
    "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-coral/15 px-6 text-[15px] font-semibold text-[#B0412C] transition-colors hover:bg-coral/25 dark:text-coral disabled:opacity-50",
  icon: "grid size-11 place-items-center rounded-full text-xl text-ink transition-colors hover:bg-ink/[0.06]",
};
