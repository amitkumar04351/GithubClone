
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./profile.css";
import Navbar from "../Navbar";
import { UnderlineNav } from "@primer/react";
import { BookIcon, RepoIcon } from "@primer/octicons-react";
import HeatMapProfile from "./HeatMap";
import { useAuth } from "../../authContext";

const Profile = () => {
  const navigate = useNavigate();

  const [userDetails, setUserDetails] = useState({
    username: "username",
  });

  const [repositories, setRepositories] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issueLoading, setIssueLoading] = useState(true);

  const { setCurrentUser } = useAuth();

  // Fetch user and repositories
  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      setLoading(false);
      setIssueLoading(false);
      return;
    }

    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(
          `https://githubclone-backend-mppw.onrender.com/userProfile/${userId}`
        );

        const userData = response.data.user || response.data;
        setUserDetails(userData);
      } catch (err) {
        console.error("Cannot fetch user details:", err);
      }
    };

    const fetchRepositories = async () => {
      try {
        const response = await axios.get(
          `https://githubclone-backend-mppw.onrender.com/repo/user/${userId}`
        );

        const data = response.data;

        const repos = Array.isArray(data)
          ? data
          : Array.isArray(data.repositories)
          ? data.repositories
          : [];

        setRepositories(repos);
      } catch (err) {
        console.error("Cannot fetch repositories:", err);
        setRepositories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
    fetchRepositories();
  }, []);

  // Fetch issues from all user repositories
  useEffect(() => {
    const fetchIssues = async () => {
      if (repositories.length === 0) {
        setIssues([]);
        setIssueLoading(false);
        return;
      }

      setIssueLoading(true);

      try {
        const results = await Promise.all(
          repositories.map(async (repo) => {
            try {
              const response = await axios.get(
                `https://githubclone-backend-mppw.onrender.com/issue/all/${repo._id}`
              );

              const repoIssues = Array.isArray(response.data.issues)
                ? response.data.issues
                : [];

              return repoIssues.map((issue) => ({
                ...issue,
                repositoryName: repo.name,
                repositoryId: repo._id,
              }));
            } catch (err) {
              console.error(
                `Cannot fetch issues for ${repo.name}:`,
                err
              );
              return [];
            }
          })
        );

        setIssues(results.flat());
      } catch (err) {
        console.error("Cannot fetch issues:", err);
        setIssues([]);
      } finally {
        setIssueLoading(false);
      }
    };

    fetchIssues();
  }, [repositories]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setCurrentUser(null);
    window.location.href = "/auth";
  };

  return (
    <>
      <Navbar />

      {/* Profile Navigation */}
      <UnderlineNav aria-label="Repository">
        <UnderlineNav.Item
          aria-current="page"
          icon={BookIcon}
          sx={{
            backgroundColor: "transparent",
            color: "white",
            "&:hover": {
              textDecoration: "underline",
              color: "white",
            },
          }}
        >
          Overview
        </UnderlineNav.Item>

        <UnderlineNav.Item
          onClick={() => navigate("/repo")}
          icon={RepoIcon}
          sx={{
            backgroundColor: "transparent",
            color: "whitesmoke",
            "&:hover": {
              textDecoration: "underline",
              color: "white",
            },
          }}
        >
          Starred Repositories
        </UnderlineNav.Item>
      </UnderlineNav>

      {/* Logout */}
      <button id="logout" onClick={handleLogout}>
        Logout
      </button>

      <div className="profile-page-wrapper">

        {/* Profile Sidebar */}
        <div className="user-profile-section">

          <div className="profile-image">
            <span>👤</span>
          </div>

          <div className="name">
            <h3>
              {userDetails.username || "Username"}
            </h3>
          </div>

          <p className="profile-user-id">
            {userDetails.email || ""}
          </p>

          <button className="follow-btn">
            Follow
          </button>

          <div className="follower">
            <p><strong>10</strong> Followers</p>
            <p><strong>3</strong> Following</p>
          </div>

        </div>

        {/* Main Profile Content */}
        <div className="profile-main-section">

          {/* Heatmap */}
          <div className="heat-map-section">
            <HeatMapProfile />
          </div>

          {/* Repositories */}
          <div className="profile-repositories">

            <div className="repositories-heading">
              <h2>Your Repositories</h2>
              <span>{repositories.length}</span>
            </div>

            {loading ? (
              <p className="repo-message">
                Loading repositories...
              </p>
            ) : repositories.length > 0 ? (
              repositories.map((repo) => (
                <div
                  className="profile-repo-card"
                  key={repo._id}
                >
                  <div className="repo-card-header">
                    <h3>{repo.name}</h3>

                    <span className="repo-visibility">
                      {repo.visibility === false ||
                      repo.visibility === "private"
                        ? "Private"
                        : "Public"}
                    </span>
                  </div>

                  <p>
                    {repo.description ||
                      "No description provided."}
                  </p>

                  <div className="repo-card-footer">
                    <span>
                      <span className="repo-dot"></span>
                      Repository
                    </span>

                    <button
                      className="profile-view-issues-btn"
                      onClick={() =>
                        navigate(`/issues/${repo._id}`)
                      }
                    >
                      View Issues
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="repo-message">
                You haven't created any repositories yet.
              </p>
            )}

          </div>

          {/* Issues */}
          <div className="profile-issues">

            <div className="issues-heading">
              <h2>Your Issues</h2>
              <span>{issues.length}</span>
            </div>

            {issueLoading ? (
              <p className="repo-message">
                Loading issues...
              </p>
            ) : issues.length > 0 ? (
              issues.map((issue) => (
                <div
                  className="profile-issue-card"
                  key={issue._id}
                >
                  <div className="issue-card-header">
                    <h3>{issue.title}</h3>

                    <span
                      className={
                        issue.status === "closed"
                          ? "issue-status closed"
                          : "issue-status open"
                      }
                    >
                      {issue.status || "open"}
                    </span>
                  </div>

                  <p>
                    {issue.description ||
                      "No description provided."}
                  </p>

                  <div className="issue-repo-name">
                    Repository: {issue.repositoryName}
                  </div>

                  <button
                    className="profile-view-issues-btn"
                    onClick={() =>
                      navigate(
                        `/issues/${issue.repositoryId}`
                      )
                    }
                  >
                    View Repository Issues
                  </button>
                </div>
              ))
            ) : (
              <p className="repo-message">
                No issues found in your repositories.
              </p>
            )}

          </div>

        </div>
      </div>
    </>
  );
};

export default Profile;
