from datetime import datetime
from typing import Optional

from bson import ObjectId
from modules.comment.internal.store.comment_repository import CommentRepository
from modules.comment.internal.store.comment_model import CommentModel
from modules.comment.types import CreateCommentParams, UpdateCommentParams
from modules.comment.errors import CommentBadRequestError  # ← added import


class CommentWriter:
    @staticmethod
    def create_comment(params: CreateCommentParams) -> dict:
        now = datetime.utcnow()
        doc = {
            "account_id": params.account_id,
            "task_id": params.task_id,
            "author": params.author,
            "body": params.body,
            "created_at": now,
            "updated_at": now,
        }
        res = CommentRepository.insert_one(doc)

        # return saved doc with _id
        saved = CommentRepository.find_one(
            str(res.inserted_id),
            task_id=params.task_id,
            account_id=params.account_id
        )
        if not saved:
            raise CommentBadRequestError("Failed to save comment")
        return saved

    @staticmethod
    def update_comment(params: UpdateCommentParams) -> Optional[dict]:
        update_doc = {}
        if params.author is not None:
            update_doc["author"] = params.author
        if params.body is not None:
            update_doc["body"] = params.body
        if not update_doc:
            return None
        update_doc["updated_at"] = datetime.utcnow()
        updated = CommentRepository.update_one(
            comment_id=params.comment_id,
            update_doc=update_doc
        )
        return updated

    @staticmethod
    def delete_comment(comment_id: str) -> bool:
        res = CommentRepository.delete_one(comment_id=comment_id)
        return getattr(res, "deleted_count", 0) > 0

