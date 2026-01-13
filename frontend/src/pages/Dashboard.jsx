import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

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
  const [professors, setProfessors] = useState([]);
  const [showPasswords, setShowPasswords] = useState({});

  const fetchProfessors = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/auth/professors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfessors(res.data.professors || []);
    } catch (error) {
      console.error('Error fetching professors:', error);
    }
  };

  useEffect(() => {
    fetchProfessors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, 
        { ...form, role: 'professor' }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Professor Created');
      setForm({ name: '', email: '', password: '' });
      // Add new professor to the list immediately
      setProfessors([response.data.user, ...professors]);
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating professor');
    }
  };

  const handleDelete = async (professorId) => {
    if (!window.confirm('Are you sure you want to delete this professor?')) {
      return;
    }

    console.log('Deleting professor with ID:', professorId);
    console.log('API URL:', import.meta.env.VITE_API_URL);
    console.log('Full delete URL:', `${import.meta.env.VITE_API_URL}/auth/professors/${professorId}`);

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/auth/professors/${professorId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Delete response:', response.data);
      
      if (response.data.success) {
        alert('Professor deleted successfully');
        // Remove professor from the list
        setProfessors(professors.filter(p => (p._id || p.id) !== professorId));
      }
    } catch (err) {
      console.error('Delete error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });
      alert(err.response?.data?.message || 'Error deleting professor');
    }
  };

  const togglePasswordVisibility = (professorId) => {
    setShowPasswords(prev => ({
      ...prev,
      [professorId]: !prev[professorId]
    }));
  };

  return (
    <div className="space-y-8">
      {/* Create Professor Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Create New Professor</h2>
        <form onSubmit={handleSubmit}>
          <Input label="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <Input label="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">Create Professor</button>
        </form>
      </div>

      {/* Professors List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">List of Professors ({professors.length})</h2>
        {professors.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No professors found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {professors.map(p => {
                  const professorId = p._id || p.id;
                  const isPasswordVisible = showPasswords[professorId];
                  return (
                    <tr key={professorId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">
                            {isPasswordVisible ? (p.plainPassword || '<not stored>') : '••••••••'}
                          </span>
                          {p.plainPassword && (
                            <button
                              onClick={() => togglePasswordVisibility(professorId)}
                              className="text-gray-600 hover:text-blue-500 transition"
                              title={isPasswordVisible ? 'Hide password' : 'Show password'}
                            >
                              {isPasswordVisible ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDelete(professorId)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-Component: Professor Panel ---
const ProfessorPanel = ({ token }) => {
  const navigate = useNavigate();
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

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/students/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert('Student deleted successfully');
        // Remove student from the list
        setStudents(students.filter(s => s._id !== studentId));
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Error deleting student');
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
        {students.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No students found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.studentId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => navigate(`/student/${s._id}`)}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(s._id)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
    <div className='bg-black p-2 h-screen w-screen'>
      <div className="h-full w-full bg-gradient-to-b from-blue-50 via-blue-100 to-indigo-200 rounded-[28px] shadow-3xl">
        <Navbar />

        <div className="container mx-auto px-4">
          {user.role === 'admin' ? <AdminPanel token={token} /> : <ProfessorPanel token={token} />}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;