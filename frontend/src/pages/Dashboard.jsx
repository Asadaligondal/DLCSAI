import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [professors, setProfessors] = useState([]);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    age: '',
    gradeLevel: '',
    disabilities: '',
    strengths: '',
    weaknesses: ''
  });

  useEffect(() => {
    // Retrieve user and token from localStorage
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (!storedUser || !storedToken) {
      // Redirect to login if no user
      navigate('/');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    setToken(storedToken);

    // Fetch students if user is a professor
    if (parsedUser.role === 'professor') {
      fetchStudents(storedToken);
    }
  }, [navigate]);

  const fetchStudents = async (authToken) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/students`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateProfessor = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'professor'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert('Professor Created');
      // Clear form
      setFormData({
        ...formData,
        name: '',
        email: '',
        password: ''
      });
    } catch (error) {
      alert('Error creating professor: ' + (error.response?.data?.message || 'Unknown error'));
      console.error('Create professor error:', error);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();

    try {
      // Convert comma-separated strings to arrays
      const disabilitiesArray = formData.disabilities
        ? formData.disabilities.split(',').map(item => item.trim()).filter(item => item)
        : [];
      const strengthsArray = formData.strengths
        ? formData.strengths.split(',').map(item => item.trim()).filter(item => item)
        : [];
      const weaknessesArray = formData.weaknesses
        ? formData.weaknesses.split(',').map(item => item.trim()).filter(item => item)
        : [];

      await axios.post(
        `${import.meta.env.VITE_API_URL}/students`,
        {
          name: formData.name,
          studentId: formData.studentId,
          age: parseInt(formData.age),
          gradeLevel: formData.gradeLevel,
          disabilities: disabilitiesArray,
          strengths: strengthsArray,
          weaknesses: weaknessesArray
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert('Student Added Successfully');
      // Clear form
      setFormData({
        ...formData,
        name: '',
        studentId: '',
        age: '',
        gradeLevel: '',
        disabilities: '',
        strengths: '',
        weaknesses: ''
      });

      // Re-fetch students
      fetchStudents(token);
    } catch (error) {
      alert('Error adding student: ' + (error.response?.data?.message || 'Unknown error'));
      console.error('Add student error:', error);
    }
  };

  // Show loading or nothing while checking authentication
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, {user.name}
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {user.role === 'admin' ? (
          // Admin Panel
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-800">
              Create New Professor
            </h2>
            <form onSubmit={handleCreateProfessor} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter professor name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter professor email"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter professor password"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200 font-medium"
              >
                Create Professor
              </button>
            </form>
          </div>
        ) : (
          // Professor Panel
          <div className="space-y-8">
            {/* Add Student Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-800">
                Add New Student
              </h2>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter student name"
                    />
                  </div>
                  <div>
                    <label htmlFor="studentId" className="block text-gray-700 font-medium mb-2">
                      Student ID
                    </label>
                    <input
                      type="text"
                      id="studentId"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter student ID"
                    />
                  </div>
                  <div>
                    <label htmlFor="age" className="block text-gray-700 font-medium mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter age"
                    />
                  </div>
                  <div>
                    <label htmlFor="gradeLevel" className="block text-gray-700 font-medium mb-2">
                      Grade Level
                    </label>
                    <input
                      type="text"
                      id="gradeLevel"
                      name="gradeLevel"
                      value={formData.gradeLevel}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 5th Grade"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="disabilities" className="block text-gray-700 font-medium mb-2">
                    Disabilities (comma-separated)
                  </label>
                  <textarea
                    id="disabilities"
                    name="disabilities"
                    value={formData.disabilities}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., ADHD, Anxiety, Dyslexia"
                  />
                </div>
                <div>
                  <label htmlFor="strengths" className="block text-gray-700 font-medium mb-2">
                    Strengths (comma-separated)
                  </label>
                  <textarea
                    id="strengths"
                    name="strengths"
                    value={formData.strengths}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Creative, Math skills, Good listener"
                  />
                </div>
                <div>
                  <label htmlFor="weaknesses" className="block text-gray-700 font-medium mb-2">
                    Weaknesses (comma-separated)
                  </label>
                  <textarea
                    id="weaknesses"
                    name="weaknesses"
                    value={formData.weaknesses}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Reading comprehension, Focus"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200 font-medium"
                >
                  Add Student
                </button>
              </form>
            </div>

            {/* Students List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-800">
                My Students ({students.length})
              </h2>
              {students.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No students added yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map((student) => (
                    <div
                      key={student._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition duration-200"
                    >
                      <h3 className="font-bold text-lg text-gray-800 mb-2">
                        {student.name}
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">ID:</span> {student.studentId}</p>
                        <p><span className="font-medium">Age:</span> {student.age}</p>
                        <p><span className="font-medium">Grade:</span> {student.gradeLevel}</p>
                        {student.disabilities && student.disabilities.length > 0 && (
                          <p><span className="font-medium">Disabilities:</span> {student.disabilities.join(', ')}</p>
                        )}
                        {student.strengths && student.strengths.length > 0 && (
                          <p><span className="font-medium">Strengths:</span> {student.strengths.join(', ')}</p>
                        )}
                        {student.weaknesses && student.weaknesses.length > 0 && (
                          <p><span className="font-medium">Weaknesses:</span> {student.weaknesses.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
