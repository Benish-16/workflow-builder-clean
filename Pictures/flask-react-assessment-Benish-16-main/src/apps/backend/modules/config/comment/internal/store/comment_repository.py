from pymongo import MongoClient, ReturnDocument
from pymongo.collection import Collection
from pymongo.errors import OperationFailure
from bson import ObjectId
from datetime import datetime

from modules.application.repository import ApplicationRepository
from modules.comment.internal.store.comment_model import CommentModel
from modules.logger.logger import Logger


COMMENT_VALIDATION_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["account_id", "task_id", "author", "body", "created_at", "updated_at"],
        "properties": {
            "account_id": {"bsonType": "string"},
            "task_id": {"bsonType": "string"},
            "author": {"bsonType": "string"},
            "body": {"bsonType": "string"},
            "created_at": {"bsonType": "date"},
            "updated_at": {"bsonType": "date"},
        },
    }
}


class ApplicationRepository:
    collection_name: str = ""

    _client: MongoClient = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            cls._client = MongoClient("mongodb://localhost:27017")  # Change URI if needed
        return cls._client

    @classmethod
    def get_collection(cls) -> Collection:
        if not cls.collection_name:
            raise ValueError("collection_name not defined for repository")
        client = cls.get_client()
        db = client["my_database_name"]  # Replace with your DB name
        return db[cls.collection_name]


class CommentRepository(ApplicationRepository):
    collection_name = CommentModel.get_collection_name()

    @classmethod
    def on_init_collection(cls):
        collection = cls.get_collection()
        cmd = {
            "collMod": cls.collection_name,
            "validator": COMMENT_VALIDATION_SCHEMA,
            "validationLevel": "strict",
        }
        try:
            collection.database.command(cmd)
        except OperationFailure as e:
            if e.code == 26:  # collection does not exist
                collection.database.create_collection(cls.collection_name, validator=COMMENT_VALIDATION_SCHEMA)
                Logger.info(f"Collection '{cls.collection_name}' created with validation schema.")
            else:
                Logger.error(f"OperationFailure for collection '{cls.collection_name}': {getattr(e, 'details', str(e))}")
        return True

    @classmethod
    def insert_one(cls, doc: dict):
        col = cls.get_collection()
        now = datetime.utcnow()
        doc.setdefault("created_at", now)
        doc.setdefault("updated_at", now)
        return col.insert_one(doc)

    @classmethod
    def find_by_task(cls, task_id: str, account_id: str, skip: int = 0, limit: int = 0):
        col = cls.get_collection()
        query = {"task_id": task_id, "account_id": account_id}
        cursor = col.find(query).sort("created_at", -1).skip(skip)
        if limit:
            cursor = cursor.limit(limit)
        return list(cursor)

    @classmethod
    def find_one(cls, comment_id: str, task_id: str, account_id: str):
        col = cls.get_collection()
        _id = ObjectId(comment_id) if ObjectId.is_valid(comment_id) else comment_id
        query = {"_id": _id, "task_id": task_id, "account_id": account_id}
        return col.find_one(query)

    @classmethod
    def update_one(cls, comment_id: str, update_doc: dict):
        col = cls.get_collection()
        _id = ObjectId(comment_id) if ObjectId.is_valid(comment_id) else comment_id
        update_doc["updated_at"] = datetime.utcnow()
        return col.find_one_and_update(
            {"_id": _id},
            {"$set": update_doc},
            return_document=ReturnDocument.AFTER
        )

    @classmethod
    def delete_one(cls, comment_id: str):
        col = cls.get_collection()
        _id = ObjectId(comment_id) if ObjectId.is_valid(comment_id) else comment_id
        return col.delete_one({"_id": _id})
