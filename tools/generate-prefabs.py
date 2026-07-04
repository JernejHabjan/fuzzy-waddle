#!/usr/bin/env python3
"""
generate-prefabs.py

This script does four things in order:

1. Creates `initStaticActor` helper in a new TypeScript file
   (apps/.../game/data/init-static-actor.ts) so verbose inline
   setActorData + ObjectDescriptorComponent calls have a clean wrapper.

2. Refactors every existing outside prefab .ts file that uses the
   simple pattern (setActorData + ObjectDescriptorComponent + optional
   ColliderComponent) to call initStaticActor instead.

3. Generates .ts + .scene prefab pairs from crops.json.
   - Each crop type → one Image prefab using the lowest-numbered stage.
   - Multi-stage crops get a TODO comment listing the remaining stages.

4. Generates .ts + .scene prefab pairs from environment.json.
   - Multi-frame items (trees / animated objects) → Sprite + TODO.
   - Single-frame items → Image.
   - Items inside "goblin/tall tiles/" → Image + ColliderComponent (tiles).

Run from the repository root:
    python tools/generate-prefabs.py
"""

import collections
import json
import os
import re
import uuid
from pathlib import Path

# ─── Paths ────────────────────────────────────────────────────────────────────

REPO_ROOT        = Path(__file__).resolve().parent.parent
GAME_ROOT        = REPO_ROOT / "apps" / "client" / "src" / "app" / "probable-waffle" / "game"
PREFABS_ROOT     = GAME_ROOT / "prefabs"
DATA_DIR         = GAME_ROOT / "data"

CROPS_JSON       = REPO_ROOT / "apps" / "client" / "src" / "assets" / "probable-waffle" / "atlas" / "crops.json"
ENV_JSON         = REPO_ROOT / "apps" / "client" / "src" / "assets" / "probable-waffle" / "atlas" / "environment.json"

CROPS_PREFABS_DIR = PREFABS_ROOT / "outside" / "crops"
ENV_PREFABS_DIR   = PREFABS_ROOT / "outside" / "environment"

INIT_STATIC_ACTOR_FILE    = DATA_DIR / "init-static-actor.ts"
RANDOM_SPRITE_COMPONENT_FILE = GAME_ROOT / "entity" / "components" / "random-sprite-component.ts"

# Default isometric-diamond polygon used for all generated prefabs
DEFAULT_ISO_POLYGON = "0 16 32 0 64 16 64 48 32 64 0 48"


# ─── Part 1 – initStaticActor helper ─────────────────────────────────────────

INIT_STATIC_ACTOR_CONTENT = """\
import { setActorData } from "./actor-data";
import { ColliderComponent } from "../entity/components/movement/collider-component";
import { ObjectDescriptorComponent } from "../entity/components/object-descriptor-component";
import type { ObjectDescriptorDefinition } from "../entity/components/object-descriptor-definition";
import GameObject = Phaser.GameObjects.GameObject;

/**
 * Initialises a simple static actor with an ObjectDescriptorComponent
 * and an optional ColliderComponent.
 *
 * Replaces the verbose inline setActorData + ObjectDescriptorComponent
 * pattern that was duplicated across many prefab files.
 */
export function initStaticActor(gameObject: GameObject, color: number | null, withCollider = false): void {
  const components: unknown[] = [
    new ObjectDescriptorComponent({ color } satisfies ObjectDescriptorDefinition)
  ];
  if (withCollider) {
    components.push(new ColliderComponent(gameObject));
  }
  setActorData(gameObject, components as any[], []);
}
"""


def create_init_static_actor() -> None:
    INIT_STATIC_ACTOR_FILE.write_text(INIT_STATIC_ACTOR_CONTENT, encoding="utf-8")
    print(f"  [CREATE] {INIT_STATIC_ACTOR_FILE.relative_to(REPO_ROOT)}")


