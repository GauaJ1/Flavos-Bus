# Screenshot do dashboard p/ revisão visual: claro e escuro, mobile e desktop.

from __future__ import annotations

import os
import sys
from pathlib import Path

TMP = Path(__file__).resolve().parent / ".tmp"
os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(TMP / "pw-browsers")
os.environ["TEMP"] = str(TMP / "pw-artifacts")
os.environ["TMP"] = str(TMP / "pw-artifacts")

from playwright.sync_api import sync_playwright  # noqa: E402

URL = Path(__file__).resolve().parent.parent.parent / "docs" / "dashboard_semob.html"
DEST = TMP / "dash-shots"
DEST.mkdir(parents=True, exist_ok=True)

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    for tema in ("light", "dark"):
        ctx = browser.new_context(
            viewport={"width": 1280, "height": 1400},
            color_scheme=tema,
            device_scale_factor=1,
        )
        page = ctx.new_page()
        page.goto(URL.as_uri())
        page.wait_for_timeout(700)
        page.screenshot(path=str(DEST / f"desktop-{tema}.png"), full_page=True)
        # largura da dobra acima
        page.screenshot(path=str(DEST / f"topo-{tema}.png"))
        ctx.close()
    ctx = browser.new_context(viewport={"width": 390, "height": 900},
                              color_scheme="light")
    page = ctx.new_page()
    page.goto(URL.as_uri())
    page.wait_for_timeout(600)
    page.screenshot(path=str(DEST / "mobile-light.png"), full_page=True)
    ctx.close()
    browser.close()
print("screenshots em", DEST)
