#!/usr/bin/env python3
"""Replace hardcoded white/black colors with theme-aware equivalents in module files."""
import re
from pathlib import Path

# Mapping of hardcoded patterns -> theme-aware replacement
REPLACEMENTS = [
    # Text colors
    (r'\btext-white/([0-9]+)\b', r'text-foreground/\1'),
    (r'\btext-white\b', r'text-foreground'),
    (r'\btext-black/([0-9]+)\b', r'text-background/\1'),
    (r'\btext-black\b', r'text-background'),

    # Background colors
    (r'\bbg-white/([0-9]+)\b', r'bg-foreground/\1'),
    (r'\bbg-white\b', r'bg-foreground'),
    (r'\bbg-black/([0-9]+)\b', r'bg-background/\1'),
    (r'\bbg-black\b', r'bg-background'),

    # Border colors
    (r'\bborder-white/([0-9]+)\b', r'border-foreground/\1'),
    (r'\bborder-white\b', r'border-foreground'),
    (r'\bborder-black/([0-9]+)\b', r'border-background/\1'),
    (r'\bborder-black\b', r'border-background'),

    # Gradient stops
    (r'\bfrom-black\b', r'from-background'),
    (r'\bfrom-white\b', r'from-foreground'),
    (r'\bvia-white\b', r'via-foreground'),
    (r'\bto-black\b', r'to-background'),
    (r'\bto-white\b', r'to-foreground'),
]

# Files to process - only the module files (which still use hardcoded colors)
FILES = [
    "src/components/skywee/modules/agent-square.tsx",
    "src/components/skywee/modules/aegis.tsx",
    "src/components/skywee/modules/swarm-treasury.tsx",
    "src/components/skywee/modules/rwa-vault.tsx",
    "src/components/skywee/modules/carbon-guard.tsx",
]

ROOT = Path("/home/z/my-project")

for rel in FILES:
    p = ROOT / rel
    if not p.exists():
        print(f"SKIP (missing): {rel}")
        continue
    text = p.read_text()
    original = text
    for pat, rep in REPLACEMENTS:
        text = re.sub(pat, rep, text)
    if text != original:
        p.write_text(text)
        print(f"UPDATED: {rel}")
    else:
        print(f"no changes: {rel}")

print("Done")