# ─── Part 2 – Refactor existing prefab files ─────────────────────────────────

# Matches the simple setActorData block with only ObjectDescriptorComponent
# and an optional ColliderComponent. Nothing else may be inside the array.
_SETACTOR_RE = re.compile(
    r"setActorData\(\s*this,\s*\[\s*"
    r"new ObjectDescriptorComponent\(\{\s*color:\s*([^\n}]+?)\s*\}"
    r"\s*satisfies\s*ObjectDescriptorDefinition\)"
    r"(\s*,\s*new ColliderComponent\(this\))?"
    r"\s*\],\s*\[\]\s*\)\s*;",
    re.DOTALL,
)

_IMPORTS_RE = re.compile(
    r"(/\* START-USER-IMPORTS \*/)(\n)(.*?)(\n)(/\* END-USER-IMPORTS \*/)",
    re.DOTALL,
)

_CTR_RE = re.compile(
    r"(/\* START-USER-CTR-CODE \*/)(\n)(.*?)(\n)(\s*/\* END-USER-CTR-CODE \*/)",
    re.DOTALL,
)

# Imports that belong to the pattern we are removing
_REMOVED_IMPORT_FRAGMENTS = (
    "setActorData",
    "ObjectDescriptorComponent",
    "ObjectDescriptorDefinition",
    "ColliderComponent",
)


def _rel_import(from_file: Path, to_file: Path) -> str:
    """Return a TypeScript-style relative import path (no .ts extension)."""
    rel = os.path.relpath(to_file.with_suffix(""), from_file.parent)
    rel = rel.replace("\\", "/")
    if not rel.startswith("."):
        rel = "./" + rel
    return rel


def refactor_file(ts_file: Path) -> None:
    content = ts_file.read_text(encoding="utf-8")

    # Only handle files that contain the exact simple pattern
    m = _SETACTOR_RE.search(content)
    if not m:
        return

    color_str      = m.group(1).strip()
    has_collider   = m.group(2) is not None

    # Bail out if the CTR block contains other component constructors
    ctr_match = _CTR_RE.search(content)
    if not ctr_match:
        return
    ctr_body = ctr_match.group(3)
    other = [
        c for c in re.findall(r"new (\w+Component)\(", ctr_body)
        if c not in {"ObjectDescriptorComponent", "ColliderComponent"}
    ]
    if other:
        print(f"  [SKIP]   {ts_file.name} – extra components: {other}")
        return

    rel = _rel_import(ts_file, INIT_STATIC_ACTOR_FILE)

    # Rebuild imports block: strip removed lines, prepend new import
    imp_match = _IMPORTS_RE.search(content)
    if not imp_match:
        return
    kept_lines = [
        line for line in imp_match.group(3).splitlines()
        if not any(frag in line for frag in _REMOVED_IMPORT_FRAGMENTS)
    ]
    new_imports = f'import {{ initStaticActor }} from "{rel}";'
    if kept_lines:
        new_imports = new_imports + "\n" + "\n".join(kept_lines)

    # Build the one-liner replacement (leading whitespace comes from surrounding text)
    if has_collider:
        new_call = f"initStaticActor(this, {color_str}, true);"
    else:
        new_call = f"initStaticActor(this, {color_str});"

    # Apply substitutions
    def replace_imports(mo: re.Match) -> str:
        return mo.group(1) + mo.group(2) + new_imports + mo.group(4) + mo.group(5)

    content = _IMPORTS_RE.sub(replace_imports, content)
    # Replace only the setActorData call; any other code in the CTR block is preserved
    content = _SETACTOR_RE.sub(new_call, content)

    ts_file.write_text(content, encoding="utf-8")
    print(f"  [REFACTOR] {ts_file.relative_to(REPO_ROOT)}")


