#!/usr/bin/env bash
set -euo pipefail

# Usage: ./download_models.sh /absolute/path/to/models
ROOT="${1:-./models}"
mkdir -p "$ROOT"

if ! command -v hf >/dev/null 2>&1; then
  echo "Error: 'hf' CLI not found. Install with: pip install -U huggingface_hub" >&2
  exit 1
fi

# Supported 2-letter locales (normalized; pivot is en)
langs=(
  af ar be bg br ca cs da de el en eo es et eu fa fi
  fr gd gl gu he hi hr hu hy id it ja ka kk kn ko lb
  lt lv mi mk ml mr ms no nl oc pl pt ro ru sa si sk
  sl sq sr sv sw ta te th tr uk vi zh
)

echo "Downloading MarianMT en<->XX models into: $ROOT"
for lang in "${langs[@]}"; do
  if [[ "$lang" == "en" ]]; then
    continue
  fi

  # XX -> EN
  repo_a="Helsinki-NLP/opus-mt-${lang}-en"
  dir_a="${ROOT}/opus-mt-${lang}-en"
  if [[ ! -d "$dir_a" ]]; then
    echo "-> $repo_a"
    hf download "$repo_a" \
      --repo-type model \
      --revision main \
      --local-dir "$dir_a" \
      --include "*" || echo "WARN: failed $repo_a"
  fi

  # EN -> XX
  repo_b="Helsinki-NLP/opus-mt-en-${lang}"
  dir_b="${ROOT}/opus-mt-en-${lang}"
  if [[ ! -d "$dir_b" ]]; then
    echo "-> $repo_b"
    hf download "$repo_b" \
      --repo-type model \
      --revision main \
      --local-dir "$dir_b" \
      --include "*" || echo "WARN: failed $repo_b"
  fi
done

echo "Done. Models saved under: $ROOT"
