from dataclasses import asdict
from typing import Optional

from flask import jsonify, request
from flask.views import MethodView
from flask.typing import ResponseReturnValue

from modules.application.common.constants import DEFAULT_PAGINATION_PARAMS
from modules.application.common.types import PaginationParams
from modules.authentication.rest_api.access_auth_middleware import access_auth_middleware
from modules.comment.comment_service import CommentService
from modules.comment.types import CreateCommentParams, UpdateCommentParams, GetCommentsParams
from modules.comment.errors import CommentBadRequestError, CommentNotFoundError


class CommentView(MethodView):
    @access_auth_middleware
    def get(self, account_id: str, task_id: str, comment_id: Optional[str] = None) -> ResponseReturnValue:
        if comment_id:
            comment = CommentService.get_comment(account_id=account_id, task_id=task_id, comment_id=comment_id)
            if not comment:
                raise CommentNotFoundError()
            return jsonify(asdict(comment)), 200
        else:
            page = request.args.get("page", type=int)
            size = request.args.get("size", type=int)
            params = GetCommentsParams(account_id=account_id, task_id=task_id, page=page, size=size)
            comments = CommentService.get_comments(params=params)
            return jsonify([asdict(c) for c in comments]), 200

    @access_auth_middleware
    def post(self, account_id: str, task_id: str) -> ResponseReturnValue:
        data = request.get_json() or {}
        author = data.get("author")
        body = data.get("body")
        if not author or not body:
            raise CommentBadRequestError("author and body are required")
        params = CreateCommentParams(account_id=account_id, task_id=task_id, author=author, body=body)
        comment = CommentService.create_comment(params=params)
        return jsonify(asdict(comment)), 201

    @access_auth_middleware
    def patch(self, account_id: str, task_id: str, comment_id: str) -> ResponseReturnValue:
        data = request.get_json() or {}
        if not data:
            raise CommentBadRequestError("nothing to update")
        params = UpdateCommentParams(
            account_id=account_id,
            task_id=task_id,
            comment_id=comment_id,
            author=data.get("author"),
            body=data.get("body"),
        )
        updated = CommentService.update_comment(params=params)
        if not updated:
            raise CommentNotFoundError()
        return jsonify(asdict(updated)), 200

    @access_auth_middleware
    def delete(self, account_id: str, task_id: str, comment_id: str) -> ResponseReturnValue:
        deleted = CommentService.delete_comment(comment_id=comment_id)
        if not deleted:
            raise CommentNotFoundError()
        return jsonify({"message": "deleted"}), 200