def refactor_all_prefab_files() -> None:
    for ts_file in sorted(PREFABS_ROOT.rglob("*.ts")):
        # Skip component / definition helper files
        lower = ts_file.name.lower()
        if "component" in lower or "definition" in lower or "sfx-" in lower:
            continue
        refactor_file(ts_file)


# ─── Shared prefab-file generation ───────────────────────────────────────────

_SCENE_TMPL = """\
{{
    "id": "{scene_id}",
    "sceneType": "PREFAB",
    "settings": {{
        "compilerInsertSpaces": true,
        "compilerTabSize": 2,
        "exportClass": true,
        "autoImport": true,
        "preloadMethodName": "",
        "preloadPackFiles": [],
        "createMethodName": "",
        "compilerOutputLanguage": "TYPE_SCRIPT",
        "borderWidth": 64,
        "borderHeight": 64
    }},
    "displayList": [
        {{
            "type": "{go_type}",
            "id": "{display_id}",
            "label": "{label}",
            "hitArea.shape": "POLYGON",
            "hitArea.points": "{hit_area}",
            "texture": {{
                "key": "{tex_key}",
                "frame": "{tex_frame}"
            }},
            "x": 32,
            "y": 48,
            "originY": 0.75
        }}
    ],
    "plainObjects": [],
    "meta": {{
        "app": "Phaser Editor 2D - Scene Editor",
        "url": "https://phasereditor2d.com",
        "contentType": "phasereditor2d.core.scene.SceneContentType",
        "version": 5
    }}
}}"""

# Base TypeScript class body for environment prefabs
_TS_TMPL = """\
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import {{ initStaticActor }} from "{rel_helper}";
{extra_imports}\
/* END-USER-IMPORTS */

export default class {class_name} extends Phaser.GameObjects.{go_type} {{
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {{
    super(scene, x ?? 32, y ?? 48, texture || "{tex_key}", frame ?? "{tex_frame}");

    this.setInteractive(
      new Phaser.Geom.Polygon("{hit_area}"),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null{collider_arg});
{extra_ctr}\
    /* END-USER-CTR-CODE */
  }}

  /* START-USER-CODE */
{todo}
  // Write your code here.

  /* END-USER-CODE */
}}

/* END OF COMPILED CODE */

// You can write more code here
"""

# TypeScript class body for crop prefabs (uses definition-based ObjectNames pattern)
_TS_CROP_TMPL = """\
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import {{ ObjectNames }} from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class {class_name} extends Phaser.GameObjects.Image {{
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {{
    super(scene, x ?? 32, y ?? 48, texture || "{tex_key}", frame ?? "{tex_frame}");

    this.setInteractive(
      new Phaser.Geom.Polygon("{hit_area}"),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }}

  /* START-USER-CODE */
{todo}
  override name = ObjectNames.{class_name};

  /* END-USER-CODE */
}}

/* END OF COMPILED CODE */

// You can write more code here
"""


# Strips Shadow/Dark visual-overlay suffixes from generated class names.
# Order matters: compound suffixes (DarkShadow, GroundShadow + optional digit)
# must be matched before the simpler Shadow/Dark + digit variants.
_SHADOW_DARK_STRIP_RE = [
    (re.compile(r"(?:DarkShadow|GroundShadow)\d*$", re.IGNORECASE), ""),
    (re.compile(r"(?:Shadow|Dark)(\d+)$",            re.IGNORECASE), r"\1"),
    (re.compile(r"(?:Shadow|Dark)$",                 re.IGNORECASE), ""),
]


def _strip_shadow_dark(name: str) -> str:
    """Strip Shadow/Dark visual-overlay suffixes while preserving variant numbers."""
    for pattern, repl in _SHADOW_DARK_STRIP_RE:
        stripped = pattern.sub(repl, name)
        if stripped != name:
            return stripped
    return name


