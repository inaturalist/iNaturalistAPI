from typing import Tuple, Optional
from lingua import LanguageDetectorBuilder

# Small, self-contained detector (loads once at import)
print("[DETECTOR] Initializing Lingua detector with all languages (preloaded models)")
_detector = (
    LanguageDetectorBuilder.from_all_languages()
    .with_preloaded_language_models()
    .build()
)
print("[DETECTOR] Ready.")

def detect_language(text: str) -> Tuple[Optional[str], float]:
    """
    Returns (iso_639_1, confidence) or (None, 0.0) if unknown.
    """
    print(f"[DETECT] Incoming text='{text[:50]}...' (len={len(text) if text else 0})")
    if not text or not text.strip():
        print("[DETECT] Empty or whitespace-only text → returning (None, 0.0)")
        return None, 0.0

    best = _detector.detect_language_of(text)
    if best is None:
        print("[DETECT] No language detected")
        return None, 0.0

    conf = _detector.compute_language_confidence(text, best)
    iso = (
        best.iso_code_639_1.name.lower()
        if best.iso_code_639_1 is not None
        else best.iso_code_639_3.name.lower()
    )

    if len(iso) != 2:
        print(f"[DETECT] Detected '{iso}' but not a 2-letter code → returning (None, {conf:.3f})")
        return None, float(conf)

    print(f"[DETECT] Detected language='{iso}' confidence={conf:.3f}")
    return iso, float(conf)
