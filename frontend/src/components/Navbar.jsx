import { useState, useRef, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="w-full h-[72px] bg-transparent flex items-center px-6">
      
      {/* LEFT: Company Name */}
      <div className="flex-shrink-0">
        <div className="px-4 py-2 rounded-full border border-gray-300 text-lg font-medium text-gray-800 bg-white">
          Crextio
        </div>
      </div>

      {/* CENTER: Navigation */}
      <div className="flex-1 flex justify-end gap-2">
        <nav className="flex items-center gap-2 bg-white/70 rounded-full px-2 py-1 shadow-sm">
          {["home", "teachers", "goals"].map((item) => (
            <NavLink
              key={item}
              to={`/${item}`}
              className={({ isActive }) =>
                `px-5 py-2 rounded-full text-sm font-medium transition
                 ${
                   isActive
                     ? "bg-gray-900 text-white"
                     : "text-gray-700 hover:bg-gray-100"
                 }`
              }
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </NavLink>
          ))}
        </nav>
        <div className="relative flex-shrink-0 bg-white/70 rounded-full px-2 py-1 shadow-sm" ref={dropdownRef}>
            <button
            onClick={() => setOpen(!open)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:ring-2 hover:ring-gray-300 transition"
            >
            {/* Person Icon */}
            <svg
                className="w-5 h-5 text-gray-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
            >
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
            </svg>
            </button>

            {/* Dropdown */}
            {open && (
            <div className="absolute right-0 mt-3 w-40 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition"
                >
                Logout
                </button>
            </div>
            )}
        </div>
      </div>
    </header>
  );
}
