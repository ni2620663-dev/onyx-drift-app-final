import React from "react";
import { Routes, Route, Navigate, NavLink } from "react-router-dom";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";

/* ---------- Navbar ---------- */
const Navbar = () => {
  const { isAuthenticated, loginWithRedirect, logout } = useAuth0();

  return (
    <div className="bg-blue-600 p-4 text-white">
      <NavLink to="/">Home</NavLink>
      {isAuthenticated && (
        <>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </>
      )}
      {isAuthenticated ? (
        <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
          Logout
        </button>
      ) : (
        <button onClick={() => loginWithRedirect()}>Login</button>
      )}
    </div>
  );
};

/* ---------- ProtectedRoute ---------- */
const ProtectedRoute = ({ component }) => {
  const Component = withAuthenticationRequired(component, {
    onRedirecting: () => <div>Redirecting...</div>,
  });
  return <Component />;
};

/* ---------- Pages ---------- */
const LandingPage = () => <h1>Welcome to OnyxDrift</h1>;

const Profile = () => {
  const { user } = useAuth0();
  return <h2>{user?.name}</h2>;
};

/* ---------- App ---------- */
export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<ProtectedRoute component={LandingPage} />} />
        <Route path="/profile" element={<ProtectedRoute component={Profile} />} />
        <Route path="*" element={<h2>404 - Page Not Found</h2>} />
      </Routes>
    </>
  );
}
