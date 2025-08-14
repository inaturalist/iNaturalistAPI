pip install --no-cache-dir fastapi uvicorn transformers torch accelerate



huggingface-cli download google-t5/t5-3b --local-dir ./t5-3b-model --local-dir-use-symlinks False

export T5_MODEL_NAME_OR_PATH="$(readlink -f ./t5-3b-model)"

uvicorn app:app --reload --host 0.0.0.0 --port 8000


curl -X POST http://localhost:8000/detect -H "Content-Type: application/json" \
  -d '{"text":"Bonjour, comment ça va ?"}'


curl -s localhost:8000/translate -H 'content-type: application/json' \
  -d '{"text":"Hello, I m Alex", "source_locale":"en", "target_locale":"fr"}'

curl -s localhost:8000/translate -H 'content-type: application/json' \
  -d '{"text":"Hello", "source_locale":"en", "target_locale":"fr"}'

-----------------------

pip install fastapi uvicorn transformers torch sentencepiece lingua-language-detector huggingface_hub
pip install -U "transformers>=4.41" "tokenizers>=0.15.2" "sentencepiece>=0.1.99" "huggingface_hub>=0.23"


huggingface-cli download facebook/nllb-200-distilled-600M \
  --local-dir ./nllb-200-d600m \
  --local-dir-use-symlinks False

export FORCE_CPU=1
export NLLB_MODEL_PATH="/abs/path/to/nllb-200-d600m"

uvicorn app:app --reload --host 0.0.0.0 --port 8000



pip install -U "transformers>=4.41" "tokenizers>=0.15.2" "sentencepiece>=0.1.99" "huggingface_hub>=0.23"
export FORCE_CPU=1
uvicorn app:app --reload --host 0.0.0.0 --port 8000



pip install fastapi uvicorn transformers sentencepiece lingua-language-detector

huggingface-cli download Helsinki-NLP/opus-mt-en-fr --local-dir ./opus-mt-en-fr --local-dir-use-symlinks False
huggingface-cli download Helsinki-NLP/opus-mt-fr-en --local-dir ./opus-mt-fr-en --local-dir-use-symlinks False

export MARIAN_LOCAL_ROOT="$(pwd)"
uvicorn app:app --host 0.0.0.0 --port 8000



---------------------------

huggingface-cli download facebook/nllb-200-1.3B \
  --local-dir ./models/nllb-200-1.3B \
  --local-dir-use-symlinks False



chmod +x download_models.sh
./download_models.sh ./models

export MARIAN_LOCAL_ROOT=./models
pip install fastapi uvicorn transformers sentencepiece lingua-language-detector
uvicorn app:app --host 0.0.0.0 --port 8000


TRANSLATE_BACKEND=nllb uvicorn app:app --host 0.0.0.0 --port 8000

TRANSLATE_BACKEND=nllb NLLB_LOCAL_ROOT=./models/nllb-200-1.3B uvicorn app:app --host 0.0.0.0 --port 8000