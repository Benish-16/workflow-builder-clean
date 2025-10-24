import React, { useEffect, useState, useRef } from "react";
import { authFetch } from "frontend/utils/authFetch";
import { FaTrash, FaEdit } from "react-icons/fa"; // removed FaSave, FaTimes

type Comment = {
  id: string;
  author: string;
  body: string;
};

type Props = {
  accountId: string;
  taskId: string;
};

export default function TaskComments({ accountId, taskId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editBody, setEditBody] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmEditId, setConfirmEditId] = useState<string | null>(null);

  const commentsRef = useRef(comments);
  commentsRef.current = comments;

  const base = "http://localhost:5000/api";

  const fetchComments = async () => {
    try {
      const res = await authFetch(`${base}/accounts/${accountId}/tasks/${taskId}/comments`);
      if (!res.ok) throw new Error(`Failed to fetch comments: ${res.status}`);
      const data: Comment[] = await res.json();
      setComments(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId && taskId) fetchComments();
    const interval = setInterval(fetchComments, 5000);
    return () => clearInterval(interval);
  }, [accountId, taskId]);

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !body.trim()) return;
    setError(null);

    const tempComment: Comment = { id: `temp-${Date.now()}`, author, body };
    setComments([tempComment, ...commentsRef.current]);

    try {
      const res = await authFetch(`${base}/accounts/${accountId}/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, body }),
      });
      if (!res.ok) throw new Error(`Failed to add comment: ${res.status}`);
      const newComment: Comment = await res.json();
      setComments((prev) => prev.map((c) => (c.id === tempComment.id ? newComment : c)));
      setAuthor("");
      setBody("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unknown error");
      setComments((prev) => prev.filter((c) => c.id !== tempComment.id));
    }
  };

  const deleteComment = async (id: string) => {
    const original = commentsRef.current;
    setComments((prev) => prev.filter((c) => c.id !== id));
    setConfirmDeleteId(null);

    try {
      const res = await authFetch(`${base}/accounts/${accountId}/tasks/${taskId}/comments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Failed to delete comment: ${res.status}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unknown error");
      setComments(original);
    }
  };

  const startEdit = (comment: Comment) => {
    setConfirmEditId(comment.id);
    setEditBody(comment.body);
  };

  const cancelEdit = () => {
    setEditBody("");
    setConfirmEditId(null);
  };

  const saveEdit = async (id: string) => {
    if (!editBody.trim()) return;
    const original = commentsRef.current;
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, body: editBody } : c)));
    setConfirmEditId(null);

    try {
      const res = await authFetch(`${base}/accounts/${accountId}/tasks/${taskId}/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editBody }),
      });
      if (!res.ok) throw new Error(`Failed to update comment: ${res.status}`);
      const updatedComment: Comment = await res.json();
      setComments((prev) => prev.map((c) => (c.id === id ? updatedComment : c)));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unknown error");
      setComments(original);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-5 w-full max-w-xl mx-auto">
      <h4 className="font-semibold mb-4 text-gray-800 text-lg">Comments</h4>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <form onSubmit={addComment} className="flex flex-col gap-3 mb-5">
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Your name"
          required
          className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment..."
          required
          className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" className="self-end bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md transition">
          Add Comment
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-gray-500 text-sm">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-gray-800">{c.author}</p>
                <p className="text-gray-700 mt-1">{c.body}</p>
              </div>
              <div className="flex gap-2 ml-3 mt-1">
                <button onClick={() => startEdit(c)} className="text-indigo-500 hover:text-indigo-700"><FaEdit /></button>
                <button onClick={() => setConfirmDeleteId(c.id)} className="text-red-500 hover:text-red-700"><FaTrash /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[600px] max-w-full">
            <h3 className="font-semibold text-lg mb-4">Confirm Delete</h3>
            <p className="mb-4 text-gray-700">Are you sure you want to delete this comment?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
              <button onClick={() => deleteComment(confirmDeleteId)} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit confirmation modal */}
      {confirmEditId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xlshadow-lg w-[600px] max-w-full">
            <h3 className="font-semibold text-lg mb-4">Edit Comment</h3>
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full border px-2 py-1 mb-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-3">
              <button onClick={cancelEdit} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
              <button onClick={() => saveEdit(confirmEditId)} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
