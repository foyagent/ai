# Drift audit

Run this audit mentally before outputting the prompt.

## Goal

Catch the most common failure modes:
- the model produces a glamour beauty portrait
- the model produces a toy or mascot-like icon
- the model produces a low-poly clay character
- the model produces an overly plain corporate contact-card avatar with no personality accent
- the model adds watermark, ai labels, logos, or text overlays
- the model defaults to black hair or the same generic male haircut when hair was under-specified

## Audit questions

1. Does the prompt explicitly say the result matches the same six-reference family?
2. Does the prompt signal youthful young-adult face language rather than child, baby, or toy language?
3. Are the eyes described as enlarged but still natural-looking, with visible lids and readable irises when visible?
4. Does the prompt specify a high shoulder crop, restrained shoulders, and short-to-moderate neck?
5. Is the hair described as soft sculpted clumps or layered masses rather than silky realism or hard low-poly blocks?
6. If hair color was under-specified, did you choose a color that supports the character mood rather than silently defaulting to black?
7. If hairstyle was under-specified, did you choose a hairstyle that supports the character vibe rather than repeating the same generic male haircut?
8. Does the prompt preserve a clearly stated accessory or add one subtle personality accent when the avatar would otherwise feel too plain?
9. Does the prompt lock the output to one clean solid pastel full-frame background with no environment and no gradient?
10. Does the prompt request soft even low-contrast portrait lighting and forbid dramatic shadows?
11. Does the prompt explicitly say not toy-like, not chibi, not low-poly, and not glamorous?
12. Does the negative prompt explicitly block beauty render, fashion editorial, realistic hair strands, black-button-eye drift, repeated black-hair default, generic same male haircut, watermark, ai badge, logo, signature, and text overlay?

## Pass condition

Only answer after the prompt would clearly generate something closer to the six-reference social-profile avatar family than to a beauty render, a corporate icon, or a toy mascot, while still preserving one tasteful styling accent, hair that supports the subject mood, and a clean watermark-free outward-facing image.
