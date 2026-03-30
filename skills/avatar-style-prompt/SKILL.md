---
name: avatar-style-prompt
description: generate detailed, model-agnostic prompts for youthful stylized 3d social-profile avatar portraits that match a fixed six-reference family. use when a user gives a character or person description and wants a consistent outward-facing avatar prompt with coordinated face design, hair treatment, framing, lighting, solid pastel background, subtle personality accents, adaptive hair color and hairstyle selection, and anti-drift constraints.
---

# Avatar Style Prompt

Generate prompts that stay inside the bundled six-reference house style while preserving character individuality.

## Workflow

1. Extract only identity-bearing traits from the user description:
   - age impression
   - gender presentation if stated
   - personality or vibe words
   - hairstyle and hair color if stated
   - skin tone if stated
   - expression or mood
   - eyewear
   - one clothing cue
   - one standout accessory or style accent
2. Load the fixed style constraints from [references/style-dna.md](references/style-dna.md).
3. Use [references/hair-guidance.md](references/hair-guidance.md) whenever hair color or hairstyle is missing, generic, or under-specified.
4. If the image system supports image references, treat [assets/reference-sheet.jpeg](assets/reference-sheet.jpeg) as the primary visual anchor and tell the user to attach it when possible.
5. Build the prompt using [references/prompt-blueprint.md](references/prompt-blueprint.md).
6. Run the drift audit from [references/drift-audit.md](references/drift-audit.md).
7. Output the final prompt only after the drift audit passes.

## Core instruction

Do not describe a generic beautiful 3d character, a toy figurine, or a cute app mascot. Describe a member of the same youthful social-profile avatar family as the six references.

Keep the prompt in the middle band between these failures:
- not a glamour beauty render
- not a toy or vinyl figurine
- not a low-poly clay mascot
- not an anime chibi icon
- not a sterile corporate contact-card avatar

## Non-negotiable style rules

Always preserve these traits unless the user explicitly asks to abandon style consistency:

- stylized 3d social-profile avatar portrait
- young-adult face language, not child or toddler language
- head-prominent framing with high shoulder crop
- eyes slightly enlarged but still natural-looking, with visible lids and irises when not covered
- tiny but sculpted nose, small mouth
- smooth youthful face with gentle planes
- short-to-moderate neck and restrained shoulders
- graphic hair masses with soft sculpted clumps, not realistic strands and not blocky low-poly slabs
- clean solid pastel full-frame background and no scene
- no watermark, ai-generated badge, logo, signature, text overlay, or platform ui chrome
- soft low-contrast portrait lighting
- minimal clothing detail and one or two readable accessories or personality accents
- polished clean 3d character finish, not collectible toy plastic and not luxury beauty-shot finish

## Character conversion rules

- Preserve identity cues, but compress styling. Keep one garment cue and one primary accessory.
- If the user gives many props, discard all but the clearest one or two.
- If the user gives a scene, remove the scene and keep only the avatar portrait.
- If the user gives a full-body request, still default to compact bust portrait unless they clearly insist otherwise.
- If the user gives realism cues, stylize them into this avatar language. Do not copy pores, wrinkles, fashion-photo anatomy, realistic strands, or cinematic lighting.
- If the user gives sunglasses, keep the eyewear as a bold graphic shape. Do not describe huge visible eyes through opaque lenses.
- If the user gives no expression, default to calm confidence or mild friendly coolness.
- If the user gives no clothing, default to a simple top or light jacket silhouette that does not compete with the face.
- If the user gives no accessory, infer one subtle personality accent when it fits the subject and does not crowd the portrait. Good defaults include small hoop or stud earrings, a simple chain, a neat cap, a slim hair clip, a subtle earbud, a clean lapel pin, or lightly tinted glasses.
- Keep inferred accents tasteful and limited. Prefer one strong accent or two very small accents. Never let accessories become costume props.
- If hair color is unspecified, infer it from the character's energy, role, and overall mood instead of defaulting to black. Use [references/hair-guidance.md](references/hair-guidance.md).
- If hairstyle is unspecified, infer a hairstyle that supports the subject's personality and presentation instead of repeating one default cut. Use [references/hair-guidance.md](references/hair-guidance.md).
- Keep inferred hair colors inside a believable stylized range unless the user explicitly asks for fantasy colors.
- Because these avatars are outward-facing, always suppress any watermark, ai-generation label, logo, signature, text, or platform overlay.
- Prefer slight 3/4 view. Avoid dead-center front-facing symmetry unless the user explicitly asks for it.

## Important anti-drift rules

Avoid wording that pushes models toward generic beauty renders or toy mascots.

Avoid or minimize these trigger words unless the user explicitly asks for them:
- premium
- luxury
- glamorous
- cinematic
- editorial
- collectible
- toy-like
- icon mascot
- chibi
- kawaii
- clay
- low poly

Prefer structural wording such as:
- youthful stylized 3d avatar portrait
- social-profile avatar family
- head prominent in frame
- shoulders cropped high
- visible eyelids and irises
- simplified facial planes
- sculpted soft hair clumps
- minimal outfit detail
- subtle personality accent
- mood-matched hair color and hairstyle
- clean solid pastel full-frame background
- polished character render

## Output rules

Unless the user asks for another format, return these sections in this order:

### 1. universal prompt
Write one rich English prompt paragraph for broad cross-model compatibility.

### 2. negative prompt
Write one compact English negative prompt line.

### 3. style lock
Write 8-12 short bullets capturing the non-negotiable consistency rules.

### 4. anti-drift suffix
Write one short English suffix line that can be appended verbatim when a weak model drifts toward toy, chibi, glamour, or repetitive default hair.

### 5. chinese gloss
If the user wrote in Chinese, add a concise Chinese explanation of the intended look.

## Mandatory self-check before answering

Quietly verify all of the following:

- Does this sound like an avatar from the same set, not a random beauty render, toy, or mascot?
- Are the face proportions youthful and stylized without becoming childlike or bobblehead?
- Are the eyes described as enlarged but still natural, not black button dots?
- Is the hair described as soft sculpted clumps rather than realistic strands or hard low-poly blocks?
- Is the outfit simplified enough that the face remains dominant?
- Is there one tasteful accessory or personality accent when the subject would otherwise feel too plain?
- If hair was under-specified, does the chosen hair color support the character mood instead of defaulting to black?
- If hairstyle was under-specified, does the chosen hairstyle support the character vibe instead of repeating the same generic male cut?
- Does the prompt avoid scene detail and glamour language?
- Does the negative prompt explicitly block realism, editorial fashion, toy/chibi drift, clay drift, low-poly drift, watermark or text-overlay artifacts, and repeated default-hair drift?

If any answer is no, revise before output.
