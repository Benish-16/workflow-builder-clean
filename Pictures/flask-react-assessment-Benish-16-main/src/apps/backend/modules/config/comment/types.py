from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List

from modules.application.common.types import PaginationParams, PaginationResult


@dataclass
class Comment:
    id: str
    account_id: str
    task_id: str
    author: str
    body: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class CreateCommentParams:
    account_id: str
    task_id: str
    author: str
    body: str


@dataclass
class UpdateCommentParams:
    account_id: str
    task_id: str
    comment_id: str
    author: Optional[str] = None
    body: Optional[str] = None


@dataclass
class GetCommentsParams:
    account_id: str
    task_id: str
    page: Optional[int] = None
    size: Optional[int] = None
