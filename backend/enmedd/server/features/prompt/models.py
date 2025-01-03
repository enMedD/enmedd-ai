from pydantic import BaseModel
from pydantic import field_validator

from enmedd.db.models import Prompt


class CreatePromptRequest(BaseModel):
    name: str
    description: str
    system_prompt: str
    task_prompt: str
    include_citations: bool = False
    datetime_aware: bool = False
    assistant_ids: list[int] | None = None

    @field_validator("name", "description", mode="before")
    def strip_whitespace(cls, value):
        if isinstance(value, str):
            return value.strip()
        return value


class PromptSnapshot(BaseModel):
    id: int
    name: str
    description: str
    system_prompt: str
    task_prompt: str
    include_citations: bool
    datetime_aware: bool
    default_prompt: bool
    # Not including assistant info, not needed

    @classmethod
    def from_model(cls, prompt: Prompt) -> "PromptSnapshot":
        if prompt.deleted:
            raise ValueError("Prompt has been deleted")

        return PromptSnapshot(
            id=prompt.id,
            name=prompt.name,
            description=prompt.description,
            system_prompt=prompt.system_prompt,
            task_prompt=prompt.task_prompt,
            include_citations=prompt.include_citations,
            datetime_aware=prompt.datetime_aware,
            default_prompt=prompt.default_prompt,
        )
