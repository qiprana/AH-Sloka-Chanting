# Admin page — first version

Open `/admin.html` from a local web server or the GitHub Pages branch preview.

This first admin version:
- loads `data/extra-shlokas.json`
- creates, edits, and deletes JSON-driven sections
- creates, edits, and deletes JSON-driven shlokas
- edits Simplified Phonetic Roman, IAST, Devanagari, meaning, source, and audio path
- previews the shloka layout
- imports/exports JSON
- suggests an audio repository path when an audio file is selected

It intentionally **does not write directly to GitHub yet**. A browser page should not contain a reusable GitHub personal access token.

## Next steps

1. Migrate existing Chapter 11, Chapter 12, Herbs, and foundational shlokas from static HTML into structured JSON so they become editable here.
2. Add an authenticated save endpoint (recommended: a small serverless backend / GitHub App flow) so Save can commit JSON and upload audio without exposing GitHub credentials.
3. Add validation: duplicate IDs, missing line pairs, audio file existence, required fields.
4. Add draft/publish behavior so edits can be reviewed before going live.
