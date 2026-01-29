'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import MultiSelect from '@/components/MultiSelect';
import { Plus, Search, Trash2, Zap, Upload } from 'lucide-react';

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
  {
    label: 'Academic Achievement',
    options: [
      'Demonstrates age-appropriate skills in select academic areas',
      'Demonstrates relative strengths in foundational academic skills',
      'Demonstrates improved performance with explicit, systematic instruction',
      'Demonstrates understanding of grade-level concepts when provided accommodations',
      'Benefits from repeated practice and structured instructional routines',
      'Demonstrates strengths in academic tasks when materials are presented orally',
      'Demonstrates relative strengths in problem-solving tasks',
      'Demonstrates increased accuracy when instructional supports are provided'
    ]
  },
  {
    label: 'Communication',
    options: [
      'Demonstrates functional expressive communication skills in structured settings',
      'Demonstrates receptive language skills sufficient to follow classroom instruction with supports',
      'Communicates needs effectively with familiar adults',
      'Demonstrates increased verbal participation when provided wait time and prompts',
      'Utilizes appropriate nonverbal communication strategies',
      'Demonstrates emerging self-advocacy skills related to communication needs',
      'Demonstrates functional bilingual language skills'
    ]
  },
  {
    label: 'Social / Emotional / Behavioral Functioning',
    options: [
      'Demonstrates appropriate social interactions with peers and adults',
      'Responds positively to adult feedback and redirection',
      'Demonstrates awareness of classroom expectations',
      'Demonstrates age-appropriate behavior in structured environments',
      'Demonstrates improved emotional regulation with adult support',
      'Demonstrates persistence when tasks are scaffolded',
      'Demonstrates motivation to engage in learning activities',
      'Demonstrates cooperative behaviors during small-group instruction'
    ]
  },
  {
    label: 'Executive Functioning / Learning Behaviors',
    options: [
      'Follows established classroom routines and procedures',
      'Demonstrates task completion with visual or verbal supports',
      'Demonstrates emerging organizational skills',
      'Demonstrates sustained attention during structured or preferred activities',
      'Demonstrates ability to transition between activities with supports',
      'Utilizes strategies to remain engaged in instructional tasks',
      'Demonstrates independence with familiar academic routines'
    ]
  },
  {
    label: 'Adaptive / Functional Skills',
    options: [
      'Demonstrates age-appropriate self-care and daily living skills',
      'Independently manages personal materials with reminders',
      'Follows multi-step directions when supports are provided',
      'Demonstrates appropriate safety awareness in school settings',
      'Utilizes assistive technology as designed to access instruction',
      'Demonstrates functional independence within the school environment'
    ]
  },
  {
    label: 'Interests / Learning Preferences',
    options: [
      'Demonstrates increased engagement during hands-on or experiential learning',
      'Demonstrates motivation when instruction incorporates student interests',
      'Demonstrates responsiveness to technology-based instruction',
      'Demonstrates engagement during small-group or collaborative learning activities',
      'Demonstrates creativity in approaching problem-solving tasks'
    ]
  },
  {
    label: 'Transition-Relevant Strengths (When Applicable)',
    options: [
      'Demonstrates awareness of personal strengths and areas of need',
      'Demonstrates emerging self-determination skills',
      'Demonstrates appropriate work behaviors in classroom or school-based settings',
      'Demonstrates ability to follow adult direction in structured environments'
    ]
  }
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
  {
    label: 'Academic Achievement — Reading',
    options: [
      'Difficulty decoding grade-level words accurately',
      'Difficulty reading grade-level text with appropriate fluency',
      'Difficulty demonstrating reading comprehension of grade-level text',
      'Limited ability to identify main idea and supporting details',
      'Difficulty making inferences from text',
      'Difficulty summarizing grade-level passages',
      'Difficulty answering text-based questions independently',
      'Difficulty applying phonics skills to unfamiliar words',
      'Requires instructional materials to be read aloud to access content'
    ]
  },
  {
    label: 'Academic Achievement — Written Expression',
    options: [
      'Difficulty organizing ideas in written form',
      'Difficulty generating complete sentences independently',
      'Limited use of grade-appropriate grammar, punctuation, and capitalization',
      'Difficulty writing responses aligned to task requirements',
      'Difficulty editing and revising written work',
      'Difficulty producing written work within allotted time',
      'Requires sentence starters or graphic organizers to complete writing tasks',
      'Difficulty expanding written responses with sufficient detail'
    ]
  },
  {
    label: 'Academic Achievement — Mathematics',
    options: [
      'Difficulty demonstrating understanding of grade-level math concepts',
      'Difficulty recalling math facts efficiently',
      'Difficulty applying problem-solving strategies independently',
      'Difficulty interpreting word problems',
      'Difficulty explaining mathematical thinking',
      'Difficulty completing multi-step math problems accurately',
      'Difficulty applying math skills to real-world situations',
      'Requires manipulatives or visual models to access math instruction'
    ]
  },
  {
    label: 'Academic Achievement — Content Area Achievement',
    options: [
      'Difficulty accessing grade-level science content independently',
      'Difficulty accessing grade-level social studies content independently',
      'Difficulty comprehending academic vocabulary across content areas',
      'Difficulty extracting key information from textbooks or digital content',
      'Difficulty completing content-area assignments without accommodations'
    ]
  },
  {
    label: 'Learning Rate / Instructional Support',
    options: [
      'Requires repeated instruction to master new academic skills',
      'Requires small-group or individualized instruction to access curriculum',
      'Demonstrates slow acquisition of new academic skills',
      'Difficulty generalizing learned skills across settings or subjects',
      'Requires scaffolded instruction to complete grade-level tasks'
    ]
  },
  {
    label: 'Assessment & Academic Performance',
    options: [
      'Difficulty demonstrating knowledge on classroom or state assessments',
      'Performance on assessments does not reflect instructional understanding without accommodations',
      'Difficulty completing assessments within standard time limits',
      'Requires alternative formats to demonstrate academic knowledge',
      'Difficulty maintaining accuracy during independent academic tasks'
    ]
  },
  {
    label: 'Task Completion / Academic Independence',
    options: [
      'Difficulty completing academic tasks independently',
      'Difficulty sustaining academic engagement during non-preferred tasks',
      'Requires frequent prompts to remain engaged in instruction',
      'Difficulty following multi-step academic directions',
      'Difficulty initiating academic tasks without adult support'
    ]
  }
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
  const [uploading, setUploading] = useState(false);
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

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Analyzing document...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('/api/parse-pdf', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data && res.data.success) {
        const extracted = res.data.data;
        
        // Convert comma-separated strings to arrays for multi-selects
        // Helper function to convert comma-separated string to array, filtering out "add manually"
        const toArray = (value) => {
          if (!value || value === 'add manually') return [];
          return value.split(',').map(item => item.trim()).filter(item => item && item !== 'add manually');
        };
        
        const disabilitiesArray = toArray(extracted.disabilities);
        const strengthsArray = toArray(extracted.strengths);
        const weaknessesArray = toArray(extracted.weaknesses);

        setFormData(prev => ({
          ...prev,
          name: extracted.name !== 'add manually' ? extracted.name : prev.name,
          studentId: extracted.studentId !== 'add manually' ? extracted.studentId : prev.studentId,
          age: extracted.age !== 'add manually' ? extracted.age : prev.age,
          gradeLevel: extracted.gradeLevel !== 'add manually' ? extracted.gradeLevel : prev.gradeLevel,
          disabilities: disabilitiesArray.length > 0 ? disabilitiesArray : prev.disabilities,
          strengths: strengthsArray.length > 0 ? strengthsArray : prev.strengths,
          weaknesses: weaknessesArray.length > 0 ? weaknessesArray : prev.weaknesses,
          state: extracted.state !== 'add manually' ? extracted.state : prev.state,
          instructionalSetting: extracted.instructionalSetting !== 'add manually' ? extracted.instructionalSetting : 'add manually',
          performanceQuantitative: extracted.performanceQuantitative !== 'add manually' ? extracted.performanceQuantitative : 'add manually',
          performanceNarrative: extracted.performanceNarrative !== 'add manually' ? extracted.performanceNarrative : 'add manually',
          areaOfNeed: extracted.areaOfNeed !== 'add manually' ? extracted.areaOfNeed : 'add manually'
        }));

        toast.update(toastId, {
          render: 'Form auto-filled from PDF!',
          type: 'success',
          isLoading: false,
          autoClose: 3000
        });
      }
    } catch (error) {
      console.error('PDF upload error:', error);
      toast.update(toastId, {
        render: error.response?.data?.message || 'Failed to parse PDF',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
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
    <div className="flex h-screen bg-[#F7F9FB] font-sans text-slate-800">
      {/* Left Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} />

      {/* Right Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
            <div className="text-sm text-slate-500">Welcome, {user?.name}</div>
          </div>
          <div />
        </header>

        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">Students</h1>
                <p className="text-xs uppercase tracking-wide text-gray-500 mt-1">{filteredStudents.length} total</p>
              </div>
              <button
                onClick={handleOpenModal}
                className="flex items-center gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-md shadow-sm text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Add Student"
              >
                <Plus className="w-4 h-4 opacity-90" />
                <span className="leading-none">Add Student</span>
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-10 rounded-md text-sm bg-white border border-gray-200 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Student ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Age
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Grade
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Goals
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">
                    IEP Plan
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
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
                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-white shadow">
                            <span className="text-white font-semibold text-sm">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{student.name}</div>
                            <div className="text-xs text-gray-500">{student.gradeLevel} • {student.age} yrs</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{student.studentId}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.age}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.gradeLevel}</td>
                      <td className="px-4 py-3 text-sm">
                        {student?.assignedGoals && student.assignedGoals.length > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-600 text-white">Created</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-600 text-white">Not created</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm">
                        {(
                          student?.iep_plan_data && (
                            student.iep_plan_data.original_ai_draft?.plaafp_narrative ||
                            (student.iep_plan_data.original_ai_draft?.annual_goals && student.iep_plan_data.original_ai_draft.annual_goals.length > 0) ||
                            student.iep_plan_data.user_edited_version?.plaafp_narrative ||
                            (student.iep_plan_data.user_edited_version?.annual_goals && student.iep_plan_data.user_edited_version.annual_goals.length > 0)
                          )
                        ) ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-600 text-white">Generated</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-600 text-white">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/students/${student._id}`)}
                            className="px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 text-indigo-600 hover:bg-indigo-50 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            title="IEP"
                          >
                            IEP
                          </button>
                          <button
                            onClick={() => router.push(`/services/${student._id}`)}
                            className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-md text-sm font-medium flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            title="View Recs"
                          >
                            <Zap className="w-4 h-4" />
                            <span>View Recs</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(student)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
                            title="Delete"
                            aria-label="Delete student"
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
          <form onSubmit={handleSubmit} className="relative grid gap-6">
            {/* PDF Upload Feature Card */}
            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <div>
                <p className="text-sm font-medium text-slate-900">Auto-fill from PDF</p>
                <p className="text-xs text-slate-500 mt-1">Upload a report or intake form to extract student information</p>
              </div>
              <div className="flex flex-col items-end">
                <input
                  type="file"
                  id="pdf-upload"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <label
                  htmlFor="pdf-upload"
                  className={`inline-flex items-center gap-2 h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm transition-colors ${uploading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {uploading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span className="leading-none">{uploading ? 'Analyzing...' : 'Upload PDF'}</span>
                </label>
                <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 bg-slate-200 text-xs rounded">Beta</span>
                  <span>May extract incomplete or imprecise fields</span>
                </div>
              </div>
            </div>

            {/* Form grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">Name <span className="text-xs text-slate-500 font-normal">— write only initials</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">Student ID</label>
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">Grade Level</label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                  className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                >
                  <option value="">Select grade...</option>
                  <option>KG</option>
                  <option>1st</option>
                  <option>2nd</option>
                  <option>3rd</option>
                  <option>4th</option>
                  <option>5th</option>
                  <option>6th</option>
                  <option>7th</option>
                  <option>8th</option>
                  <option>9th</option>
                  <option>10th</option>
                  <option>11th</option>
                  <option>12th</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
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
                  <label className="block text-xs font-medium text-slate-700 mb-2">Other Strengths (describe)</label>
                  <input
                    type="text"
                    value={formData.strengthsOther}
                    onChange={(e) => setFormData({ ...formData, strengthsOther: e.target.value })}
                    className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                  <label className="block text-xs font-medium text-slate-700 mb-2">Other Weaknesses (describe)</label>
                  <input
                    type="text"
                    value={formData.weaknessesOther}
                    onChange={(e) => setFormData({ ...formData, weaknessesOther: e.target.value })}
                    className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Describe other weaknesses..."
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    disabled
                    className="w-full h-11 px-3 border border-gray-200 rounded-md bg-gray-50 text-sm text-slate-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Instructional Setting</label>
                  <select
                    value={formData.instructionalSetting}
                    onChange={(e) => setFormData({ ...formData, instructionalSetting: e.target.value })}
                    className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                <label className="block text-xs font-medium text-slate-700 mb-2">Current Performance Level</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Quantitative</label>
                    <select
                      value={formData.performanceQuantitative}
                      onChange={(e) => setFormData({ ...formData, performanceQuantitative: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    <label className="block text-xs text-slate-500 mb-1">Narrative</label>
                    <select
                      value={formData.performanceNarrative}
                      onChange={(e) => setFormData({ ...formData, performanceNarrative: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                <MultiSelect
                  label="Area(s) of Need"
                  options={AREAS_OF_NEED}
                  value={
                    Array.isArray(formData.areaOfNeed)
                      ? formData.areaOfNeed
                      : formData.areaOfNeed && formData.areaOfNeed !== 'add manually'
                      ? formData.areaOfNeed.split(',').map((s) => s.trim()).filter(Boolean)
                      : []
                  }
                  onChange={(value) => setFormData({ ...formData, areaOfNeed: Array.isArray(value) ? value.join(', ') : value })}
                  placeholder="Select areas of need..."
                />
              </div>
            </div>

            {/* Sticky footer actions */}
            <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-100 pt-4 pb-4 mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="h-11 px-4 text-sm font-medium text-slate-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-11 px-5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
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
