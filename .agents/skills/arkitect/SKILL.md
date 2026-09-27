---
name: arkitect
description: Draw editable Draw.io (.drawio) and Excalidraw (.excalidraw) architecture, system, component, and flow diagrams, or edit an existing diagram with Arkitect. Use whenever the user asks for architecture diagrams, system designs, cloud architectures, data pipelines, Draw.io diagrams, Excalidraw diagrams, or mentions Arkitect.
---

# Arkitect — Editable Architecture Diagrams

Arkitect generates native, editable diagrams in two engines:
- **Draw.io** (`.drawio`): For formal solution architecture, cloud architectures (AWS/Azure/GCP), client-facing diagrams, and multi-page specs.
- **Excalidraw** (`.excalidraw`): For system designs, block diagrams, sketch-style architectures, and README graphics.

Never hand over a static image screenshot or Mermaid as the final artifact when a real architecture diagram is requested.

---

## Quick Reference CLI Commands

The `arkitect` CLI is globally installed:

```bash
# Draw.io workflows
arkitect drawio icon "<query>"                      # Search bundled icon packs
arkitect drawio build spec.json --out arch.drawio   # Build .drawio diagram
arkitect drawio validate arch.drawio                # Validate structure and layout
arkitect drawio render arch.drawio --out-dir renders # Export PNG locally (requires Draw.io Desktop)
arkitect drawio analyze arch.drawio                 # Inspect structure without reading full XML
arkitect drawio backup arch.drawio                  # Backup before editing

# Excalidraw workflows
arkitect excalidraw icon "<query>"                  # Search Excalidraw libraries & packs
arkitect excalidraw build spec.json --out arch.excalidraw  # Build .excalidraw scene
arkitect excalidraw validate arch.excalidraw         # Validate scene
arkitect excalidraw render arch.excalidraw          # Export to SVG/PNG
arkitect excalidraw backup arch.excalidraw          # Backup before editing
```

---

## Specialized Engine Guides

When executing a diagram request, follow the detailed workflows in the engine skills:

- **Draw.io Guide**: [arkitect-drawio/SKILL.md](file:///C:/Users/Abhijeet%20Yadav/.gemini/config/skills/arkitect-drawio/SKILL.md)
- **Excalidraw Guide**: [arkitect-excalidraw/SKILL.md](file:///C:/Users/Abhijeet%20Yadav/.gemini/config/skills/arkitect-excalidraw/SKILL.md)

### Additional Specialized Skills:
- `learn-drawio-style` / `apply-drawio-style`: Custom style learning & application for Draw.io
- `learn-excalidraw-style` / `apply-excalidraw-style`: Custom style learning & application for Excalidraw

---

## Core Rules

1. **Resolve icons first**: Over 6,000 bundled icons across AWS, Azure, GCP, data platforms, databases, AI/ML frameworks, DevOps, and more. Never guess or swap another brand's logo. If an icon is missing, use a named labelled box honestly.
2. **Build from spec**: Always create a clean JSON spec and build with `arkitect <engine> build <spec.json> --out <file>`.
3. **Validate**: Always run `arkitect <engine> validate <file>` to catch layout collisions, broken edges, or missing references.
4. **Backup before edit**: If modifying an existing diagram, always run `arkitect <engine> backup <file>` first.
