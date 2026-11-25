import React, { useEffect } from "react";
import { useNavigate, useRoutes, useLocation } from "react-router-dom";

// Pages
import Dashboard from "./components/dashboard/Dashboard";
import Profile from "./components/user/Profile";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import CreateRepository from "./components/repo/CreateRepository";
import Issues from "./components/issue/Issues";
import RepositoryView from "./components/repo/RepositoryView";

// Auth Context
import { useAuth } from "./authContext.jsx";

const ProjectRoutes = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userIdFromStorage = localStorage.getItem("userId");

    if (userIdFromStorage && !currentUser) {
      setCurrentUser(userIdFromStorage);
    }

    if (!userIdFromStorage) {
      if (location.pathname !== "/auth" && location.pathname !== "/signup") {
        navigate("/auth", { replace: true });
      }
    }

    if (userIdFromStorage && location.pathname === "/auth") {
      navigate("/", { replace: true });
    }
  }, [currentUser, navigate, setCurrentUser, location.pathname]);

  const element = useRoutes([
    {
      path: "/",
      element: <Dashboard />,
    },
    {
      path: "/auth",
      element: <Login />,
    },
    {
      path: "/signup",
      element: <Signup />,
    },
    {
      path: "/profile",
      element: <Profile />,
    },
    {
      path: "/create",
      element: <CreateRepository />,
    },
    {
      path: "/issues/:repoId",
      element: <Issues />,
    },
    {
      path: "/repository/:id",
      element: <RepositoryView />,
    },
  ]);

  return element;
};

export default ProjectRoutes;