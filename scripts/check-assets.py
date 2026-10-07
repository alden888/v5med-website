#!/usr/bin/env python3
"""Fail the build when a local image reference in HTML or JavaScript is absent."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
IMAGE_REF = re.compile(r"(?:['\"(]|=)(/?images/[A-Za-z0-9_./% -]+?\.(?:avif|gif|jpe?g|png|svg|webp))(?:['\")?]|[?#])", re.I)


def local_path(raw: str) -> Path:
    return ROOT / raw.lstrip("/").replace("%20", " ")


def main() -> int:
    missing: list[str] = []
    files = list(ROOT.rglob("*.html")) + list((ROOT / "js").glob("*.js"))
    for source in sorted(files):
        text = source.read_text(encoding="utf-8", errors="replace")
        for match in IMAGE_REF.finditer(text):
            ref = match.group(1)
            if not local_path(ref).is_file():
                missing.append(f"{source.relative_to(ROOT)}: {ref}")

    if missing:
        print("Missing local image references:")
        print("\n".join(missing))
        return 1
    print(f"Asset check passed: {len(files)} HTML/JS files scanned; 0 missing local images.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
