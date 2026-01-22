'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import MultiSelect from '@/components/MultiSelect';
import { Plus, Search, Trash2, Zap } from 'lucide-react';

const DISABILITIES_OPTIONS = [
  'Autism Spectrum Disorder (P)',
  'Deaf or Hard-of-Hearing (H)',
  'Developmental Delay (T)',
  'Dual-Sensory Impairment (O)',
  'Emotional or Behavioral Disability (J)',
  'Established Conditions (Age: 0-2) (U)',
  'Gifted (L)',
  'Hospitalized or Homebound (M)',
  'Intellectual Disability (W)',
  'Language Impairment (G)',
  'Orthopedic Impairment (C)',
  'Other Health Impairment (V)',
  'Traumatic Brain Injury (S)',
  'Specific Learning Disability (K)',
  'Speech Impairment (F)',
  'Visual Impairment (I)'
];
const STRENGTHS_OPTIONS = [
  'Good Memory',
  'Creative',
  'Problem Solving',
  'Communication',
  'Leadership',
  'Artistic',
  'Athletic',
  'Teamwork',
  'Adaptability',
  'Organization',
  'Perseverance',
  'Attention to Detail',
  'Curiosity',
  'Others'
];
const WEAKNESSES_OPTIONS = [
  'Reading Comprehension',
  'Focus',
  'Math Skills',
  'Social Skills',
  'Writing',
  'Organization',
  'Processing Speed',
  'Working Memory',
  'Fine Motor',
  'Gross Motor',
  'Anxiety',
  'Executive Functioning',
  'Behavioral Regulation',
  'Others'
];
const INSTRUCTIONAL_SETTINGS = ['General Education Support', 'Special Education Support', 'Resource Room', 'Inclusion', 'Self-Contained'];
const QUANTITATIVE_LEVELS = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
const NARRATIVE_LEVELS = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
const AREAS_OF_NEED = [
  'Language & Literacy',
  'Mathematics',
  'Behavior & Social-Emotional',
  'Communication',
  'Adaptive / Life Skills',
  'Motor / Physical',
  'Sensory',
  'Cognition',
    'Other', // Ensure 'Other' is included explicitly
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    age: '',
    gradeLevel: '',
    disabilities: [],
    strengths: [],
    strengthsOther: '',
    weaknesses: [],
    weaknessesOther: '',
    areaOfNeedOther: '',
    state: 'Florida',
    instructionalSetting: '',
    performanceQuantitative: '',
    performanceNarrative: '',
    areaOfNeed: ''
  });

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    const t = localStorage.getItem('token');
    if (!u || !t) {
      router.push('/login');
      return;
    }
    // Only professors can access this page
    if (u.role === 'admin') {
      router.push('/professors');
      return;
    }
    setUser(u);
    setToken(t);
  }, [router]);

  useEffect(() => {
    if (token && user?.role === 'professor') {
      fetchStudents();
    }
  }, [token, user?.role]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data.students || []);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      name: '',
      studentId: '',
      age: '',
      gradeLevel: '',
      disabilities: [],
      strengths: [],
      strengthsOther: '',
      weaknesses: [],
      weaknessesOther: '',
      state: 'Florida',
      instructionalSetting: '',
      performanceQuantitative: '',
      performanceNarrative: '',
      areaOfNeed: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      name: '',
      studentId: '',
      age: '',
      gradeLevel: '',
      disabilities: [],
      strengths: [],
      weaknesses: [],
      state: 'Florida',
      instructionalSetting: '',
      performanceQuantitative: '',
      performanceNarrative: '',
      areaOfNeed: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        '/api/students',
        {
          ...formData,
          age: parseInt(formData.age)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Student added successfully');
      fetchStudents();
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add student');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Student deleted successfully');
      fetchStudents();
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#F9FAFB] font-sans text-slate-800">
      {/* Left Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} />

      {/* Right Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-slate-800">Dashboard</h2>
          <div className="text-sm text-slate-500">Welcome, {user.name}</div>
        </header>

        <main className="p-8">
          <div className="max-w-full px-0 py-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Students</h1>
                <p className="text-xs uppercase tracking-wide text-gray-500 mt-1">{filteredStudents.length} total</p>
              </div>
              <button
                onClick={handleOpenModal}
                className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md text-sm font-semibold transition-all"
                aria-label="Add Student"
              >
                <Plus className="w-4 h-4 opacity-90" />
                Add Student
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-transparent">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-sm pl-9 pr-4 py-2 rounded-full text-sm bg-white shadow-sm focus:outline-none focus:shadow-lg transition-shadow"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Student ID
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Age
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Grade
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    IEP Plan
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm">Loading students...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 text-sm">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-white shadow-sm">
                            <span className="text-white font-semibold text-sm">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{student.name}</div>
                            <div className="text-xs text-gray-400">{student.gradeLevel} • {student.age} yrs</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600 font-mono">{student.studentId}</td>
                      <td className="px-6 py-5 text-sm text-gray-600">{student.age}</td>
                      <td className="px-6 py-5 text-sm text-gray-600">{student.gradeLevel}</td>
                      <td className="px-6 py-5 text-sm text-gray-600">
                        {student.assignedGoals?.length || 0}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => router.push(`/students/${student._id}`)}
                            className="px-3 py-1.5 bg-white border border-transparent hover:border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-full text-sm font-medium shadow-xs transition-all"
                            title="IEP"
                          >
                            IEP
                          </button>
                          <button
                            onClick={() => router.push(`/services/${student._id}`)}
                            className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-50 text-green-700 hover:from-green-200 hover:to-green-100 rounded-full text-sm font-medium flex items-center gap-2 transition-all"
                            title="View Recs"
                          >
                            <Zap className="w-4 h-4" />
                            <span>View Recs</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(student)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
        </main>
      </div>

      {showModal && (
        <Modal title="Add Student" onClose={handleCloseModal} size="lg">
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                  <span className="ml-2 text-xs text-gray-400 font-normal">— write only initials (e.g. Adam Smith → A S)</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select grade...</option>
                  <option>Kindergarten (K)</option>
                  <option>Grade 1</option>
                  <option>Grade 2</option>
                  <option>Grade 3</option>
                  <option>Grade 4</option>
                  <option>Grade 5</option>
                  <option>Grade 6</option>
                  <option>Grade 7</option>
                  <option>Grade 8</option>
                  <option>Grade 9 (Freshman)</option>
                  <option>Grade 10 (Sophomore)</option>
                  <option>Grade 11 (Junior)</option>
                  <option>Grade 12 (Senior)</option>
                </select>
              </div>
            </div>

            <MultiSelect
              label="Exceptionalities"
              options={DISABILITIES_OPTIONS}
              value={formData.disabilities}
              onChange={(value) => setFormData({ ...formData, disabilities: value })}
              placeholder="Select exceptionalities..."
            />

            <MultiSelect
              label="Strengths"
              options={STRENGTHS_OPTIONS}
              value={formData.strengths}
              onChange={(value) => setFormData({ ...formData, strengths: value })}
              placeholder="Select strengths..."
            />

            {formData.strengths.includes('Others') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Other Strengths (describe)</label>
                <input
                  type="text"
                  value={formData.strengthsOther}
                  onChange={(e) => setFormData({ ...formData, strengthsOther: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe other strengths..."
                />
              </div>
            )}

            <MultiSelect
              label="Weaknesses"
              options={WEAKNESSES_OPTIONS}
              value={formData.weaknesses}
              onChange={(value) => setFormData({ ...formData, weaknesses: value })}
              placeholder="Select weaknesses..."
            />

            {formData.weaknesses.includes('Others') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Other Weaknesses (describe)</label>
                <input
                  type="text"
                  value={formData.weaknessesOther}
                  onChange={(e) => setFormData({ ...formData, weaknessesOther: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe other weaknesses..."
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructional Setting</label>
                <select
                  value={formData.instructionalSetting}
                  onChange={(e) => setFormData({ ...formData, instructionalSetting: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select setting...</option>
                  {INSTRUCTIONAL_SETTINGS.map((setting) => (
                    <option key={setting} value={setting}>
                      {setting}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Performance Level</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Quantitative</label>
                  <select
                    value={formData.performanceQuantitative}
                    onChange={(e) => setFormData({ ...formData, performanceQuantitative: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select level...</option>
                    {QUANTITATIVE_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Narrative</label>
                  <select
                    value={formData.performanceNarrative}
                    onChange={(e) => setFormData({ ...formData, performanceNarrative: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select level...</option>
                    {NARRATIVE_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area(s) of Need</label>
              <select
                value={formData.areaOfNeed}
                onChange={(e) => setFormData({ ...formData, areaOfNeed: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select area...</option>
                {AREAS_OF_NEED.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              {formData.areaOfNeed === 'Other' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Area of Need (describe)</label>
                  <input
                    type="text"
                    value={formData.areaOfNeedOther}
                    onChange={(e) => setFormData({ ...formData, areaOfNeedOther: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe other area of need..."
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Add Student
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Student"
          message={`Are you sure you want to delete ${deleteConfirm.name}? This action cannot be undone.`}
          type="danger"
          confirmText="Delete"
          onConfirm={() => handleDelete(deleteConfirm._id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
