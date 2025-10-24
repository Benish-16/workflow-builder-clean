from flask import Blueprint
from modules.comment.rest_api.comment_view import CommentView


class CommentRouter:
    @staticmethod
    def create_route(*, blueprint: Blueprint) -> Blueprint:
        # collection-level: list and create
        blueprint.add_url_rule(
            "/accounts/<account_id>/tasks/<task_id>/comments",
            view_func=CommentView.as_view("comment_collection"),
            methods=["GET", "POST"],
        )
        # item-level: get, patch, delete
        blueprint.add_url_rule(
            "/accounts/<account_id>/tasks/<task_id>/comments/<comment_id>",
            view_func=CommentView.as_view("comment_item"),
            methods=["GET", "PATCH", "DELETE"],
        )
        return blueprint
