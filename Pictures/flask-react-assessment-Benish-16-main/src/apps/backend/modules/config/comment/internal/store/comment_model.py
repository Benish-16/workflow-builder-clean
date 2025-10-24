from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from bson import ObjectId

from modules.application.base_model import BaseModel


@dataclass
class CommentModel(BaseModel):
    id: Optional[str] = None            # <- added id field
    account_id: str = ""
    task_id: str = ""
    author: str = ""
    body: str = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @classmethod
    def from_bson(cls, bson_data: dict) -> "CommentModel":
        # Convert ObjectId to str if necessary
        _id = bson_data.get("_id")
        if isinstance(_id, ObjectId):
            _id = str(_id)

        return cls(
            id=_id,
            account_id=bson_data.get("account_id", ""),
            task_id=bson_data.get("task_id", ""),
            author=bson_data.get("author", ""),
            body=bson_data.get("body", ""),
            created_at=bson_data.get("created_at") or datetime.utcnow(),
            updated_at=bson_data.get("updated_at") or datetime.utcnow(),
        )

    @staticmethod
    def get_collection_name() -> str:
        return "comments"
