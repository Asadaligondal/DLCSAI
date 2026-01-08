import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// --- Helper Components to Remove UI Redundancy ---
const Input = ({ label, ...props }) => (
  <div className="mb-4">
    <label className="block text-gray-700 font-medium mb-2">{label}</label>
    <input 
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
      {...props} 
    />
  </div>
);

const TextArea = ({ label, ...props }) => (
  <div className="mb-4">
    <label className="block text-gray-700 font-medium mb-2">{label}</label>
    <textarea 
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
      rows="2" 
      {...props} 
    />
  </div>
);

// --- Sub-Component: Admin Panel ---
const AdminPanel = ({ token }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, 
        { ...form, role: 'professor' }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Professor Created');
      setForm({ name: '', email: '', password: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating professor');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Create New Professor</h2>
      <form onSubmit={handleSubmit}>
        <Input label="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
        <Input label="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
        <Input label="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">Create Professor</button>
      </form>
    </div>
  );
};

// --- Sub-Component: Professor Panel ---
const ProfessorPanel = ({ token }) => {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ 
    name: '', studentId: '', age: '', gradeLevel: '', 
    disabilities: '', strengths: '', weaknesses: '' 
  });

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data.students || []);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchStudents(); }, []);

  const parseTags = (str) => str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/students`, {
        name: form.name,
        studentId: form.studentId,
        age: parseInt(form.age),
        gradeLevel: form.gradeLevel,
        disabilities: form.disabilities ? [form.disabilities] : [],
        strengths: form.strengths ? [form.strengths] : [],
        weaknesses: form.weaknesses ? [form.weaknesses] : []
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      alert('Student Added');
      setForm({ name: '', studentId: '', age: '', gradeLevel: '', disabilities: '', strengths: '', weaknesses: '' });
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding student');
    }
  };

  return (
    <div className="space-y-8">
      {/* Add Student Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">Add New Student</h2>
        <form onSubmit={handleAddStudent}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <Input label="Student ID" value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})} required />
            <Input label="Age" type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} required />
            <Input label="Grade Level" value={form.gradeLevel} onChange={e => setForm({...form, gradeLevel: e.target.value})} required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Disabilities</label>
            <select 
              value={form.disabilities} 
              onChange={e => setForm({...form, disabilities: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select a disability</option>
              <option value="Disability 1">Disability 1</option>
              <option value="Disability 2">Disability 2</option>
              <option value="Disability 3">Disability 3</option>
              <option value="Disability 4">Disability 4</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Strengths</label>
            <select 
              value={form.strengths} 
              onChange={e => setForm({...form, strengths: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select a strength</option>
              <option value="Strength 1">Strength 1</option>
              <option value="Strength 2">Strength 2</option>
              <option value="Strength 3">Strength 3</option>
              <option value="Strength 4">Strength 4</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Weaknesses</label>
            <select 
              value={form.weaknesses} 
              onChange={e => setForm({...form, weaknesses: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select a weakness</option>
              <option value="Weakness 1">Weakness 1</option>
              <option value="Weakness 2">Weakness 2</option>
              <option value="Weakness 3">Weakness 3</option>
              <option value="Weakness 4">Weakness 4</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">Add Student</button>
        </form>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">My Students ({students.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.length === 0 ? <p className="text-gray-500">No students found.</p> : students.map(s => (
            <div key={s._id} className="border p-4 rounded-lg hover:shadow-lg transition">
              <h3 className="font-bold text-lg">{s.name}</h3>
              <p className="text-sm text-gray-600">ID: {s.studentId} | Age: {s.age} | Grade: {s.gradeLevel}</p>
              {s.disabilities?.length > 0 && <p className="text-xs mt-2">⚠️ {s.disabilities.join(', ')}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---
function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user'));
    const t = localStorage.getItem('token');
    if (!u || !t) return navigate('/');
    setUser(u);
    setToken(t);
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-md p-4 mb-8">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Logout
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {user.role === 'admin' ? <AdminPanel token={token} /> : <ProfessorPanel token={token} />}
      </div>
    </div>
  );
}

export default Dashboard;