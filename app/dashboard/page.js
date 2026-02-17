"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import MultiSelect from '@/components/MultiSelect';
import AccommodationsModal from '@/components/AccommodationsModal';
import { Plus, Search, Trash2, Zap, Upload, FileText, Users } from 'lucide-react';

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
  const [wizardStep, setWizardStep] = useState(1);
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
    ,studentNotes: ''
  });
  const [showAccommodations, setShowAccommodations] = useState(false);
  const [accommodations, setAccommodations] = useState(null);

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
      areaOfNeed: '',
      studentNotes: ''
    });
    setWizardStep(1);
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
      areaOfNeed: '',
      studentNotes: ''
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

        // Normalizers for specific select fields to match frontend options
        const normalizeGradeLevel = (val) => {
          if (!val || val === 'add manually') return null;
          const s = String(val).toLowerCase();
          // Match formats like "grade 3", "3rd", "3"
          const g = s.match(/grade\s*(\d{1,2})/) || s.match(/^(\d{1,2})(st|nd|rd|th)?$/);
          if (g) {
            const num = g[1];
            const ord = (n) => {
              const v = parseInt(n, 10);
              if (v === 1) return '1st';
              if (v === 2) return '2nd';
              if (v === 3) return '3rd';
              return `${v}th`;
            };
            return ord(num);
          }
          // Common full words
          if (s.includes('kg') || s.includes('kindergarten')) return 'KG';
          // If already in ordinal like "3rd grade"
          const ordMatch = s.match(/(\d{1,2})(st|nd|rd|th)/);
          if (ordMatch) return ordMatch[0];
          return null;
        };

        const normalizeInstructionalSetting = (val) => {
          if (!val || val === 'add manually') return null;
          const s = String(val).toLowerCase();
          if (s.includes('general')) return 'General Education Support';
          if (s.includes('special')) return 'Special Education Support';
          if (s.includes('resource')) return 'Resource Room';
          if (s.includes('inclusion')) return 'Inclusion';
          if (s.includes('self') || s.includes('contained')) return 'Self-Contained';
          return null;
        };

        const normalizeQuantitative = (val) => {
          if (!val || val === 'add manually') return null;
          const s = String(val).toLowerCase();
          const g = s.match(/grade\s*(\d{1,2})/) || s.match(/^(\d{1,2})(st|nd|rd|th)?$/);
          if (g) return `Grade ${parseInt(g[1], 10)}`;
          return null;
        };

        const normalizeNarrative = (val) => {
          if (!val || val === 'add manually') return null;
          const s = String(val).toLowerCase();
          if (s.includes('poor')) return 'Poor';
          if (s.includes('fair')) return 'Fair';
          if (s.includes('very good') || s.includes('verygood') || s.includes('very good')) return 'Very Good';
          if (s.includes('excellent') || s.includes('outstanding')) return 'Excellent';
          if (s.includes('good') || s.includes('average')) return 'Good';
          return null;
        };
        
        const disabilitiesArray = toArray(extracted.disabilities);
        const strengthsArray = toArray(extracted.strengths);
        const weaknessesArray = toArray(extracted.weaknesses);

        setFormData(prev => {
          // Normalize mappings for select fields, fall back to previous values if normalization fails
          const normalizedGrade = normalizeGradeLevel(extracted.gradeLevel) || (extracted.gradeLevel !== 'add manually' ? extracted.gradeLevel : null);
          const normalizedInstructional = normalizeInstructionalSetting(extracted.instructionalSetting) || (extracted.instructionalSetting !== 'add manually' ? extracted.instructionalSetting : null);
          const normalizedQuant = normalizeQuantitative(extracted.performanceQuantitative) || (extracted.performanceQuantitative !== 'add manually' ? extracted.performanceQuantitative : null);
          const normalizedNarr = normalizeNarrative(extracted.performanceNarrative) || (extracted.performanceNarrative !== 'add manually' ? extracted.performanceNarrative : null);

          return {
            ...prev,
            name: extracted.name !== 'add manually' ? extracted.name : prev.name,
            studentId: extracted.studentId !== 'add manually' ? extracted.studentId : prev.studentId,
            age: extracted.age !== 'add manually' ? extracted.age : prev.age,
            gradeLevel: normalizedGrade || prev.gradeLevel,
            disabilities: disabilitiesArray.length > 0 ? disabilitiesArray : prev.disabilities,
            strengths: strengthsArray.length > 0 ? strengthsArray : prev.strengths,
            weaknesses: weaknessesArray.length > 0 ? weaknessesArray : prev.weaknesses,
            state: extracted.state !== 'add manually' ? extracted.state : prev.state,
            instructionalSetting: normalizedInstructional || prev.instructionalSetting,
            performanceQuantitative: normalizedQuant || prev.performanceQuantitative,
            performanceNarrative: normalizedNarr || prev.performanceNarrative,
            areaOfNeed: extracted.areaOfNeed !== 'add manually' ? extracted.areaOfNeed : prev.areaOfNeed
          };
        });

        // If the AI returned any accommodations block, store it locally so user can review
        if (extracted.student_accommodations) {
          setAccommodations(extracted.student_accommodations);
        }

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
      const payload = { ...formData, age: parseInt(formData.age) };
      if (accommodations) payload.student_accommodations = accommodations;
      await axios.post('/api/students', payload, { headers: { Authorization: `Bearer ${token}` } });
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
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      {/* Left Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} />

      {/* Right Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
              <div className="text-sm text-slate-500">Welcome, {user?.name}</div>
            </div>
          </div>
        </header>

        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Students</h1>
                <p className="text-sm text-slate-500 mt-1">{filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={handleOpenModal}
                className="flex items-center gap-2 h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                aria-label="Add Student"
              >
                <Plus className="w-4 h-4" />
                Add Student
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-10 rounded-lg text-sm bg-white border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Goals
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    IEP Plan
                  </th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex items-center justify-center gap-3 text-slate-500">
                        <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm font-medium">Loading students...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <Users className="w-12 h-12 text-slate-300" />
                        <span className="text-sm font-medium">No students found</span>
                        <span className="text-xs">Add a student or try a different search</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-white font-semibold text-sm">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{student.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{student.gradeLevel} • {student.age} yrs</div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {(() => {
                                const acc = student.student_accommodations || {};
                                const sum = (obj) => ['presentation','response','scheduling','setting','assistive_technology_device'].reduce((a,k)=> a + (Array.isArray(obj?.[k])? obj[k].length:0),0);
                                const total = sum(acc.classroom || {}) + sum(acc.assessment || {});
                                return total > 0 ? `${total} accommodations` : 'No accommodations';
                              })()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 font-mono">{student.studentId}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{student.age}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{student.gradeLevel}</td>
                      <td className="px-5 py-4">
                        {student?.assignedGoals && student.assignedGoals.length > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">Created</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">Not created</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {(
                          student?.iep_plan_data && (
                            student.iep_plan_data.original_ai_draft?.plaafp_narrative ||
                            (student.iep_plan_data.original_ai_draft?.annual_goals && student.iep_plan_data.original_ai_draft.annual_goals.length > 0) ||
                            student.iep_plan_data.user_edited_version?.plaafp_narrative ||
                            (student.iep_plan_data.user_edited_version?.annual_goals && student.iep_plan_data.user_edited_version.annual_goals.length > 0)
                          )
                        ) ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">Generated</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/students/${student._id}`)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            title="IEP"
                          >
                            <FileText className="w-4 h-4" />
                            IEP
                          </button>
                          <button
                            onClick={() => router.push(`/services/${student._id}`)}
                            className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            title="View Recs"
                          >
                            <Zap className="w-4 h-4" />
                            View Recs
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(student)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
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
        <Modal title="Add Student" onClose={handleCloseModal} size={wizardStep === 2 ? 'wizard' : 'lg'} noScroll>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col gap-6">
            {wizardStep === 1 ? (
              <>
                {/* PDF Upload Feature Card */}
                <div className="flex items-center justify-between p-5 bg-blue-50/80 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Auto-fill from PDF</p>
                      <p className="text-xs text-slate-600 mt-0.5">Upload a report or intake form to extract student information</p>
                    </div>
                  </div>
                  <div>
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
                      className={`inline-flex items-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors ${uploading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {uploading ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {uploading ? 'Analyzing...' : 'Upload PDF'}
                    </label>
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
                      className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Student ID</label>
                    <input
                      type="text"
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Grade Level</label>
                    <select
                      value={formData.gradeLevel}
                      onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
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
                    allowMultiplePerGroup
                  />

                  {formData.strengths.includes('Others') && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">Other Strengths (describe)</label>
                      <input
                        type="text"
                        value={formData.strengthsOther}
                        onChange={(e) => setFormData({ ...formData, strengthsOther: e.target.value })}
                        className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
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
                        className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                        placeholder="Describe other weaknesses..."
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Additional Student Context (Optional)</label>
                    <textarea
                      value={formData.studentNotes}
                      onChange={(e) => {
                        const val = e.target.value.slice(0, 500);
                        setFormData({ ...formData, studentNotes: val });
                      }}
                      placeholder="e.g., learning style, interests, triggers, what supports work best…"
                      maxLength={500}
                      className="w-full min-h-[96px] px-3 pt-2 pb-2 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                    />
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                      <div>Optional notes to help tailor the IEP.</div>
                      <div>{formData.studentNotes ? formData.studentNotes.length : 0}/500</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        disabled
                        className="w-full h-11 px-3 border border-gray-200 rounded-md bg-gray-50 text-sm text-slate-600 cursor-not-allowed min-w-0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">Instructional Setting</label>
                      <select
                        value={formData.instructionalSetting}
                        onChange={(e) => setFormData({ ...formData, instructionalSetting: e.target.value })}
                        className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                        required
                      >
                        <option value="">Select setting...</option>
                          {formData.instructionalSetting && !INSTRUCTIONAL_SETTINGS.includes(formData.instructionalSetting) && (
                            <option value={formData.instructionalSetting}>{formData.instructionalSetting}</option>
                          )}
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
                          className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                          required
                        >
                          <option value="">Select level...</option>
                          {formData.performanceQuantitative && !QUANTITATIVE_LEVELS.includes(formData.performanceQuantitative) && (
                            <option value={formData.performanceQuantitative}>{formData.performanceQuantitative}</option>
                          )}
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
                          className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                          required
                        >
                          <option value="">Select level...</option>
                          {formData.performanceNarrative && !NARRATIVE_LEVELS.includes(formData.performanceNarrative) && (
                            <option value={formData.performanceNarrative}>{formData.performanceNarrative}</option>
                          )}
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
              </>
            ) : (
              <div className="pt-4 border-t">
                <AccommodationsModal
                  inline
                  hideFooter
                  initial={accommodations}
                  onApply={(data) => {
                    setAccommodations(data);
                  }}
                  onClose={() => {}}
                />
              </div>
            )}
            </div>

            {/* Footer - fixed at modal bottom */}
            <div className="flex-shrink-0 border-t border-gray-100 bg-white px-6 py-4 flex justify-between items-center">
              <div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="h-11 px-4 text-sm font-medium text-slate-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  Cancel
                </button>
              </div>
              <div>
                {wizardStep === 1 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="h-11 px-5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    Next: Accommodations
                  </button>
                ) : (
                  <div className="flex gap-3 flex-wrap items-center">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="h-11 px-4 text-sm font-medium text-slate-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="h-11 px-5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      Add Student
                    </button>
                  </div>
                )}
              </div>
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
