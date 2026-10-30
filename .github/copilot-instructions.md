# Repository Instructions

## Project
- This is TypeSpeak, a bilingual Thai/English typing practice app built with Next.js 14 App Router, React 18, and TypeScript.
- The main experience is in `src/app/page.tsx`; shared UI components are in `src/components/`.
- Typing and timer behavior lives in `src/hooks/`; speech synthesis is in `src/hooks/useTts.ts`.
- Zustand state is split between `src/store/useTypingStore.ts` and `src/store/useSettingsStore.ts`.
- Thai and English typing content is maintained separately in `src/data/`.

## Conventions
- Use TypeScript and preserve the strict settings in `tsconfig.json`.
- Use the `@/*` alias for imports from `src/`.
- Follow the existing Tailwind utility-class and CSS-variable theme conventions in `src/app/globals.css`.
- Keep client-side interactivity in client components and hooks; avoid adding client boundaries where they are not needed.
- Keep language-specific content in the corresponding data files, and preserve both Thai and English behavior when changing shared typing features.
- Use the existing `lucide-react` icon library for interface icons.

## Validation
- `npm run lint` runs the Next.js lint command.
- `npm run build` runs the production build and TypeScript checks.
- There is no test script configured in `package.json`.