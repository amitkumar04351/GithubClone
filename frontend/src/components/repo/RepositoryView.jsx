import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import "../dashboard/dashboard.css";

const RepositoryView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [repository, setRepository] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    const fetchRepository = async () => {
      try {
        const response = await fetch(`https://githubclone-backend-mppw.onrender.com/repo/${id}`);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Repository not found");
        }

        setRepository(data.repository || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRepository();
  }, [id]);

  const handleFileClick = async (file) => {
    setSelectedFile(file);
    setFileContent("");
    setFileError("");
    setFileLoading(true);

    try {
      const response = await fetch(
        `https://githubclone-backend-mppw.onrender.com/repo/${id}/file?key=${encodeURIComponent(file)}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load file");
      }

      setFileContent(data.content);
    } catch (err) {
      setFileError(err.message);
    } finally {
      setFileLoading(false);
    }
  };

  if (loading) return <p>Loading repository...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!repository) return <p>Repository not found.</p>;

  return (
    <>
      <Navbar />

      <div style={{ padding: "30px", color: "#24292f" }}>
        <button
          type="button"
          className="view-issues-btn"
          onClick={() => navigate("/")}
        >
          Back to Dashboard
        </button>

        <h2>{repository.name}</h2>

        <p>{repository.description || "No description available"}</p>

        <hr />

        <h3>Repository Files</h3>

        <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
          <div style={{ minWidth: "280px", flex: "1" }}>
            {repository.content?.length > 0 ? (
              <ul style={{ paddingLeft: "20px" }}>
                {repository.content.map((file, index) => (
                  <li key={`${file}-${index}`} style={{ marginBottom: "12px" }}>
                    <button
                      onClick={() => handleFileClick(file)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0969da",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "15px",
                      }}
                    >
                      {file.split("/").pop()}
                    </button>

                    <p
                      style={{
                        fontSize: "11px",
                        color: "gray",
                        wordBreak: "break-all",
                      }}
                    >
                      {file}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No files found in this repository.</p>
            )}
          </div>

          <div
            style={{
              flex: "2",
              minWidth: "300px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "15px",
            }}
          >
            <h3>
              {selectedFile ? selectedFile.split("/").pop() : "File Preview"}
            </h3>

            {fileLoading && <p>Loading file content...</p>}

            {fileError && <p style={{ color: "red" }}>{fileError}</p>}

            {!selectedFile && <p>Select a file to view its content.</p>}

            {selectedFile && !fileLoading && !fileError && (
              <pre
                style={{
                  background: "#f6f8fa",
                  padding: "15px",
                  borderRadius: "6px",
                  overflowX: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: "600px",
                  overflowY: "auto",
                }}
              >
                {fileContent}
              </pre>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RepositoryView;
