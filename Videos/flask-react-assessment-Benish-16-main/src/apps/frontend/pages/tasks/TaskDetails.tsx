import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import TaskComments from "./TaskComments";




// Type for the route params
type TaskDetailsParams = {
  accountId: string;
  taskId: string;
};

// Type for a Task object
type Task = {
  description: string;
  id: string;
  title: string;
  
};

const TaskDetails: React.FC = () => {
  const { accountId, taskId } = useParams<TaskDetailsParams>();
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!accountId || !taskId) {
      setError(true);
      return;
    }

    fetch(`/api/accounts/${accountId}/tasks/${taskId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch task");
        return res.json();
      })
      .then((data: Task) => setTask(data))
      .catch(() => setError(true));
  }, [accountId, taskId]);

  if (error) return <div>Failed to load task or invalid URL</div>;
  if (!task) return <div>Loading...</div>;

  return (
    <div>
      <h2>{task.title}</h2>
      <p>{task.description}</p>
      <TaskComments accountId={accountId!} taskId={taskId!} />
    </div>
  );
};

export default TaskDetails;
