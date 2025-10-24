from typing import List, Optional
from dataclasses import asdict

from modules.comment.internal.store.comment_repository import CommentRepository
from modules.comment.internal.store.comment_model import CommentModel
from modules.comment.types import Comment, GetCommentsParams
from bson import ObjectId


class CommentReader:
    @staticmethod
    def _to_type(bson_doc: dict) -> Comment:
        model = CommentModel.from_bson(bson_doc)
        # model.id can be ObjectId — convert to str
        _id = model.id
        if isinstance(_id, ObjectId):
            _id = str(_id)
        return Comment(
            id=_id,
            account_id=model.account_id,
            task_id=model.task_id,
            author=model.author,
            body=model.body,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def get_comments(params: GetCommentsParams) -> List[Comment]:
        # support pagination if page/size passed
        skip = 0
        limit = 0
        if params.page and params.size:
            skip = (params.page - 1) * params.size
            limit = params.size

        docs = CommentRepository.find_by_task(task_id=params.task_id, account_id=params.account_id, skip=skip, limit=limit)
        return [CommentReader._to_type(d) for d in docs]

    @staticmethod
    def get_comment_by_id(account_id: str, task_id: str, comment_id: str) -> Optional[Comment]:
        doc = CommentRepository.find_one(comment_id=comment_id, task_id=task_id, account_id=account_id)
        if doc:
            return CommentReader._to_type(doc)
        return None
