---
name: avatar-style-prompt
description: generate detailed, model-agnostic image prompts for chest-up avatar portraits that match a fixed six-reference visual style. use when a user provides a character or person description and wants a prompt that stays in the same youthful stylized 3d social-profile avatar family as the bundled references, with matched face design, hair treatment, framing, lighting, clean background treatment, and anti-drift constraints across different image agents.
---

# Avatar Style Prompt

Generate avatar prompts that stay inside the bundled six-reference house style.

The user gives you a person description. Preserve only the subject identity cues while keeping the result visually compatible with the same reference set.

## Workflow

1. Extract only identity-bearing traits from the user description:
   - age impression
   - gender presentation if stated
   - hairstyle and hair color
   - skin tone
   - expression or mood
   - eyewear
   - one clothing cue
   - one standout accessory
2. Load the fixed style constraints from [references/style-dna.md](references/style-dna.md).
3. If the target image system supports image references, treat [assets/reference-sheet.jpeg](assets/reference-sheet.jpeg) as the primary visual anchor and tell the user to attach it when possible.
4. Build the prompt using [references/prompt-blueprint.md](references/prompt-blueprint.md).
5. Run the drift audit from [references/drift-audit.md](references/drift-audit.md).
6. Output the final prompt only after the drift audit passes.

## Core instruction

Do not describe a generic beautiful 3d character, a toy figurine, or a cute app mascot. Describe a member of the same youthful social-profile avatar family as the six references.

Target the middle band between these failure modes:
- not a glamour beauty render
- not a toy or vinyl figurine
- not a low-poly clay mascot
- not an anime chibi icon

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
- clean solid pastel full-frame backdrop and no scene
- no watermark, ai-generated badge, logo, signature, text overlay, or platform ui chrome
- soft low-contrast portrait lighting
- minimal clothing detail and at most one or two readable accessories
- polished clean 3d character finish, not collectible toy plastic and not luxury beauty-shot finish

## Character conversion rules

Convert the user description into this house style.

- Preserve identity cues, but compress styling. Keep one garment cue and one primary accessory.
- If the user gives many props, discard all but the clearest one or two.
- If the user gives a scene, remove the scene and keep only the avatar portrait.
- If the user gives a full-body request, still default to compact bust portrait unless they clearly insist otherwise.
- If the user gives realism cues, stylize them into this avatar language. Do not copy pores, wrinkles, fashion-photo anatomy, realistic strands, or cinematic lighting.
- If the user gives sunglasses, keep the eyewear as a bold graphic shape. Do not describe huge visible eyes through opaque lenses.
- If the user gives no expression, default to calm confidence or mild friendly coolness.
- If the user gives no clothing, default to a simple top or light jacket silhouette that does not compete with the face.
- Because these avatars are outward-facing, always suppress any watermark, ai-generation label, logo, signature, text, or platform overlay.
- Prefer slight 3/4 view. Avoid dead-center front-facing symmetry unless the user explicitly asks for it.


## Visual-reference rule

If the target agent can accept a reference image, prefer using the bundled contact sheet in `assets/reference-sheet.jpeg` as a visual anchor. In that case:
- keep the same prompt format
- mention that the reference image defines the house style
- do not restate every style cue if the prompt becomes too long
- still keep the anti-drift exclusions for glamour, toy, chibi, and low-poly outcomes

If the target agent is text-only, rely on the structural wording and anti-drift suffix.

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
Write one short English suffix line that can be appended verbatim when a weak model drifts toward toy, chibi, or glamour results.

### 5. chinese gloss
If the user wrote in Chinese, add a concise Chinese explanation of the intended look.

## Mandatory self-check before answering

Quietly verify all of the following:

- Does this sound like an avatar from the same set, not a random beauty render, toy, or mascot?
- Are the face proportions youthful and stylized without becoming childlike or bobblehead?
- Are the eyes described as enlarged but still natural, not black button dots?
- Is the hair described as soft sculpted clumps rather than realistic strands or hard low-poly blocks?
- Is the outfit simplified enough that the face and accessory remain dominant?
- Does the prompt avoid scene detail and glamour language?
- Does the negative prompt explicitly block realism, editorial fashion, toy/chibi drift, clay drift, low-poly drift, and watermark or text-overlay artifacts?

If any answer is no, revise before output.

## Refusal to drift

If the user asks for a very different art direction, you may still help, but clearly state that the output below is optimized for the fixed reference style and will keep the bundled house look unless they ask to abandon consistency.
