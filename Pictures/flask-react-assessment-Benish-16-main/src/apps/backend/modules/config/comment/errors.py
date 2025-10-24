from modules.application.errors import AppError


class CommentBadRequestError(AppError):
    def __init__(self, message: str = "Bad request"):
        super().__init__(message=message, code="COMMENT_BAD_REQUEST", http_code=400)


class CommentNotFoundError(AppError):
    def __init__(self, message: str = "Comment not found"):
        super().__init__(message=message, code="COMMENT_NOT_FOUND", http_code=404)
