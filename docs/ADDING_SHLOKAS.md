# Adding new shlokas

This branch starts a safe migration away from one large index.html.

## Current structure
- index.html: existing page markup/content (kept intact so nothing is lost)
- styles.css: all page styling
- app.js: search, sticky index, audio behavior, plus the new data loader
- data/extra-shlokas.json: add future shlokas here
- audio/: chanting recordings

## Add a future chapter without editing HTML

Add an object to `data/extra-shlokas.json`:

```json
{
  "id": "chapter-13",
  "title": "Chapter 13",
  "navLabel": "Chapter 13",
  "subtitle": "Ashtanga Hridayam · Sutrasthana · Chapter 13",
  "verses": [
    {
      "id": "ch13-1",
      "number": 1,
      "roman": [
        "SIMPLIFIED PHONETIC ROMAN LINE 1 |",
        "LINE 2 ||"
      ],
      "iast": [
        "IAST line 1 |",
        "IAST line 2 ||"
      ],
      "devanagari": [
        "देवनागरी पंक्ति १ ।",
        "देवनागरी पंक्ति २ ॥"
      ],
      "meaning": "Complete, easy-to-understand meaning of the full shloka.",
      "audio": "audio/chapter-13/shloka-01.mp3",
      "audioType": "audio/mpeg"
    }
  ]
}
```

Commit the JSON and audio file to GitHub. GitHub Pages will serve the update from the same website URL.

## Why this is incremental
The current collection contains many carefully edited blocks and audio mappings. This branch deliberately does not rewrite all existing shlokas into JSON in one risky change. New content can be data-driven immediately; existing sections can then be migrated chapter-by-chapter and visually compared before merge.

## Next migration step
Move Chapter 11, then Chapter 12, then Herbs into their own JSON files. After each section is verified, remove the matching static markup from index.html.
