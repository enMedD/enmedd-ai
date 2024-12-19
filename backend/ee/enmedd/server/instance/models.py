from pydantic import BaseModel


class RenameSchemaRequest(BaseModel):
    schema_name: str
    renamed_schema: str
