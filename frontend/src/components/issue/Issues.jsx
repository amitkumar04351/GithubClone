
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./issues.css";

const API = "http://localhost:3000";

const Issues = () => {
  const { repoId } = useParams();
  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchIssues = async () => {
    try {
      const response = await fetch(
        `${API}/issue/all/${repoId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to fetch issues");
      }

      setIssues(Array.isArray(data.issues) ? data.issues : []);
    } catch (err) {
      console.error("Fetch issues error:", err);
      setError(err.message);
      setIssues([]);
    }
  };

  useEffect(() => {
    if (repoId) fetchIssues();
  }, [repoId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !description.trim()) {
      setError("Please enter title and description.");
      return;
    }

    try {
      setLoading(true);

      const url = editingId
        ? `${API}/issue/update/${editingId}`
        : `${API}/issue/create/${repoId}`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setTitle("");
      setDescription("");
      setEditingId(null);

      await fetchIssues();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (issue) => {
    setEditingId(issue._id);
    setTitle(issue.title);
    setDescription(issue.description);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleStatus = async (issue) => {
    try {
      const newStatus =
        issue.status === "open" ? "closed" : "open";

      const response = await fetch(
        `${API}/issue/update/${issue._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Status update failed");
      }

      await fetchIssues();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this issue?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${API}/issue/delete/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Delete failed");
      }

      await fetchIssues();
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setError("");
  };

  const openIssues = issues.filter(
    (issue) => issue.status === "open"
  );

  const closedIssues = issues.filter(
    (issue) => issue.status === "closed"
  );

  return (
    <div className="issues-page">
      <div className="issues-container">

        <header className="issues-header">
          <div>
            <h1>Issues</h1>
            <p>Manage and track your repository issues.</p>
          </div>

          <button
            className="issues-back-btn"
            onClick={() => navigate("/")}
          >
            Back to Dashboard
          </button>
        </header>

        <section className="issue-form-card">
          <h2>
            {editingId ? "Edit Issue" : "Create a New Issue"}
          </h2>

          <form onSubmit={handleSubmit}>
            <label>Issue Title</label>

            <input
              type="text"
              placeholder="Enter issue title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <label>Description</label>

            <textarea
              rows="4"
              placeholder="Describe the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            {error && (
              <p className="issue-error">{error}</p>
            )}

            <div className="issue-form-actions">
              {editingId && (
                <button
                  type="button"
                  className="issue-cancel-btn"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                className="issue-submit-btn"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : editingId
                  ? "Update Issue"
                  : "Submit New Issue"}
              </button>
            </div>
          </form>
        </section>

        <div className="issues-summary">
          <span className="open-count">
            {openIssues.length} Open
          </span>

          <span className="closed-count">
            {closedIssues.length} Closed
          </span>
        </div>

        <section className="issues-list">
          <h2>All Issues ({issues.length})</h2>

          {issues.length === 0 ? (
            <div className="no-issues">
              <h3>No issues found</h3>
              <p>Create your first issue using the form above.</p>
            </div>
          ) : (
            issues.map((issue) => (
              <article className="issue-card" key={issue._id}>
                <div className="issue-card-content">
                  <div className="issue-title-row">
                    <h3>{issue.title}</h3>

                    <span
                      className={`issue-status ${
                        issue.status === "open"
                          ? "status-open"
                          : "status-closed"
                      }`}
                    >
                      {issue.status}
                    </span>
                  </div>

                  <p>{issue.description}</p>

                  <small>
                    Issue ID: {issue._id}
                  </small>
                </div>

                <div className="issue-card-actions">
                  <button
                    onClick={() => handleStatus(issue)}
                    className="issue-status-btn"
                  >
                    {issue.status === "open"
                      ? "Close"
                      : "Reopen"}
                  </button>

                  <button
                    onClick={() => handleEdit(issue)}
                    className="issue-edit-btn"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(issue._id)}
                    className="issue-delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </section>

      </div>
    </div>
  );
};

export default Issues;
