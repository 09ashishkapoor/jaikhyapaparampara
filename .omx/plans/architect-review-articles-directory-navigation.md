# Architect Review — articles-directory-navigation

## Verdict
sound-with-revisions

## Strongest steelman antithesis
The purest self-directed experience would expose existing tags/categories more clearly instead of adding a derived grouping layer that could introduce interpretation bias.

## Real tradeoff tension(s)
- Neutrality vs legibility: raw metadata is more literal, but current taxonomy noise makes it weak as the primary IA.
- Minimal change vs usability gain: keeping chronology is cheaper, but it preserves the core overwhelm problem.

## Principle violations or architectural risks
- A chronological fallback would quietly violate the no-date-grouping instruction.
- Group cards that jump straight to selected articles would become editorial curation.
- Inline-only grouping logic in `articles/index.njk` would be brittle and hard to verify.

## Recommended revisions (concrete)
- Create deterministic build-time browse-group derivation in code/data, not ad hoc template logic.
- Make the exhaustive fallback browse path non-date-based.
- Route group entry points to browse states or grouped lists, not hand-picked articles.
- Keep the core IA server-rendered and use JS only as enhancement.

## Synthesis / final architect recommendation
Proceed with the directory-first approach, but anchor it in deterministic normalization rules and a neutral non-date fallback so the design stays both usable and principled.
