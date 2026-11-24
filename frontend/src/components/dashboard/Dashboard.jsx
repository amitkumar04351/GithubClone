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

  // Fetch repositories
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

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        console.log("User repositories API response:", data);

        const repos = Array.isArray(data)
          ? data
          : Array.isArray(data.repositories)
            ? data.repositories
            : [];

        setRepositories(repos);
      } catch (err) {
        console.error("Error while fetching repositories:", err);
        setRepositories([]);
      }
    };

    const fetchSuggestedRepositories = async () => {
      try {
        const response = await fetch("http://localhost:3000/repo/all");

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        console.log("Suggested repositories API response:", data);

        const repos = Array.isArray(data)
          ? data
          : Array.isArray(data.repositories)
            ? data.repositories
            : [];

        setSuggestedRepositories(repos);
      } catch (err) {
        console.error("Error while fetching suggested repositories:", err);
        setSuggestedRepositories([]);
      }
    };

    fetchRepositories();
    fetchSuggestedRepositories();
  }, []);

  // Search repositories
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults(repositories);
    } else {
      const filteredRepo = repositories.filter((repo) =>
        (repo.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
      );

      setSearchResults(filteredRepo);
    }
  }, [searchQuery, repositories]);

  // Open Issues page
  const handleViewIssues = (repoId) => {
    navigate(`/issues/${repoId}`);
  };

  return (
    <>
      <Navbar />

      <section id="dashboard">
        {/* Suggested Repositories */}
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

        {/* Your Repositories */}
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
                      className="view-issues-btn"
                      onClick={() => handleViewIssues(repo._id)}
                    >
                      View Issues
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

        {/* Upcoming Events */}
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
