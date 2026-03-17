import { useAuth0 } from "@auth0/auth0-react";

const AuthModal = ({ onClose }) => {
  const { loginWithRedirect } = useAuth0();

  return (
    <button 
      onClick={() => loginWithRedirect()}
      className="w-full bg-white text-black font-bold py-4 rounded-full"
    >
      Drift into Onyx (Login)
    </button>
  );
};