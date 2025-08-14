from typing import Dict, Tuple
import os
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# -------- Settings --------
# If you have the model locally, point NLLB_LOCAL_ROOT to that folder.
# Otherwise, we’ll pull from the Hub cache using NLLB_MODEL_NAME.
LOCAL_ROOT = os.environ.get("NLLB_LOCAL_ROOT", "").strip() or None
NLLB_MODEL_NAME = os.environ.get("NLLB_MODEL_NAME", "facebook/nllb-200-1.3B")
BACKEND_NAME = "NLLB-200 (1.3B)"

PIVOT = "en"  # external API expects 2-letter; internally we map to eng_Latn

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
DTYPE = torch.float16 if DEVICE == "cuda" else torch.float32

# Optional: avoid SDPA meta-tensor issues on some CUDA builds
try:
    if hasattr(torch.backends, "cuda"):
        torch.backends.cuda.enable_flash_sdp(False)
        torch.backends.cuda.enable_mem_efficient_sdp(False)
        torch.backends.cuda.enable_math_sdp(True)
except Exception:
    pass

# The public API uses 2-letter codes; map them to NLLB language tags.
# Add more as needed.
_2LETTER_TO_NLLB = {
    "af": "afr_Latn", "ar": "arb_Arab", "be": "bel_Cyrl", "bg": "bul_Cyrl",
    "br": "bre_Latn", "ca": "cat_Latn", "cs": "ces_Latn", "da": "dan_Latn",
    "de": "deu_Latn", "el": "ell_Grek", "en": "eng_Latn", "eo": "epo_Latn",
    "es": "spa_Latn", "et": "est_Latn", "eu": "eus_Latn", "fa": "pes_Arab",
    "fi": "fin_Latn", "fr": "fra_Latn", "gd": "gla_Latn", "gl": "glg_Latn",
    "gu": "guj_Gujr", "he": "heb_Hebr", "hi": "hin_Deva", "hr": "hrv_Latn",
    "hu": "hun_Latn", "hy": "hye_Armn", "id": "ind_Latn", "it": "ita_Latn",
    "ja": "jpn_Jpan", "ka": "kat_Geor", "kk": "kaz_Cyrl", "kn": "kan_Knda",
    "ko": "kor_Hang", "lb": "ltz_Latn", "lt": "lit_Latn", "lv": "lvs_Latn",
    "mi": "mri_Latn", "mk": "mkd_Cyrl", "ml": "mal_Mlym", "mr": "mar_Deva",
    "ms": "zsm_Latn", "no": "nob_Latn", "nl": "nld_Latn", "oc": "oci_Latn",
    "pl": "pol_Latn", "pt": "por_Latn", "ro": "ron_Latn", "ru": "rus_Cyrl",
    "sa": "san_Deva", "si": "sin_Sinh", "sk": "slk_Latn", "sl": "slv_Latn",
    "sq": "als_Latn", "sr": "srp_Cyrl", "sv": "swe_Latn", "sw": "swh_Latn",
    "ta": "tam_Taml", "te": "tel_Telu", "th": "tha_Thai", "tr": "tur_Latn",
    "uk": "ukr_Cyrl", "vi": "vie_Latn", "zh": "zho_Hans",
}

# External API’s supported set (keep consistent with your old one)
SUPPORTED = set(_2LETTER_TO_NLLB.keys())
ALIASES = {
    "iw": "he",
    "nb": "no",
    "nn": "no",
    # (add more aliases if you need them)
}

def _norm2(code: str) -> str:
    if not code:
        return ""
    c = code.strip().lower()[:2]
    return ALIASES.get(c, c)

def _ensure_supported(code: str, which: str):
    if code not in SUPPORTED:
        raise ValueError(f"Unsupported {which} locale '{code}'")

def _to_nllb(code2: str) -> str:
    try:
        return _2LETTER_TO_NLLB[code2]
    except KeyError:
        raise ValueError(f"No NLLB mapping for locale '{code2}'")

# Cache the heavy objects
# key = (DEVICE)
_CACHE: Dict[str, Tuple[AutoTokenizer, AutoModelForSeq2SeqLM, str]] = {}

def _model_source_str() -> str:
    if LOCAL_ROOT and os.path.isdir(LOCAL_ROOT):
        return LOCAL_ROOT
    return NLLB_MODEL_NAME

