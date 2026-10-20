/** Languages people can tell their agents they speak. `label` is shown in the app, `name` goes into the prompt. */
export const LANGUAGES = [
  { code: "en", label: "English", name: "English" },
  { code: "de", label: "Deutsch", name: "German" },
  { code: "fr", label: "Français", name: "French" },
  { code: "es", label: "Español", name: "Spanish" },
  { code: "pt", label: "Português", name: "Portuguese" },
  { code: "it", label: "Italiano", name: "Italian" },
  { code: "nl", label: "Nederlands", name: "Dutch" },
  { code: "yo", label: "Yorùbá", name: "Yoruba" },
  { code: "ig", label: "Igbo", name: "Igbo" },
  { code: "ha", label: "Hausa", name: "Hausa" },
  { code: "pcm", label: "Pidgin", name: "Nigerian Pidgin" },
  { code: "ar", label: "العربية", name: "Arabic" },
] as const;

export const languageName = (code: string) => LANGUAGES.find((l) => l.code === code)?.name ?? code;
