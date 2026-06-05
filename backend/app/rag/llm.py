"""OpenAI-compatible LLM client used by the RAG service."""
from __future__ import annotations

from dataclasses import dataclass

import httpx

from app.core.config import settings
from app.rag.schemas import LLMOptions


@dataclass(frozen=True)
class ResolvedLLM:
    provider: str
    model: str
    base_url: str
    api_key: str
    temperature: float


_PROVIDER_ENV: dict[str, tuple[str, str, str]] = {
    "openai": ("OPENAI_API_KEY", "OPENAI_BASE_URL", "OPENAI_MODEL"),
    "deepseek": ("DEEPSEEK_API_KEY", "DEEPSEEK_BASE_URL", "DEEPSEEK_MODEL"),
    "dashscope": ("DASHSCOPE_API_KEY", "DASHSCOPE_BASE_URL", "DASHSCOPE_MODEL"),
    "qwen": ("DASHSCOPE_API_KEY", "DASHSCOPE_BASE_URL", "DASHSCOPE_MODEL"),
    "moonshot": ("MOONSHOT_API_KEY", "MOONSHOT_BASE_URL", "MOONSHOT_MODEL"),
    "kimi": ("MOONSHOT_API_KEY", "MOONSHOT_BASE_URL", "MOONSHOT_MODEL"),
    "zhipuai": ("ZHIPUAI_API_KEY", "ZHIPUAI_BASE_URL", "ZHIPUAI_MODEL"),
    "glm": ("ZHIPUAI_API_KEY", "ZHIPUAI_BASE_URL", "ZHIPUAI_MODEL"),
    "siliconflow": ("SILICONFLOW_API_KEY", "SILICONFLOW_BASE_URL", "SILICONFLOW_MODEL"),
}


def resolve(options: LLMOptions) -> ResolvedLLM:
    provider = (options.provider or "local").strip().lower()
    api_key = options.api_key.strip()
    base_url = options.base_url.strip().rstrip("/")
    model = options.model.strip()

    env_keys = _PROVIDER_ENV.get(provider)
    if env_keys:
        key_name, base_name, model_name = env_keys
        api_key = api_key or str(getattr(settings, key_name, ""))
        base_url = base_url or str(getattr(settings, base_name, ""))
        model = model or str(getattr(settings, model_name, ""))

    return ResolvedLLM(
        provider=provider,
        model=model,
        base_url=base_url,
        api_key=api_key,
        temperature=options.temperature,
    )


def chat(resolved: ResolvedLLM, *, system: str, user: str) -> str:
    """Call a provider that implements OpenAI-compatible chat completions."""
    if resolved.provider == "local":
        raise RuntimeError("local provider does not call an external LLM")
    if not resolved.api_key:
        raise RuntimeError(f"{resolved.provider} 未配置 API key")
    if not resolved.base_url:
        raise RuntimeError(f"{resolved.provider} 未配置 base_url")
    if not resolved.model:
        raise RuntimeError(f"{resolved.provider} 未配置 model")

    url = f"{resolved.base_url.rstrip('/')}/chat/completions"
    payload = {
        "model": resolved.model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": resolved.temperature,
    }
    headers = {
        "Authorization": f"Bearer {resolved.api_key}",
        "Content-Type": "application/json",
    }

    with httpx.Client(timeout=45.0) as client:
        resp = client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    try:
        return str(data["choices"][0]["message"]["content"]).strip()
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(f"LLM 响应格式不符合 chat/completions: {data}") from exc