def _pascal(name: str) -> str:
    """
    Convert to PascalCase, preserving any already-uppercase segments.
    e.g. "undead_land" → "UndeadLand", "DeadTreeAnim1" → "DeadTreeAnim1"
    """
    name = name.replace("-", "_").replace(" ", "_").replace(".", "_")
    parts = []
    for word in name.split("_"):
        if not word:
            continue
        # Only capitalise the first letter when the word starts lowercase
        if word[0].islower():
            parts.append(word[0].upper() + word[1:])
        else:
            parts.append(word)
    return "".join(parts)


def _label(frame: str) -> str:
    return frame.replace("/", "_").replace(".", "_").replace(" ", "_")


def _write_prefab(
    out_dir: Path,
    class_name: str,
    tex_key: str,
    tex_frame: str,
    *,
    is_sprite: bool,
    has_collider: bool,
    todo_lines: list[str],
    is_crop: bool = False,
    random_frames: list[str] | None = None,
) -> None:
    """Write <ClassName>.ts and <ClassName>.scene into out_dir."""
    out_dir.mkdir(parents=True, exist_ok=True)
    ts_file    = out_dir / f"{class_name}.ts"
    scene_file = out_dir / f"{class_name}.scene"

    go_type      = "Sprite" if is_sprite else "Image"
    collider_arg = ", true" if has_collider else ""

    # Build TODO block (indented inside /* START-USER-CODE */)
    if todo_lines:
        todo_block = "\n".join(f"  // {line}" for line in todo_lines) + "\n"
    else:
        todo_block = ""

    if is_crop:
        ts_content = _TS_CROP_TMPL.format(
            class_name=class_name,
            tex_key=tex_key,
            tex_frame=tex_frame,
            hit_area=DEFAULT_ISO_POLYGON,
            todo=todo_block,
        )
    else:
        rel_helper = _rel_import(ts_file, INIT_STATIC_ACTOR_FILE)
        # Build RandomSpriteComponent extras when there are multiple static variants
        if random_frames:
            rel_random = _rel_import(ts_file, RANDOM_SPRITE_COMPONENT_FILE)
            frames_literal = ", ".join(f'"{f}"' for f in random_frames)
            extra_imports = f'import {{ RandomSpriteComponent }} from "{rel_random}";\n'
            extra_ctr = f'    new RandomSpriteComponent(this, [{frames_literal}]);\n'
        else:
            extra_imports = ""
            extra_ctr = ""

        ts_content = _TS_TMPL.format(
            class_name=class_name,
            go_type=go_type,
            tex_key=tex_key,
            tex_frame=tex_frame,
            hit_area=DEFAULT_ISO_POLYGON,
            rel_helper=rel_helper,
            collider_arg=collider_arg,
            todo=todo_block,
            extra_imports=extra_imports,
            extra_ctr=extra_ctr,
        )

    scene_content = _SCENE_TMPL.format(
        scene_id=str(uuid.uuid4()),
        go_type=go_type,
        display_id=str(uuid.uuid4()),
        label=_label(tex_frame),
        hit_area=DEFAULT_ISO_POLYGON,
        tex_key=tex_key,
        tex_frame=tex_frame,
    )

    for path, content in [(ts_file, ts_content), (scene_file, scene_content)]:
        rel = path.relative_to(REPO_ROOT)
        path.write_text(content, encoding="utf-8")
        print(f"  [CREATE] {rel}")


# ─── Part 3 – Crop prefabs ────────────────────────────────────────────────────

def _stage_num(filename: str) -> int:
    """Extract the numeric stage from a crop frame filename like 'crops/beans/10.png'."""
    try:
        return int(filename.rsplit("/", 1)[-1].replace(".png", ""))
    except ValueError:
        return 0


