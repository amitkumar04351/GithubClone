import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";
import Navbar from "../Navbar";

const Dashboard = () => {
  const navigate = useNavigate();

  const [repositories, setRepositories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedRepositories, setSuggestedRepositories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [deletingRepo, setDeletingRepo] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    const fetchRepositories = async () => {
      if (!userId) {
        setRepositories([]);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/repo/user/${userId}`,
        );

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        const repos = Array.isArray(data)
          ? data
          : Array.isArray(data.repositories)
            ? data.repositories
            : [];

        setRepositories(repos);
      } catch (error) {
        console.error("Error fetching repositories:", error);
        setRepositories([]);
      }
    };

    const fetchSuggestedRepositories = async () => {
      try {
        const response = await fetch("http://localhost:3000/repo/all");

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        const repos = Array.isArray(data)
          ? data
          : Array.isArray(data.repositories)
            ? data.repositories
            : [];

        setSuggestedRepositories(repos);
      } catch (error) {
        console.error("Error fetching suggested repositories:", error);
        setSuggestedRepositories([]);
      }
    };

    fetchRepositories();
    fetchSuggestedRepositories();
  }, []);

  useEffect(() => {
    const filtered = repositories.filter((repo) =>
      (repo.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
    );

    setSearchResults(filtered);
  }, [searchQuery, repositories]);

  const handleOpenRepository = (repoId) => {
    navigate(`/repository/${repoId}`);
  };

  const handleViewIssues = (repoId) => {
    navigate(`/issues/${repoId}`);
  };

  // DELETE REPOSITORY FUNCTION
  const handleDeleteRepository = async (repoId, repoName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${repoName}"? This action cannot be undone.`,
    );

    if (!confirmDelete) return;

    setDeletingRepo(repoId);

    try {
      const response = await fetch(
        `http://localhost:3000/repo/delete/${repoId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Unable to delete repository",
        );
      }

      setRepositories((previous) =>
        previous.filter((repo) => repo._id !== repoId),
      );

      setSuggestedRepositories((previous) =>
        previous.filter((repo) => repo._id !== repoId),
      );

      alert("Repository deleted successfully!");
    } catch (error) {
      console.error("Delete repository error:", error);
      alert(error.message || "Failed to delete repository!");
    } finally {
      setDeletingRepo(null);
    }
  };

  return (
    <>
      <Navbar />

      <section id="dashboard">
        <aside>
          <h3>Suggested Repositories</h3>
          <ul>
            {suggestedRepositories.length > 0 ? (
              suggestedRepositories.map((repo) => (
                <li key={repo._id}>
                  <div>
                    <h4>{repo.name}</h4>
                    <p>{repo.description || "No description available"}</p>
                  </div>
                </li>
              ))
            ) : (
              <p>No suggested repositories found.</p>
            )}
          </ul>
        </aside>

        <main>
          <h2>Your Repositories</h2>

          <div id="search">
            <input
              type="text"
              value={searchQuery}
              placeholder="Search repositories..."
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <ul>
            {searchResults.length > 0 ? (
              searchResults.map((repo) => (
                <li key={repo._id}>
                  <div>
                    <h4>{repo.name}</h4>
                    <p>{repo.description || "No description available"}</p>

                    <button
                      type="button"
                      className="view-issues-btn"
                      onClick={() => handleOpenRepository(repo._id)}
                    >
                      Open Repository
                    </button>

                    <button
                      type="button"
                      className="view-issues-btn"
                      style={{ marginLeft: "15px" }}
                      onClick={() => handleViewIssues(repo._id)}
                    >
                      View Issues
                    </button>

                    <button
                      type="button"
                      disabled={deletingRepo === repo._id}
                      onClick={() =>
                        handleDeleteRepository(repo._id, repo.name)
                      }
                      style={{
                        marginTop: "12px",
                        marginLeft: "15px",
                        padding: "9px 18px",
                        backgroundColor: "#da3633",
                        color: "#ffffff",
                        border: "1px solid #da3633",
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: "500",
                        cursor: "pointer",
                      }}
                    >
                      {deletingRepo === repo._id
                        ? "Deleting..."
                        : "Delete Repository"}
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <p>
                {searchQuery
                  ? "No repositories match your search."
                  : "You haven't created any repositories yet."}
              </p>
            )}
          </ul>
        </main>

        <aside>
          <h3>Upcoming Events</h3>
          <ul>
            <li>
              <p>Tech Conference - Dec 15</p>
            </li>
            <li>
              <p>Developer Meetup - Dec 25</p>
            </li>
            <li>
              <p>React Summit - Jan 5</p>
            </li>
          </ul>
        </aside>
      </section>
    </>
  );
};

export default Dashboard;
