from typing import Dict, Tuple
import os
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# -------- Settings --------
MARIAN_LOCAL_ROOT = os.environ.get("MARIAN_LOCAL_ROOT", "./models")
PIVOT = "en"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
DTYPE = torch.float16 if DEVICE == "cuda" else torch.float32

# Optional: avoid SDPA meta-tensor issues
try:
    if hasattr(torch.backends, "cuda"):
        torch.backends.cuda.enable_flash_sdp(False)
        torch.backends.cuda.enable_mem_efficient_sdp(False)
        torch.backends.cuda.enable_math_sdp(True)
except Exception:
    pass

SUPPORTED = {
    "af","ar","be","bg","br","ca","cs","da","de","el","en","eo","es","et","eu","fa","fi",
    "fr","gd","gl","gu","he","hi","hr","hu","hy","id","it","ja","ka","kk","kn","ko","lb",
    "lt","lv","mi","mk","ml","mr","ms","no","nl","oc","pl","pt","ro","ru","sa","si","sk",
    "sl","sq","sr","sv","sw","ta","te","th","tr","uk","vi","zh"
}
ALIASES = {
    "iw": "he",
    "nb": "no",
    "nn": "no",
}

def _norm2(code: str) -> str:
    if not code:
        return ""
    c = code.strip().lower()[:2]
    return ALIASES.get(c, c)

def _ensure_supported(code: str, which: str):
    if code not in SUPPORTED:
        raise ValueError(f"Unsupported {which} locale '{code}'")

_CACHE: Dict[Tuple[str, str, str], Tuple[AutoTokenizer, AutoModelForSeq2SeqLM, str]] = {}

def _local_model_path(src: str, tgt: str) -> str:
    return os.path.join(MARIAN_LOCAL_ROOT, f"opus-mt-{src}-{tgt}")

def _load_pair(src: str, tgt: str) -> Tuple[AutoTokenizer, AutoModelForSeq2SeqLM, str]:
    key = (src, tgt, DEVICE)
    if key in _CACHE:
        return _CACHE[key]
    path = _local_model_path(src, tgt)
    if not os.path.isdir(path):
        raise FileNotFoundError(path)

    print(f"[LOAD] Loading model for {src}→{tgt} from {path} on {DEVICE} ({DTYPE})")

    tok = AutoTokenizer.from_pretrained(path)
    mdl = AutoModelForSeq2SeqLM.from_pretrained(path, torch_dtype=DTYPE)
    mdl.to(DEVICE)
    mdl.eval()

    if any(p.device.type == "meta" for p in mdl.parameters()):
        raise RuntimeError(f"Model for {src}->{tgt} initialized on meta device")

    _CACHE[key] = (tok, mdl, path)
    return _CACHE[key]

def _translate_direct(text: str, src: str, tgt: str) -> str:
    tok, mdl, _ = _load_pair(src, tgt)
    print(f"[DIRECT] Translating {src}→{tgt} | text='{text[:50]}...' (len={len(text)})")

    inputs = tok(text, return_tensors="pt", truncation=True, max_length=512, padding=True)
    inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

    pad_id = tok.pad_token_id or tok.eos_token_id
    eos_id = mdl.config.eos_token_id or tok.eos_token_id

    with torch.inference_mode():
        out = mdl.generate(
            **inputs,
            max_new_tokens=160,
            num_beams=4,
            do_sample=False,
            early_stopping=True,
            pad_token_id=pad_id,
            eos_token_id=eos_id,
        )

    result = tok.decode(out[0], skip_special_tokens=True).strip()
    print(f"[DIRECT] Output '{result[:50]}...' (len={len(result)})")
    return result

def translate_text(text: str, source_locale: str, target_locale: str):
    print(f"[REQ] text='{text[:50]}...' (len={len(text)}) src='{source_locale}' tgt='{target_locale}'")

    src = _norm2(source_locale)
    tgt = _norm2(target_locale)

    _ensure_supported(src, "source")
    _ensure_supported(tgt, "target")

    if src == tgt:
        print("[ROUTE] Identity (no translation needed)")
        return {"translated_text": text, "route": "identity", "used_models": {}}

    try:
        out = _translate_direct(text, src, tgt)
        print(f"[ROUTE] Direct {src}→{tgt}")
        return {
            "translated_text": out,
            "route": "direct",
            "used_models": {"direct": _local_model_path(src, tgt)}
        }
    except FileNotFoundError:
        print(f"[INFO] No direct model for {src}→{tgt}, pivoting via {PIVOT}")

    used = {}
    mid = text

    if src != PIVOT:
        mid = _translate_direct(mid, src, PIVOT)
        used["to_en"] = _local_model_path(src, PIVOT)

    if tgt != PIVOT:
        mid = _translate_direct(mid, PIVOT, tgt)
        used["en_to_tgt"] = _local_model_path(PIVOT, tgt)

    print(f"[ROUTE] Pivot via {PIVOT}: {src}→{PIVOT}→{tgt}")
    return {"translated_text": mid, "route": f"pivot({PIVOT})", "used_models": used}
