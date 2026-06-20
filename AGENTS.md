# Agents

This project uses the Payload CMS skill at `.agents/skills/payload/`.
Start with `.agents/skills/payload/SKILL.md` for a quick reference, then see `.agents/skills/payload/reference/` for detailed docs.

For Payload ecommerce plugin or ecommerce template work, also use `.agents/skills/payload-ecommerce/SKILL.md`.

## Coding Guidelines

Always prioritize modular, clean, and maintainable code:
* **Global Helpers**: Shared access controls and hooks must be placed in global folders (`src/access/` and `src/hooks/`).
* **Collection-Specific Helpers**: Collection-specific access controls and hooks must go in dedicated folders inside their respective collection directory (e.g., `src/collections/[CollectionName]/access/` and `src/collections/[CollectionName]/hooks/`).
* **No Inline Code**: Avoid defining logic for access controls, hooks, validators, or formatters inline inside the collection's primary configuration files (e.g., `index.ts` or `Categories.ts`). Instead, import them.