def generate_crop_prefabs() -> None:
    print("\n=== Generating crop prefabs ===")
    data   = json.loads(CROPS_JSON.read_text(encoding="utf-8"))
    frames = data["textures"][0]["frames"]

    # Group by top two path components: "crops/beans", "ground/carrot", …
    groups: dict[str, list[dict]] = collections.defaultdict(list)
    for fr in frames:
        parts = fr["filename"].split("/")
        groups["/".join(parts[:2])].append(fr)

    for group_key, group_frames in sorted(groups.items()):
        top_cat, item_name = group_key.split("/", 1)  # e.g. "crops", "beans"

        sorted_frames = sorted(group_frames, key=lambda fr: _stage_num(fr["filename"]))
        first         = sorted_frames[0]
        others        = sorted_frames[1:]

        class_name = _pascal(f"{top_cat}_{item_name}")  # e.g. CropsBeans
        # "crops/beans" → prefabs/.../crops/beans/
        # "ground/boletus" → prefabs/.../crops/ground/boletus/
        if top_cat == "crops":
            out_dir = CROPS_PREFABS_DIR / item_name
        else:
            out_dir = CROPS_PREFABS_DIR / top_cat / item_name

        todo: list[str] = []
        if others:
            todo.append("TODO: Wire up the remaining growth stages:")
            for fr in others:
                todo.append(f"  - {fr['filename']}")

        _write_prefab(
            out_dir,
            class_name,
            tex_key="crops",
            tex_frame=first["filename"],
            is_sprite=False,
            has_collider=False,
            todo_lines=todo,
            is_crop=True,
        )


# ─── Part 4 – Environment prefabs ────────────────────────────────────────────

def _env_sort_key(filename: str) -> int:
    """Return trailing integer for numeric sorting of environment frames."""
    m = re.search(r"(\d+)\.png$", filename)
    return int(m.group(1)) if m else 0


def _group_env_frames(frames: list[dict]) -> tuple[dict[str, list[dict]], dict[str, bool]]:
    """
    Group environment atlas frames by logical asset identity.

    Rules
    -----
    * 3-part paths  (category/subfolder/file.png)  →  keyed by category/subfolder
      These are animation frame sequences → is_animation = True
    * 2-part paths  (category/file.png)             →  keyed by category/base_name
      where base_name strips a trailing _N or -N suffix so that
      "Bones_shadow1_2" … "Bones_shadow1_11" all end up in one group.
      Multiple frames in one group = static visual variants → is_animation = False

    Returns (groups, is_animation_map).
    """
    groups: dict[str, list[dict]] = collections.defaultdict(list)
    is_animation_map: dict[str, bool] = {}
    for fr in frames:
        fn    = fr["filename"]
        parts = fn.split("/")
        if len(parts) == 3:
            key = f"{parts[0]}/{parts[1]}"
            is_animation_map[key] = True
        else:
            base = re.sub(r"[_-]\d+$", "", parts[1].replace(".png", ""))
            key  = f"{parts[0]}/{base}"
            if key not in is_animation_map:
                is_animation_map[key] = False
        groups[key].append(fr)
    return groups, is_animation_map


def generate_environment_prefabs() -> None:
    print("\n=== Generating environment prefabs ===")
    data   = json.loads(ENV_JSON.read_text(encoding="utf-8"))
    frames = data["textures"][0]["frames"]
    groups, is_animation_map = _group_env_frames(frames)

    for group_key, group_frames in sorted(groups.items()):
        category, base_name = group_key.split("/", 1)

        # ── Special case: goblin tall tiles ──────────────────────────────────
        # Each individual tile variant gets its own Image + ColliderComponent
        # prefab rather than being merged into a single animated Sprite.
        if group_key == "goblin/tall tiles":
            _generate_goblin_tiles(group_frames)
            continue

        sorted_frames = sorted(group_frames, key=lambda fr: _env_sort_key(fr["filename"]))
        first         = sorted_frames[0]
        others        = sorted_frames[1:]

        is_animation = is_animation_map.get(group_key, False)
        is_multi     = len(group_frames) > 1

        # Animation sequences → Sprite + TODO to wire frames
        # Static visual variants → Image + RandomSpriteComponent (no Sprite needed)
        is_sprite    = is_animation and is_multi

        class_name = _strip_shadow_dark(_pascal(f"{category}_{base_name}"))
        out_dir    = ENV_PREFABS_DIR / category

        todo: list[str] = []
        random_frames: list[str] | None = None

        if is_animation and others:
            todo.append("TODO: Wire up remaining animation frames:")
            for fr in others:
                todo.append(f"  - {fr['filename']}")
        elif not is_animation and is_multi:
            # Multiple static variants: RandomSpriteComponent picks one at runtime
            random_frames = [fr["filename"] for fr in sorted_frames]

        _write_prefab(
            out_dir,
            class_name,
            tex_key="environment",
            tex_frame=first["filename"],
            is_sprite=is_sprite,
            has_collider=False,
            todo_lines=todo,
            random_frames=random_frames,
        )


