const express = require("express");
const cors = require("cors");
const pool = require("./db");
const app = express();
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS current_time"
    );
    res.json({
      message: "PostgreSQL connected successfully",
      time: result.rows[0].current_time,
    });
  } catch (error) {
    console.error("Database query failed:", error.message);
    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

app.get("/api/tasks", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * from tasks_list"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching tasks:", error.message);
    res.status(500).json({
      message: "Failed to fetch tasks",
    });
  }
});

app.post("/api/addTasks", async (req, res) => {
  try {
    const { value } = req.body;
    const result = await pool.query(
      "INSERT INTO tasks_list (name) VALUES ($1) RETURNING *",
      [value]
    );
    res.json({
      message: "Task added successfully",
      task: result.rows[0],
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: "Failed to add task",
    });
  }
});

app.put("/api/updateTasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { value } = req.body;

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    if (typeof value !== "string" || !value.trim()) {
      return res.status(400).json({
        message: "Task name is required",
      });
    }

    const result = await pool.query(
      "UPDATE tasks_list SET name = $1 WHERE id = $2 RETURNING *",
      [value.trim(), id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.json({
      message: "Task updated successfully",
      task: result.rows[0],
    });
  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      message: "Failed to update task",
    });
  }
});

app.delete("/api/deleteTasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const result = await pool.query(
      "DELETE FROM tasks_list WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Failed to delete task" });
  }
});

app.put("/api/completeTasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { completed } = req.body;
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }
    if (typeof completed !== "boolean") {
      return res.status(400).json({
        message: "Completed must be true or false",
      });
    }
    const result = await pool.query(
      "UPDATE tasks_list SET completed = $1 WHERE id = $2 RETURNING *",
      [completed, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Task not found",
      });
    }
    res.json({
      message: "Task status updated successfully",
      task: result.rows[0],
    });
  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      message: "Failed to update task status",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});