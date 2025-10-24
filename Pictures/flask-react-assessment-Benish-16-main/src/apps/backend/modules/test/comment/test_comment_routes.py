import json
import pytest
from modules.comment.types import Comment, CreateCommentParams
from datetime import datetime

from modules.comment import comment_service  # used for monkeypatch target module


def test_get_comments_route(monkeypatch, client):
    sample = [
        Comment(id="c1", account_id="acc1", task_id="t1", author="A", body="hi", created_at=datetime.utcnow())
    ]
    def fake_get_comments(params):
        return sample

    monkeypatch.setattr("modules.comment.comment_service.CommentService.get_comments", staticmethod(fake_get_comments))
    resp = client.get("/api/accounts/acc1/tasks/t1/comments")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert data[0]["author"] == "A"


def test_create_comment_route(monkeypatch, client):
    created = Comment(id="c2", account_id="acc1", task_id="t1", author="Bob", body="hello", created_at=datetime.utcnow())

    def fake_create(params):
        return created

    monkeypatch.setattr("modules.comment.comment_service.CommentService.create_comment", staticmethod(fake_create))
    resp = client.post("/api/accounts/acc1/tasks/t1/comments", json={"author": "Bob", "body": "hello"})
    assert resp.status_code == 201
    d = resp.get_json()
    assert d["author"] == "Bob"


def test_update_comment_route(monkeypatch, client):
    updated = Comment(id="c3", account_id="acc1", task_id="t1", author="X", body="new", created_at=datetime.utcnow())
    def fake_update(params):
        return updated

    monkeypatch.setattr("modules.comment.comment_service.CommentService.update_comment", staticmethod(fake_update))
    resp = client.patch("/api/accounts/acc1/tasks/t1/comments/c3", json={"body": "new"})
    assert resp.status_code == 200
    d = resp.get_json()
    assert d["body"] == "new"


def test_delete_comment_route(monkeypatch, client):
    def fake_delete(comment_id):
        return True

    monkeypatch.setattr("modules.comment.comment_service.CommentService.delete_comment", staticmethod(fake_delete))
    resp = client.delete("/api/accounts/acc1/tasks/t1/comments/c3")
    assert resp.status_code == 200
    assert resp.get_json()["message"] == "deleted"
