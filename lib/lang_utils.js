const DETECT_URL = process.env.LANG_DETECT_URL || "http://10.0.0.103:8000/detect";
const TRANSLATE_URL = process.env.TRANSLATE_URL || "http://10.0.0.103:8000/translate";
const HTTP_TIMEOUT_MS = Number( process.env.LANG_HTTP_TIMEOUT_MS || 10000 );

async function postJSON( url, payload, timeoutMs = HTTP_TIMEOUT_MS ) {
  const ctrl = new AbortController();
  const id = setTimeout( () => ctrl.abort(), timeoutMs );
  try {
    const res = await fetch( url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify( payload ),
      signal: ctrl.signal
    } );
    if ( !res.ok ) {
      throw new Error( `HTTP ${res.status}` );
    }
    return await res.json();
  } finally {
    clearTimeout( id );
  }
}

class LangService {
  /**
   * @param {string} body
   * @returns {Promise<string|null>} locale code like 'fr' | 'en-US' or null
   */
  static async detect( body ) {
    console.log( "Detect language..." );
    if ( !body || !body.trim() ) return null;
    try {
      const data = await postJSON( DETECT_URL, { text: body } );
      // accept a few common response shapes
      return data?.locale || data?.language || data?.lang || null;
    } catch ( _err ) {
      return null; // be quiet on failure
    }
  }

  /**
   * @param {string} body - source text
   * @param {string} targetLocale - e.g. 'fr'
   * @param {string|null} sourceLocale - optional, e.g. 'en'
   * @returns {Promise<string>} translated text or original body on failure
   */
  static async translate( body, targetLocale, sourceLocale = null ) {
    console.log( "Translate language..." );
    if ( !body || !body.trim() || !targetLocale || !sourceLocale ) return body;
    try {
      const payload = { text: body, target_locale: targetLocale, source_locale: sourceLocale };
      console.log( "payload = ", payload );
      const data = await postJSON( TRANSLATE_URL, payload );
      const translated = data?.translated_text;
      console.log( "translated = ", translated );
      return ( typeof translated === "string" && translated.length ) ? translated : body;
    } catch ( _err ) {
      console.log( "translate error ", _err );
      return body;
    }
  }
}

module.exports = LangService;
