# Contributing

Thank you for contributing to this project.

## Ground Rules

- Be respectful in all interactions. See [Code of Conduct](./CODE_OF_CONDUCT.md).
- Keep changes focused and reviewable.
- Prefer small pull requests over very large ones.
- Do not commit secrets or personal data.

## Local Setup

1. Use Node.js `18.x` (see `.node-version`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build:
   ```bash
   npm run build
   ```
4. Run locally:
   ```bash
   npm run serve
   ```

## Types of Contributions

- Content updates in `articles/` (new articles, fixes, metadata cleanup).
- Site/code updates in templates, CSS, JS, and build scripts.
- Documentation and process improvements.

## Content Contribution Notes

- Follow the article frontmatter format documented in `README.md`.
- Keep `title`, `description`, `date`, `category`, and `tags` accurate.
- Preserve transcript structure and speaker labels.

## Code Contribution Notes

- Keep source and minified assets in sync when relevant:
  - `styles.css` -> `styles.min.css`
  - `script.js` -> `script.min.js`
- If you change build behavior, update docs in `README.md`.

## Branches and Commits

- Create a branch from `main`.
- Use clear commit messages that explain intent.
- Group related changes together; avoid unrelated edits in one PR.

## Pull Request Checklist

- [ ] Change is scoped and explained.
- [ ] Local build succeeds (`npm run build`).
- [ ] Local site smoke-check done (`npm run serve`).
- [ ] Docs updated if behavior/workflow changed.
- [ ] Screenshots included for UI/content-visible changes (if applicable).

## Reporting Issues

- Use the GitHub issue templates for bugs and feature requests.
- Include reproducible steps, expected behavior, and actual behavior.
