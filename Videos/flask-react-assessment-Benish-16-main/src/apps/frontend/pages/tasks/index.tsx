import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Save, X, MessageCircle } from "lucide-react";
import { authFetch } from "frontend/utils/authFetch";
import { getAccessTokenFromStorage } from "frontend/utils/storage-util";
import TaskComments from "./TaskComments";

type Task = {
  description: string;
  id: string;
  title: string;
};

type TasksApiResponse = {
  items: Task[];
  total?: number;
  page?: number;
  size?: number;
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const tokenObj = getAccessTokenFromStorage();
  const accountId = tokenObj?.accountId;

  // Early return if accountId is missing
  if (!accountId) {
    return (
      <div className="text-red-600 text-center mt-10">
        Invalid account ID
      </div>
    );
  }

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await authFetch(`/api/accounts/${accountId}/tasks`);
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const json: unknown = await res.json();

        if (
          json &&
          typeof json === "object" &&
          "items" in json &&
          Array.isArray((json as TasksApiResponse).items)
        ) {
          setTasks((json as TasksApiResponse).items);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError(true);
      }
    };
    fetchTasks().catch((err) => console.error("Unhandled error:", err));
  }, [accountId]);

  if (error)
    return (
      <div className="text-red-600 text-center mt-10">
        Invalid URL or failed to load tasks.
      </div>
    );

  // ---------------- Handlers ----------------
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch(`/api/accounts/${accountId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleInput, description: descriptionInput }),
      });
      if (!res.ok) throw new Error("Failed to add task");
      const json = await res.json();
      setTasks((prev) => [json, ...prev]);
      setTitleInput("");
      setDescriptionInput("");
      setAdding(false);
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await authFetch(`/api/accounts/${accountId}/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task");
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setTitleInput(task.title);
    setDescriptionInput(task.description);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTaskId) return;
    try {
      const res = await authFetch(`/api/accounts/${accountId}/tasks/${editingTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleInput, description: descriptionInput }),
      });
      if (!res.ok) throw new Error("Failed to update task");
      const updatedTask = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === editingTaskId ? updatedTask : t)));
      setEditingTaskId(null);
      setTitleInput("");
      setDescriptionInput("");
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-lg mt-10">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
        Task Manager
      </h2>

      {/* Add / Edit Form */}
      {(adding || editingTaskId) && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={editingTaskId ? handleUpdateTask : handleAddTask}
          className="flex flex-col gap-3 mb-6"
        >
          <input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="Task Title"
            required
            className="border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            value={descriptionInput}
            onChange={(e) => setDescriptionInput(e.target.value)}
            placeholder="Task Description"
            required
            className="border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow"
            >
              <Save size={18} />
              {editingTaskId ? "Update" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setEditingTaskId(null);
                setTitleInput("");
                setDescriptionInput("");
              }}
              className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
            >
              <X size={18} />
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      {/* Add Task Button */}
      {!adding && !editingTaskId && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition"
          >
            <Plus size={18} />
            Add Task
          </button>
        </div>
      )}

      {/* Task List */}
      {tasks.length === 0 ? (
        <p className="text-center text-gray-500">No tasks found.</p>
      ) : (
        <ul className="space-y-4">
          {tasks.map((task) => (
            <motion.li
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <Link
                    to={`/accounts/${accountId}/tasks/${task.id}`}
                    className="text-lg font-semibold text-indigo-700 hover:underline"
                  >
                    {task.title}
                  </Link>
                  <p className="text-gray-600 mt-1">{task.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditTask(task)}
                    className="p-2 rounded-lg hover:bg-indigo-100 text-indigo-600 transition"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={() =>
                      setExpandedTaskId(expandedTaskId === task.id ? null : task.id)
                    }
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
                    title="Comments"
                  >
                    <MessageCircle size={18} />
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {expandedTaskId === task.id && (
                <div className="mt-4 border-t pt-3">
                  <TaskComments accountId={accountId} taskId={task.id} />
                </div>
              )}
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
