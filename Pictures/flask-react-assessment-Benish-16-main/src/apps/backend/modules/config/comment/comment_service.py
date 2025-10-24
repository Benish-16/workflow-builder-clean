from typing import List, Optional
from modules.comment.internal.comment_reader import CommentReader
from modules.comment.internal.comment_writer import CommentWriter
from modules.comment.types import CreateCommentParams, UpdateCommentParams, GetCommentsParams, Comment


class CommentService:
    @staticmethod
    def get_comments(params: GetCommentsParams) -> List[Comment]:
        return CommentReader.get_comments(params=params)

    @staticmethod
    def get_comment(account_id: str, task_id: str, comment_id: str) -> Optional[Comment]:
        return CommentReader.get_comment_by_id(account_id=account_id, task_id=task_id, comment_id=comment_id)

    @staticmethod
    def create_comment(params: CreateCommentParams) -> Comment:
        saved_doc = CommentWriter.create_comment(params=params)
        return CommentReader._to_type(saved_doc)

    @staticmethod
    def update_comment(params: UpdateCommentParams) -> Optional[Comment]:
        updated_doc = CommentWriter.update_comment(params=params)
        if updated_doc:
            return CommentReader._to_type(updated_doc)
        return None

    @staticmethod
    def delete_comment(comment_id: str) -> bool:
        return CommentWriter.delete_comment(comment_id=comment_id)
