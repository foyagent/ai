# Drift audit

Run this audit mentally before outputting the prompt.

## Goal

Catch the most common failure modes:
- the model produces a glamour beauty portrait
- the model produces a toy or mascot-like icon
- the model produces a low-poly clay character
- the model adds watermark, ai labels, logos, or text overlays

## Audit questions

1. **Family test**
   - Does the prompt explicitly say the result matches the same six-reference family?
   - If not, add that statement.

2. **Age-language test**
   - Does the prompt signal youthful young-adult face language rather than child, baby, or toy language?
   - If not, add "young-adult" or equivalent wording.

3. **Eye test**
   - Are the eyes described as enlarged but still natural-looking, with visible lids and readable irises when visible?
   - If not, add that.
   - If the wording suggests button eyes, empty black circles, or mascot simplicity, revise it.

4. **Proportion test**
   - Does the prompt specify a high shoulder crop, restrained shoulders, and short-to-moderate neck?
   - If not, add them.
   - If the wording suggests bobblehead or toy figurine, soften it.

5. **Hair test**
   - Is the hair described as soft sculpted clumps or layered masses?
   - If the wording sounds silky and realistic, rewrite it.
   - If the wording sounds blocky, hard-edged, helmet-like, or low-poly, rewrite it.

6. **View-angle test**
   - Does the prompt default to a slight 3/4 view?
   - If not, add it unless the user explicitly wants a front view.

7. **Background test**
   - Does the prompt lock the output to one clean solid pastel full-frame background with no environment?
   - Does it avoid describing a circular disc that was only caused by platform cropping in screenshots?
   - If not, add it.

8. **Lighting test**
   - Does the prompt request soft even low-contrast portrait lighting and forbid dramatic shadows?
   - If not, add it.

9. **Toy/glamour exclusion test**
   - Does the prompt explicitly say not toy-like, not chibi, not low-poly, and not glamorous?
   - If not, add those exclusions in either the main prompt or negative prompt.

10. **Negative prompt test**
   - Does the negative prompt explicitly block beauty render, fashion editorial, realistic hair strands, long neck, broad shoulders, toy figurine, vinyl doll, mascot, chibi, low poly, clay render, black button eyes, watermark, ai badge, logo, signature, and text overlay?
   - If not, add them.

11. **Clean-frame test**
   - Does the prompt clearly ask for a clean outward-facing final image with no watermark, no ai-generated label, no logo, no signature, and no UI chrome?
   - If not, add that constraint.

## Pass condition

Only answer after the prompt would clearly generate something closer to the six-reference social-profile avatar family than to a beauty render, a corporate icon, or a toy mascot, and would likely produce a clean watermark-free outward-facing image.
