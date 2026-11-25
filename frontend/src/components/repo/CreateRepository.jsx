import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateRepository.css";

const CreateRepository = () => {
  const navigate = useNavigate();

  const [repoName, setRepoName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateRepository = async (e) => {
    e.preventDefault();
    setError("");

    const userId = localStorage.getItem("userId");

    if (!userId) {
      navigate("/auth");
      return;
    }

    if (!repoName.trim()) {
      setError("Repository name is required");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("https://githubclone-backend-mppw.onrender.com/repo/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: repoName.trim(),
          description: description.trim(),
          visibility,
          owner: userId,
          content: [],
          issues: [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Repository creation failed");
      }

      alert("Repository created successfully!");

      setRepoName("");
      setDescription("");
      setVisibility(true);

      navigate("/");
    } catch (err) {
      console.error("Create repository error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-repo-page">
      <div className="create-repo-container">
        <div className="create-repo-header">
          <h1>Create a new repository</h1>
          <p>
            A repository contains all of your project's files and version
            history.
          </p>
        </div>

        <form onSubmit={handleCreateRepository}>
          <div className="repo-form-group">
            <label htmlFor="repoName">
              Repository name <span>*</span>
            </label>

            <input
              id="repoName"
              type="text"
              placeholder="my-awesome-project"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              required
            />

            <small>Great repository names are short and memorable.</small>
          </div>

          <div className="repo-form-group">
            <label htmlFor="description">Description</label>

            <textarea
              id="description"
              placeholder="Write a short description..."
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="repo-visibility-section">
            <h3>Choose visibility</h3>

            <label className="visibility-option">
              <input
                type="radio"
                name="visibility"
                checked={visibility === true}
                onChange={() => setVisibility(true)}
              />

              <div>
                <strong>Public</strong>
                <p>Anyone can see this repository.</p>
              </div>
            </label>

            <label className="visibility-option">
              <input
                type="radio"
                name="visibility"
                checked={visibility === false}
                onChange={() => setVisibility(false)}
              />

              <div>
                <strong>Private</strong>
                <p>Only you can access this repository.</p>
              </div>
            </label>
          </div>

          {error && <div className="repo-error">{error}</div>}

          <div className="repo-form-actions">
            <button
              type="button"
              className="repo-cancel-btn"
              onClick={() => navigate("/")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="repo-create-btn"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create repository"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRepository;
