# Copilot Instructions — ARMitect Vibe Coding

> Purpose: Build a lightweight, client-side web MVP for ARM template visualization and editing. Focus on rapid prototyping, minimal dependencies, and accessibility for all skill levels.

## Project Context

- React + TypeScript + Vite single-page scaffold
- Target audience: cloud engineers, developers, and beginners needing fast, visual ARM template editing
- Core flows: upload ARM template (JSON) → visualize as diagram; drag-and-drop resources → generate ARM template JSON; import/edit/export templates; AI-powered summary (mock or browser API)
- Use https://github.com/benc-uk/armview-vscode/tree/5f696a5befd87a14ffe7a1804fe28a3e7743a6bd for ARM template parsing and diagram generation
- Keep code small, readable, and flat. Avoid premature abstractions and heavy frameworks.

## Guardrails

- No backend; all logic runs client-side (browser)
- Minimize dependencies. If adding a library, explain why in comments
- Prefer native fetch and simple state via `useState`
- Use React + TypeScript + Vite for all UI and logic
- Only support common Azure resource types for MVP

## Build Flow (step-by-step)

1. **Confirm the MVP goal** in one sentence (e.g., "Visualize and edit ARM templates as diagrams in the browser")
2. **Sketch the UI** as simple TSX (upload form, diagram area, resource palette, export button, summary area)
3. **Wire the core interaction** (event handlers, state, parsing engine integration)
4. **Add one finishing touch** (basic validation, simple animation, or a tiny data mock)
5. **Ship** (build & preview), then suggest next steps

## Prompts to Use with Me

- "Generate the minimal TSX + state to implement that action. No extra files unless needed."
- "Integrate armview-vscode parsing engine for ARM template to diagram conversion."
- "Show how to upload a JSON file and visualize its structure."
- "Add a simple result screen summarizing the uploaded template."
- "Suggest the smallest possible accessibility improvements for this UI."
- "Write a 3–5 bullet README snippet telling someone how to run and use this MVP."

## Quality Bar

- Works locally with `npm run dev` and builds with `npm run build`
- No runtime errors in the console
- Bundle remains minimal

## Stretch (only after MVP)

- Add routing (react-router-dom) if multiple views are essential
- Add a small chart or animation _only if_ it clarifies the outcome
