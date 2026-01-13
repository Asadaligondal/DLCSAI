import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function Professors() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) return navigate("/");
    setToken(t);
    fetchProfessors(t);
  }, []);

  
  const fetchProfessors = async (t) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/professors`,
        { headers: { Authorization: `Bearer ${t}` } }
      );
      setProfessors(res.data.data || []);
    } catch {
      setError("Failed to load professors");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", email: "", password: "" });
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, email: p.email, password: "" });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/users/${editing._id}`,
          { name: form.name, email: form.email },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/register`,
          { ...form, role: "professor" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setModalOpen(false);
      fetchProfessors(token);
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed");
    }
  };

  const deleteProfessor = async (id) => {
    if (!confirm("Delete this professor?")) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/users/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchProfessors(token);
    } catch {
      alert("Delete failed");
    }
  };

  const filtered = professors.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-black p-2 h-screen w-screen">
      <div className="h-full w-full bg-gradient-to-b from-blue-50 via-blue-100 to-indigo-200 rounded-[28px] shadow-3xl overflow-hidden">
        <Navbar />

        <div className=" px-7 py-8">
          {/* Header */}
          <div className="flex justify-between items-cente mb-5">
            <h1 className="text-5xl font-normal text-gray-900">Professors</h1>
          </div>

          {/* Top Controls */}
<div className="relative w-full h-[90px] flex">
  {/* Trapezoid Background */}
<div
  className="h-full bg-red-500 rounded-t-3xl "
  style={{
    width: "90%",
    clipPath: "polygon(0% 0%, 92.5% 0%, 100% 100%, 0% 100%)",
  }}
>


  {/* Content */}
  <div className="relative w-[80%] z-10 h-full flex items-center px-6 gap-4">
    {/* Search */}
    <div className="flex-1 flex items-center bg-white rounded-full px-4 py-3 shadow">
      <svg
        className="w-4 h-4 text-gray-400 mr-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
        />
      </svg>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search"
        className="flex-1 outline-none bg-transparent text-sm"
      />
    </div>

    {/* Add Button */}

  </div>
  </div>
      <button
      onClick={openAdd}
      className="bg-blue-600 text-white px-6 py-3 rounded-full shadow hover:bg-blue-700 transition"
    >
      + Add Professor
    </button>
 
</div>


          {/* Table Container */}
          <div className="bg-white rounded-b-3xl shadow overflow-hidden">
            {loading ? (
              <div className="p-10 text-center">Loading...</div>
            ) : error ? (
              <div className="p-10 text-center text-red-500">{error}</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-dashed">
                    <th className="p-5 text-left">
                      <input type="checkbox" />
                    </th>
                    <th className="p-5 text-left">Name</th>
                    <th className="p-5 text-left">Email</th>
                    <th className="p-5 text-left">Role</th>
                    <th className="p-5 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((p, i) => (
                    <tr
                      key={p._id}
                    >
                      <td className="p-5">
                        <input type="checkbox" defaultChecked={i === 1} />
                      </td>

                      <td className="p-5 flex items-center gap-3 font-medium">
                        <img
                          src={`https://ui-avatars.com/api/?name=${p.name}`}
                          className="w-9 h-9 rounded-full"
                        />
                        {p.name}
                      </td>

                      <td className="p-5">{p.email}</td>

                      <td className="p-5 capitalize">{p.role}</td>

                      <td className="p-5 flex gap-3">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProfessor(p._id)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-400">
                        No professors found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-[420px] space-y-4">
            <h2 className="text-xl font-semibold">
              {editing ? "Edit Professor" : "Add Professor"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                placeholder="Name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
              <input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
              {!editing && (
                <input
                  placeholder="Password"
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white"
                >
                  {editing ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