def _load_model() -> Tuple[AutoTokenizer, AutoModelForSeq2SeqLM, str]:
    key = DEVICE
    if key in _CACHE:
        return _CACHE[key]

    src = _model_source_str()
    print(f"[LOAD] Loading NLLB model from '{src}' on {DEVICE} ({DTYPE})")

    if LOCAL_ROOT and os.path.isdir(LOCAL_ROOT):
        tok = AutoTokenizer.from_pretrained(LOCAL_ROOT, use_fast=False)
        mdl = AutoModelForSeq2SeqLM.from_pretrained(LOCAL_ROOT, torch_dtype=DTYPE)
        path_str = LOCAL_ROOT
    else:
        tok = AutoTokenizer.from_pretrained(NLLB_MODEL_NAME, use_fast=False)
        mdl = AutoModelForSeq2SeqLM.from_pretrained(NLLB_MODEL_NAME, torch_dtype=DTYPE)
        path_str = NLLB_MODEL_NAME

    mdl.to(DEVICE)
    mdl.eval()

    if any(p.device.type == "meta" for p in mdl.parameters()):
        raise RuntimeError("NLLB model initialized on meta device")

    _CACHE[key] = (tok, mdl, path_str)
    return _CACHE[key]

def _pick_concise(tok, sequences, seq_scores):
    """
    Generic reranker: prefer concise, well-formed outputs.
    Score = model_score + brevity_bonus
    (No word lists; purely length-aware.)
    """
    best_i, best_s = 0, float("-inf")
    for i, (seq, s) in enumerate(zip(sequences, seq_scores)):
        text = tok.decode(seq, skip_special_tokens=True).strip()
        # brevity bonus (token-agnostic): shorter strings get a small boost
        brevity_bonus = -0.02 * len(text)
        score = float(s) + brevity_bonus
        if score > best_s:
            best_i, best_s = i, score
    return tok.decode(sequences[best_i], skip_special_tokens=True).strip()

def _translate_direct(text: str, src2: str, tgt2: str) -> str:
    tok, mdl, _ = _load_model()

    src_code = _to_nllb(src2)
    tgt_code = _to_nllb(tgt2)

    tok.src_lang = src_code
    tok.tgt_lang = tgt_code
    forced_bos_id = tok.convert_tokens_to_ids(tgt_code)

    enc = tok(text, return_tensors="pt", truncation=True, max_length=128, padding=True)
    enc = {k: v.to(DEVICE) for k, v in enc.items()}

    # Base generation settings
    base_kwargs = dict(
        pad_token_id=tok.pad_token_id or tok.eos_token_id,
        eos_token_id=mdl.config.eos_token_id or tok.eos_token_id,
        forced_bos_token_id=forced_bos_id,
        do_sample=False,
        return_dict_in_generate=True,
        output_scores=True,
    )

    # Short-input mode: for very short inputs, search a bit and rerank by concision.
    # (No hardcoded terms, no banned words.)
    src_len_tokens = int(enc["input_ids"].shape[1])
    few_words = len(text.strip().split()) <= 10
    short_mode = src_len_tokens <= 3 and few_words

    print(f"[INPUT MODE] src_len='{src_len_tokens}' short_mode='{short_mode}'")

    if short_mode:
        gen_kwargs = dict(
            num_beams=8,
            num_return_sequences=8,   # still get an n-best list
            max_new_tokens=12,
            length_penalty=0.8,
            no_repeat_ngram_size=2,
        )
    else:
        gen_kwargs = dict(
            num_beams=5,
            num_return_sequences=1,
            max_new_tokens=40,
            length_penalty=1.0,
            no_repeat_ngram_size=0,
        )

    with torch.inference_mode():
        out = mdl.generate(**enc, **base_kwargs, **gen_kwargs)

    if short_mode and out.sequences.shape[0] > 1:
        # Purely length-aware reranking (no word constraints)
        return _pick_concise(tok, out.sequences, out.sequences_scores)
    else:
        return tok.decode(out.sequences[0], skip_special_tokens=True).strip()


def translate_text(text: str, source_locale: str, target_locale: str):
    print(f"[REQ:NLLB] text='{text[:50]}...' src='{source_locale}' tgt='{target_locale}'")

    src = _norm2(source_locale)
    tgt = _norm2(target_locale)

    _ensure_supported(src, "source")
    _ensure_supported(tgt, "target")

    if src == tgt:
        print("[ROUTE] Identity (no translation needed)")
        return {"translated_text": text, "route": "identity", "used_models": {}}

    # NLLB is one-to-many; we can try direct always (no per-pair folder needed)
    out = _translate_direct(text, src, tgt)
    used = {"nllb": _model_source_str()}
    print(f"[ROUTE] Direct via single NLLB model: {src}→{tgt}")
    return {"translated_text": out, "route": "direct", "used_models": used}
