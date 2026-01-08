import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    age: '',
    gradeLevel: '',
    disabilities: '',
    strengths: '',
    weaknesses: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    fetchStudent(token);
  }, [id, navigate]);

  const fetchStudent = async (token) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/students`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const studentData = response.data.students.find(s => s._id === id);
      if (studentData) {
        setStudent(studentData);
        setFormData({
          name: studentData.name,
          studentId: studentData.studentId,
          age: studentData.age,
          gradeLevel: studentData.gradeLevel,
          disabilities: studentData.disabilities?.[0] || '',
          strengths: studentData.strengths?.[0] || '',
          weaknesses: studentData.weaknesses?.[0] || ''
        });
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      alert('Failed to load student data');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/students/${id}`,
        {
          name: formData.name,
          studentId: formData.studentId,
          age: parseInt(formData.age),
          gradeLevel: formData.gradeLevel,
          disabilities: formData.disabilities ? [formData.disabilities] : [],
          strengths: formData.strengths ? [formData.strengths] : [],
          weaknesses: formData.weaknesses ? [formData.weaknesses] : []
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Student updated successfully');
      setIsEditing(false);
      fetchStudent(token);
    } catch (error) {
      alert('Error updating student: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  if (!student) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-500 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Student Details</h1>
          <div className="w-32"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
          {!isEditing ? (
            // View Mode
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{student.name}</h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Edit
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <label className="text-sm font-semibold text-gray-600">Student ID</label>
                  <p className="text-lg text-gray-800">{student.studentId}</p>
                </div>
                <div className="border-b pb-3">
                  <label className="text-sm font-semibold text-gray-600">Age</label>
                  <p className="text-lg text-gray-800">{student.age}</p>
                </div>
                <div className="border-b pb-3">
                  <label className="text-sm font-semibold text-gray-600">Grade Level</label>
                  <p className="text-lg text-gray-800">{student.gradeLevel}</p>
                </div>
                <div className="border-b pb-3">
                  <label className="text-sm font-semibold text-gray-600">Disabilities</label>
                  <p className="text-lg text-gray-800">{student.disabilities?.join(', ') || 'None'}</p>
                </div>
                <div className="border-b pb-3">
                  <label className="text-sm font-semibold text-gray-600">Strengths</label>
                  <p className="text-lg text-gray-800">{student.strengths?.join(', ') || 'None'}</p>
                </div>
                <div className="border-b pb-3">
                  <label className="text-sm font-semibold text-gray-600">Weaknesses</label>
                  <p className="text-lg text-gray-800">{student.weaknesses?.join(', ') || 'None'}</p>
                </div>
              </div>
            </div>
          ) : (
            // Edit Mode
            <form onSubmit={handleUpdate}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Edit Student</h2>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Student ID</label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Grade Level</label>
                  <input
                    type="text"
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Disabilities</label>
                  <select
                    value={formData.disabilities}
                    onChange={(e) => setFormData({ ...formData, disabilities: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a disability</option>
                    <option value="Disability 1">Disability 1</option>
                    <option value="Disability 2">Disability 2</option>
                    <option value="Disability 3">Disability 3</option>
                    <option value="Disability 4">Disability 4</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Strengths</label>
                  <select
                    value={formData.strengths}
                    onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a strength</option>
                    <option value="Strength 1">Strength 1</option>
                    <option value="Strength 2">Strength 2</option>
                    <option value="Strength 3">Strength 3</option>
                    <option value="Strength 4">Strength 4</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Weaknesses</label>
                  <select
                    value={formData.weaknesses}
                    onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a weakness</option>
                    <option value="Weakness 1">Weakness 1</option>
                    <option value="Weakness 2">Weakness 2</option>
                    <option value="Weakness 3">Weakness 3</option>
                    <option value="Weakness 4">Weakness 4</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200 font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDetail;
