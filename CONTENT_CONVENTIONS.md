# Sanskrit Content Convention

For every shloka added or edited in this repository, use the following order of authority:

1. **Original Sanskrit source is authoritative.**
   - Never reconstruct Devanagari from the simplified English / phonetic Roman text.
   - Verify the Sanskrit against the cited source whenever possible.

2. **Preserve the original Sanskrit source form.**
   - Store the joined/source reading in `devanagariSourceText`.
   - Store the corresponding source IAST in `iastSourceText` when available.

3. **Display Devanagari in chanting-unit grouping, not full grammatical padavichedana.**
   - Use the simplified phonetic Roman only to determine the intended chanting/display units and line grouping.
   - Do not split a Sanskrit unit more finely than the corresponding simplified-English unit.
   - Example: `DHAATARAMESHAM` → `धातारमीशं`, not `धातारम् ईशं`.
   - The Sanskrit source remains authoritative for spelling, sandhi, endings, and diacritics.
   - Keep danda punctuation attached to the preceding text.

4. **Generate/check IAST from the Sanskrit, not from simplified English.**
   - IAST should correspond to the displayed Sanskrit chanting-unit grouping.
   - Preserve diacritics: ā ī ū ṛ ṝ ḷ ṅ ñ ṭ ṭh ḍ ḍh ṇ ś ṣ ṃ ḥ, etc.

5. **Simplified English / phonetic Roman is a separate layer.**
   - Preserve the collection's established phonetic convention.
   - It may guide line grouping for readability.
   - It is never the authority for Sanskrit spelling or IAST.

6. **Line layout**
   - Prefer the same readable grouping between simplified Roman, Devanagari padavichedana, and IAST when practical.
   - Do not force Sanskrit into an incorrect split merely to make columns line up.
   - `।` and `॥` remain with the preceding text.

## Example

Original/source Sanskrit:

```
नमामि धन्वन्तरिमादिदेवं सुरासुरैर्वन्दितपादपद्मम् ।
लोके जरारुग्भयमृत्युनाशं धातारमीशं विविधौषधीनाम् ॥
```

Display chanting-unit grouping:

```
नमामि धन्वन्तरिम् आदिदेवं ।
सुरासुरैः वन्दित पादपद्मम् ॥
लोके जरा रुक् भय मृत्यु नाशं ।
धातारमीशं विविधौषधीनाम् ॥
```

IAST display:

```
namāmi dhanvantarim ādidevaṃ |
surāsuraiḥ vandita pādapadmam ||
loke jarā ruk bhaya mṛtyu nāśaṃ |
dhātāramīśaṃ vividhauṣadhīnām ||
```
