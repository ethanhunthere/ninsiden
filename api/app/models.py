"""Pydantic request/response models."""
from pydantic import BaseModel, field_validator


class TraceRequest(BaseModel):
    prompt: str

    @field_validator("prompt")
    @classmethod
    def validate_prompt(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Prompt cannot be empty.")
        if len(stripped) > 2000:
            raise ValueError("Prompt must be 2000 characters or fewer.")
        return stripped
