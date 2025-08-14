from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict
import os
import importlib

# -------- backend selection --------
BACKEND = os.environ.get("TRANSLATE_BACKEND", "marian").strip().lower()
if BACKEND == "nllb":
    translate_mod = importlib.import_module("translate_nllb_200")
else:
    translate_mod = importlib.import_module("translate")

# Re-export expected symbols from the chosen module
translate_text = translate_mod.translate_text
SUPPORTED = translate_mod.SUPPORTED
PIVOT = translate_mod.PIVOT
BACKEND_NAME = translate_mod.BACKEND_NAME
LOCAL_ROOT = getattr(translate_mod, "LOCAL_ROOT", None)

# Keep compatibility with existing Marian health field name
MARIAN_LOCAL_ROOT = getattr(translate_mod, "MARIAN_LOCAL_ROOT", None)

app = FastAPI(title=f"Translate API • {BACKEND_NAME}")

class DetectIn(BaseModel):
    text: str = Field(..., min_length=1)

class DetectOut(BaseModel):
    language: str | None
    confidence: float

class TranslateIn(BaseModel):
    text: str = Field(..., min_length=1)
    source_locale: str = Field(..., description="2-letter ISO like 'fr','en','pt','zh'...")
    target_locale: str = Field(..., description="2-letter ISO like 'fr','en','pt','zh'...")

class TranslateOut(BaseModel):
    translated_text: str
    route: str                 # 'direct', 'pivot(en)', or 'identity'
    used_models: Dict[str, str]

# -------- language detection (unchanged) --------
from detect import detect_language

@app.get("/health")
def health():
    return {
        "status": "ok",
        "backend": BACKEND_NAME,
        "supported_locales": sorted(SUPPORTED),
        "pivot": PIVOT,
        # For UI compatibility, expose both names if present
        "local_root": LOCAL_ROOT or MARIAN_LOCAL_ROOT,
        "env": {
            "TRANSLATE_BACKEND": BACKEND,
            "NLLB_LOCAL_ROOT": os.environ.get("NLLB_LOCAL_ROOT"),
            "NLLB_MODEL_NAME": os.environ.get("NLLB_MODEL_NAME"),
            "MARIAN_LOCAL_ROOT": os.environ.get("MARIAN_LOCAL_ROOT"),
        },
    }

@app.post("/detect", response_model=DetectOut)
def detect_endpoint(body: DetectIn):
    lang, conf = detect_language(body.text)
    return DetectOut(language=lang, confidence=conf)

@app.post("/translate", response_model=TranslateOut)
def translate_endpoint(body: TranslateIn):
    try:
        out = translate_text(
            text=body.text,
            source_locale=body.source_locale,
            target_locale=body.target_locale,
        )
        return TranslateOut(**out)
    except ValueError as e:
        # unknown/unsupported locale -> 400
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        # missing local model folder -> 400
        raise HTTPException(status_code=400, detail=f"Missing local model: {e}")
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
