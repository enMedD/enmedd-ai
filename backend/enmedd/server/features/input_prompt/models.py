from uuid import UUID

from pydantic import BaseModel
from pydantic import field_validator

from enmedd.db.models import InputPrompt
from enmedd.utils.logger import setup_logger

logger = setup_logger()


class CreateInputPromptRequest(BaseModel):
    prompt: str
    content: str
    is_public: bool

    @field_validator("prompt", mode="before")
    def strip_whitespace(cls, value):
        if isinstance(value, str):
            return value.strip()
        return value


class UpdateInputPromptRequest(BaseModel):
    prompt: str
    content: str
    active: bool

    @field_validator("prompt", mode="before")
    def strip_whitespace(cls, value):
        if isinstance(value, str):
            return value.strip()
        return value


class InputPromptResponse(BaseModel):
    id: int
    prompt: str
    content: str
    active: bool


class InputPromptSnapshot(BaseModel):
    id: int
    prompt: str
    content: str
    active: bool
    user_id: UUID | None
    is_public: bool

    @classmethod
    def from_model(cls, input_prompt: InputPrompt) -> "InputPromptSnapshot":
        return InputPromptSnapshot(
            id=input_prompt.id,
            prompt=input_prompt.prompt,
            content=input_prompt.content,
            active=input_prompt.active,
            user_id=input_prompt.user_id,
            is_public=input_prompt.is_public,
        )
