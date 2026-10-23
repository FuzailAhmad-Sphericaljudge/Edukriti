declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    FILES: R2Bucket;
    GEMINI_API_KEY?: string;
    GEMINI_MODEL?: string;
    LLM_PROVIDER?: string;
    LLM_MODEL?: string;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
  }
}