def _generate_goblin_tiles(tile_frames: list[dict]) -> None:
    """
    Goblin tall tiles are ground / wall tiles that block movement.
    Each variant gets its own Image prefab with a ColliderComponent.
    """
    print("  Generating goblin tall tiles …")
    out_dir = ENV_PREFABS_DIR / "goblin" / "tall_tiles"

    for fr in sorted(tile_frames, key=lambda f: f["filename"]):
        fn        = fr["filename"]                            # goblin/tall tiles/dark_1.png
        tile_name = fn.rsplit("/", 1)[-1].replace(".png", "") # dark_1
        class_name = _strip_shadow_dark(_pascal(f"goblin_tile_{tile_name}"))

        _write_prefab(
            out_dir,
            class_name,
            tex_key="environment",
            tex_frame=fn,
            is_sprite=False,
            has_collider=True,
            todo_lines=[],
        )


# ─── Part 2b – Migrate existing Sprite env prefabs to Image + RandomSprite ────

_EXTENDS_SPRITE_RE     = re.compile(r"(extends\s+Phaser\.GameObjects\.)Sprite(\s*\{)")
_SUPER_FRAME_RE        = re.compile(r'frame\s*\?\?\s*"([^"]+)"')
_EMPTY_CTR_BODY        = re.compile(r"^\s*(?:// Write your code here\.)?\s*$")
_INIT_STATIC_CTR_BODY  = re.compile(r"^\s*initStaticActor\(this,\s*null(?:,\s*true)?\);\s*$")


