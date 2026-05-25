# Wireframe Design

_Started 2026-05-21 09:35 UTC_

---

## User

create a wireframe based on this doc

## Assistant

_[tool: list_files]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: questions_v2]_

## User

Questions answered:
- screens: SAP Import (Finance — upload, WBS mapping queue), Resource & Labour Forecasting (headcount grid), EAC Editor / Time-phased view (past actuals vs future forecast), Portfolio Dashboard (all projects table, filters), Project Dashboard (single project — EAC, budget, variance, trend), Login / Nav shell
- variations: 3 — explore the space
- variation_axes: Sidebar vs top nav, Chart-forward vs number-forward, Explore a few options
- persona: All equally
- fidelity: 2
- include_flow: Yes — multiple flows (PM monthly, Finance import, PD review)
- tweaks: Toggle between variations side-by-side / focused view, Show/hide annotations, Switch role POV (PM / PD / Finance)

## Assistant

_[tool: update_todos]_

I have what I need. Plan:
- 6 screens × 3 variations (sidebar/top-nav, number-/chart-forward, hybrid)
- 3 flow storyboards (PM monthly, Finance import, PD review)
- Hand-sketched, b&w with hints of color
- Tweaks: annotations toggle, POV switcher, plus the canvas's built-in focus mode for side-by-side ↔ focused

_[tool: copy_starter_component]_

_[tool: copy_starter_component]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: write_file]_

Now I'll build the structure. Let me create the main HTML, sketch styles, and split screens into files.

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: show_html]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: grep]_

_[tool: run_script]_

_[tool: grep]_

_[tool: run_script]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: grep]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: run_script]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: run_script]_

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: run_script]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: sleep]_

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Done — wireframes are up.

**What's in `PFMS Wireframes.html`:**
- **6 screens × 3 variations**: Login/Shell, Portfolio Dashboard, Project Dashboard, EAC Editor, Resource Forecasting, SAP Import — each in sidebar/topnav/hybrid flavours, mixing number-forward and chart-forward treatments.
- **3 end-to-end flow storyboards**: PM monthly update (5 frames), Finance SAP import, PD review-and-flag.
- Hand-sketched look, B&W with subtle status colors.
- Yellow post-it annotations on every screen calling out the key design intent.

**Tweaks (toolbar → Tweaks):**
- Show/hide annotations
- Role POV (All / PM / PD / Fin) — fades screens not used by that role

**Other navigation:**
- ⤢ on any artboard opens it fullscreen; ←/→ to flip between variations in a section, ↑/↓ jumps sections.
- Drag the grip to reorder; ⋯ to delete or export PNG.

**Notable design moves** (worth a look):
- EAC editor B — drag the future points on the cumulative curve to re-forecast.
- Portfolio C — grouped-by-status so red/amber bubble to the top.
- Resource C — master/detail with big tap-target cells instead of a wide grid.
- SAP B — split list/detail with suggestion confidence scores.

Open the focus mode on a variation you want to develop further and tell me where to take it.