def migrate_existing_sprite_prefabs_to_random_image() -> None:
    """
    Converts previously-generated Sprite env prefabs that represent static
    visual variants (not animation sequences) to Image + RandomSpriteComponent.

    Only touches files that still have empty/placeholder CTR code so that any
    hand-crafted animation wiring is preserved.
    """
    data   = json.loads(ENV_JSON.read_text(encoding="utf-8"))
    frames = data["textures"][0]["frames"]
    groups, is_animation_map = _group_env_frames(frames)

    # Build frame-filename → sorted list of all variants in the same group
    frame_to_all: dict[str, list[str]] = {}
    for group_key, group_frames in groups.items():
        if is_animation_map.get(group_key, False):
            continue  # animation sequences stay as Sprites
        sorted_gf = sorted(group_frames, key=lambda fr: _env_sort_key(fr["filename"]))
        all_filenames = [fr["filename"] for fr in sorted_gf]
        if len(all_filenames) < 2:
            continue  # single-frame groups don't need RandomSpriteComponent
        for fr in group_frames:
            frame_to_all[fr["filename"]] = all_filenames

    migrated = 0
    for ts_file in sorted(ENV_PREFABS_DIR.rglob("*.ts")):
        lower = ts_file.name.lower()
        if "component" in lower or "definition" in lower or "sfx-" in lower:
            continue

        content = ts_file.read_text(encoding="utf-8")

        # Only migrate files that extend Sprite
        if "Phaser.GameObjects.Sprite" not in content:
            continue

        # Only migrate files with empty/placeholder CTR code or just initStaticActor
        ctr_match = _CTR_RE.search(content)
        if not ctr_match:
            continue
        ctr_body = ctr_match.group(3)
        if not (_EMPTY_CTR_BODY.match(ctr_body) or _INIT_STATIC_CTR_BODY.match(ctr_body)):
            print(f"  [SKIP-MIGRATE] {ts_file.name} – CTR code is customized")
            continue

        # Determine which frame this prefab uses (from super() call)
        frame_match = _SUPER_FRAME_RE.search(content)
        if not frame_match:
            continue
        tex_frame = frame_match.group(1)

        if tex_frame not in frame_to_all:
            continue  # Not a multi-variant group – no migration needed

        all_frames = frame_to_all[tex_frame]
        rel_helper = _rel_import(ts_file, INIT_STATIC_ACTOR_FILE)
        rel_random = _rel_import(ts_file, RANDOM_SPRITE_COMPONENT_FILE)
        frames_literal = ", ".join(f'"{f}"' for f in all_frames)

        new_imports_block = (
            f'import {{ initStaticActor }} from "{rel_helper}";\n'
            f'import {{ RandomSpriteComponent }} from "{rel_random}";'
        )
        new_ctr_block = (
            f"    initStaticActor(this, null);\n"
            f"    new RandomSpriteComponent(this, [{frames_literal}]);"
        )

        # Replace imports – use direct string splice to handle empty import sections
        start_imp = "/* START-USER-IMPORTS */"
        end_imp   = "/* END-USER-IMPORTS */"
        si = content.find(start_imp)
        ei = content.find(end_imp)
        if si != -1 and ei != -1:
            content = (
                content[:si] + start_imp + "\n" +
                new_imports_block + "\n" +
                end_imp + content[ei + len(end_imp):]
            )

        # Change Sprite → Image
        content = _EXTENDS_SPRITE_RE.sub(r"\1Image\2", content)

        # Replace CTR code (regex works here because CTR section always has content/newlines)
        def replace_ctr(mo: re.Match) -> str:
            return mo.group(1) + mo.group(2) + new_ctr_block + mo.group(4) + mo.group(5)

        content = _CTR_RE.sub(replace_ctr, content)

        # Clean up TODO comments from user-code section
        start_code = "/* START-USER-CODE */"
        end_code   = "/* END-USER-CODE */"
        sc = content.find(start_code)
        ec = content.find(end_code)
        if sc != -1 and ec != -1:
            section = content[sc + len(start_code):ec]
            # Remove lines that start with // TODO: or contain only whitespace/comment leftovers
            cleaned_lines = [
                line for line in section.splitlines(keepends=True)
                if not re.match(r"^\s*//\s*(TODO:|  -\s)", line)
            ]
            cleaned = "".join(cleaned_lines)
            content = content[:sc + len(start_code)] + cleaned + end_code + content[ec + len(end_code):]

        ts_file.write_text(content, encoding="utf-8")
        print(f"  [MIGRATE] {ts_file.relative_to(REPO_ROOT)}")
        migrated += 1

    print(f"  Migrated {migrated} Sprite prefab(s) to Image + RandomSpriteComponent")


# ─── Entry point ──────────────────────────────────────────────────────────────

def main() -> None:
    print("=== Step 1: Creating initStaticActor helper ===")
    create_init_static_actor()

    print("\n=== Step 2: Refactoring existing prefab files ===")
    refactor_all_prefab_files()

    print("\n=== Step 2b: Migrating static-variant Sprite env prefabs ===")
    migrate_existing_sprite_prefabs_to_random_image()

    print("\n=== Step 3: Generating crop prefabs ===")
    generate_crop_prefabs()

    print("\n=== Step 4: Generating environment prefabs ===")
    generate_environment_prefabs()

    print("\nDone!")


if __name__ == "__main__":
    main()
