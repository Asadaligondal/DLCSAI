"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import MultiSelect from '@/components/MultiSelect';
import AccommodationsModal from '@/components/AccommodationsModal';
import MeetingPurposeCollapsible from '@/components/MeetingPurposeCollapsible';
import { Plus, Search, Trash2, Upload, FileText, Users, ChevronDown, Image as ImageIcon, Pencil, LayoutGrid, List, ArrowUpDown, ChevronLeft, ChevronRight, X, LayoutDashboard } from 'lucide-react';
import WorkspaceBreadcrumb from '@/components/WorkspaceBreadcrumb';
import WorkspaceTopBar from '@/components/WorkspaceTopBar';
import ActivityFeed from '../components/ActivityFeed';
import { DOMAIN_AREA_OPTIONS } from '@/lib/domainAreas';

/** Map AI-extracted date text to YYYY-MM-DD for date inputs. */
function normalizeExtractedDate(val) {
  if (!val || val === 'add manually') return null;
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const mm = m[1].padStart(2, '0');
    const dd = m[2].padStart(2, '0');
    return `${m[3]}-${mm}-${dd}`;
  }
  return null;
}

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
  const [uploadDropdownOpen, setUploadDropdownOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const uploadDropdownRef = useRef(null);

  // Table enhancements
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterIEP, setFilterIEP] = useState('');
  const [filterExceptionality, setFilterExceptionality] = useState('');
  const [filterCaseManager, setFilterCaseManager] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (!uploadDropdownOpen) return;
    const handleClick = (e) => {
      if (uploadDropdownRef.current && !uploadDropdownRef.current.contains(e.target)) {
        setUploadDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [uploadDropdownOpen]);
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    age: '',
    dateOfBirth: '',
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
    areaOfNeed: '',
    studentNotes: '',
    schoolName: '',
    address: '',
    parentGuardian1: '',
    parentGuardian2: '',
    caseManager: '',
    primaryExceptionality: '',
    relatedServicesTherapy: '',
    domainAreas: [],
    originalMeetingPlanDate: '',
    initiationDate: '',
    durationDate: '',
    reviewDueDate: '',
    reevaluationDueDate: '',
    amendmentDate: '',
    previouslyAmended: '',
    meetingPurpose: '',
    meetingPurposeTags: [],
    meetingPurposeOther: '',
    domainsTransitionAreas: '',
    associatedPlans: '',
  });

  const calcAgeFromDob = (dob) => {
    if (!dob) return { years: '', months: '', numeric: '' };
    const birth = new Date(dob);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0) { years--; months += 12; }
    if (now.getDate() < birth.getDate()) { months--; if (months < 0) { years--; months += 12; } }
    return { years, months, numeric: years };
  };
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
      dateOfBirth: '',
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
      studentNotes: '',
      schoolName: '',
      address: '',
      parentGuardian1: '',
      parentGuardian2: '',
      caseManager: '',
      primaryExceptionality: '',
      relatedServicesTherapy: '',
      domainAreas: [],
      originalMeetingPlanDate: '',
      initiationDate: '',
      durationDate: '',
      reviewDueDate: '',
      reevaluationDueDate: '',
      amendmentDate: '',
      previouslyAmended: '',
      meetingPurpose: '',
      meetingPurposeTags: [],
      meetingPurposeOther: '',
      domainsTransitionAreas: '',
      associatedPlans: '',
    });
    setWizardStep(1);
    setShowModal(true);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    const toDateInput = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');
    const dob = student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '';
    const ageFromDob = dob ? calcAgeFromDob(dob) : null;
    setFormData({
      name: student.name || '',
      studentId: student.studentId || '',
      age: ageFromDob ? String(ageFromDob.numeric) : (student.age != null ? String(student.age) : ''),
      dateOfBirth: dob,
      gradeLevel: student.gradeLevel || '',
      disabilities: Array.isArray(student.disabilities) ? student.disabilities : [],
      strengths: Array.isArray(student.strengths) ? student.strengths : [],
      strengthsOther: '',
      weaknesses: Array.isArray(student.weaknesses) ? student.weaknesses : [],
      weaknessesOther: '',
      areaOfNeedOther: '',
      state: student.state || 'Florida',
      instructionalSetting: student.instructionalSetting || '',
      performanceQuantitative: student.performanceQuantitative || '',
      performanceNarrative: student.performanceNarrative || '',
      areaOfNeed: student.areaOfNeed || '',
      studentNotes: student.studentNotes || '',
      schoolName: student.schoolName || '',
      address: student.address || '',
      parentGuardian1: student.parentGuardian1 || '',
      parentGuardian2: student.parentGuardian2 || '',
      caseManager: student.caseManager || '',
      primaryExceptionality: student.primaryExceptionality || '',
      relatedServicesTherapy: student.relatedServicesTherapy || '',
      domainAreas: Array.isArray(student.domainAreas) ? student.domainAreas : [],
      originalMeetingPlanDate: toDateInput(student.originalMeetingPlanDate),
      initiationDate: toDateInput(student.initiationDate),
      durationDate: toDateInput(student.durationDate),
      reviewDueDate: toDateInput(student.reviewDueDate),
      reevaluationDueDate: toDateInput(student.reevaluationDueDate),
      amendmentDate: toDateInput(student.amendmentDate),
      previouslyAmended: student.previouslyAmended || '',
      meetingPurpose: student.meetingPurpose || '',
      meetingPurposeTags: Array.isArray(student.meetingPurposeTags) ? student.meetingPurposeTags : [],
      meetingPurposeOther: student.meetingPurposeOther || '',
      domainsTransitionAreas: student.domainsTransitionAreas || '',
      associatedPlans: student.associatedPlans || '',
    });
    if (student.student_accommodations) {
      setAccommodations(student.student_accommodations);
    }
    setWizardStep(1);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setUploadDropdownOpen(false);
    setEditingStudent(null);
    setFormData({
      name: '',
      studentId: '',
      age: '',
      dateOfBirth: '',
      gradeLevel: '',
      disabilities: [],
      strengths: [],
      weaknesses: [],
      state: 'Florida',
      instructionalSetting: '',
      performanceQuantitative: '',
      performanceNarrative: '',
      areaOfNeed: '',
      studentNotes: '',
      schoolName: '',
      address: '',
      parentGuardian1: '',
      parentGuardian2: '',
      caseManager: '',
      primaryExceptionality: '',
      relatedServicesTherapy: '',
      domainAreas: [],
      originalMeetingPlanDate: '',
      initiationDate: '',
      durationDate: '',
      reviewDueDate: '',
      reevaluationDueDate: '',
      amendmentDate: '',
      previouslyAmended: '',
      meetingPurpose: '',
      meetingPurposeTags: [],
      meetingPurposeOther: '',
      domainsTransitionAreas: '',
      associatedPlans: '',
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or image file (JPG, PNG, GIF, WebP)');
      return;
    }

    setUploading(true);
    setUploadDropdownOpen(false);
    const isImage = file.type.startsWith('image/');
    const toastId = toast.loading(`Analyzing ${isImage ? 'image' : 'document'}...`);

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
            areaOfNeed: extracted.areaOfNeed !== 'add manually' ? extracted.areaOfNeed : prev.areaOfNeed,
            schoolName: extracted.schoolName !== 'add manually' ? extracted.schoolName : prev.schoolName,
            address: extracted.address !== 'add manually' ? extracted.address : prev.address,
            parentGuardian1: extracted.parentGuardian1 !== 'add manually' ? extracted.parentGuardian1 : prev.parentGuardian1,
            parentGuardian2: extracted.parentGuardian2 !== 'add manually' ? extracted.parentGuardian2 : prev.parentGuardian2,
            caseManager: extracted.caseManager !== 'add manually' ? extracted.caseManager : prev.caseManager,
            primaryExceptionality:
              extracted.primaryExceptionality !== 'add manually' ? extracted.primaryExceptionality : prev.primaryExceptionality,
            relatedServicesTherapy:
              extracted.relatedServicesTherapy !== 'add manually' ? extracted.relatedServicesTherapy : prev.relatedServicesTherapy,
            originalMeetingPlanDate:
              normalizeExtractedDate(extracted.originalMeetingPlanDate) ?? prev.originalMeetingPlanDate,
            initiationDate: normalizeExtractedDate(extracted.initiationDate) ?? prev.initiationDate,
            durationDate: normalizeExtractedDate(extracted.durationDate) ?? prev.durationDate,
            reviewDueDate: normalizeExtractedDate(extracted.reviewDueDate) ?? prev.reviewDueDate,
            reevaluationDueDate: normalizeExtractedDate(extracted.reevaluationDueDate) ?? prev.reevaluationDueDate,
            amendmentDate: normalizeExtractedDate(extracted.amendmentDate) ?? prev.amendmentDate,
            previouslyAmended:
              extracted.previouslyAmended !== 'add manually' ? extracted.previouslyAmended : prev.previouslyAmended,
            meetingPurpose: extracted.meetingPurpose !== 'add manually' ? extracted.meetingPurpose : prev.meetingPurpose,
            domainsTransitionAreas:
              extracted.domainsTransitionAreas !== 'add manually' ? extracted.domainsTransitionAreas : prev.domainsTransitionAreas,
            associatedPlans: extracted.associatedPlans !== 'add manually' ? extracted.associatedPlans : prev.associatedPlans,
            domainAreas: Array.isArray(extracted.domainAreas)
              ? extracted.domainAreas.filter((d) => DOMAIN_AREA_OPTIONS.includes(d))
              : prev.domainAreas,
          };
        });

        // If the AI returned any accommodations block, store it locally so user can review
        if (extracted.student_accommodations) {
          setAccommodations(extracted.student_accommodations);
        }

        toast.update(toastId, {
          render: 'Form auto-filled from document!',
          type: 'success',
          isLoading: false,
          autoClose: 3000
        });
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.update(toastId, {
        render: error.response?.data?.message || 'Failed to parse file',
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
      const ageNum = formData.dateOfBirth
        ? calcAgeFromDob(formData.dateOfBirth).numeric
        : parseInt(formData.age, 10);
      const payload = {
        ...formData,
        age: typeof ageNum === 'number' && !Number.isNaN(ageNum) ? ageNum : parseInt(formData.age, 10),
        dateOfBirth: formData.dateOfBirth || null,
      };
      if (accommodations) payload.student_accommodations = accommodations;

      if (editingStudent) {
        await axios.put(`/api/students/${editingStudent._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Student updated successfully');
      } else {
        await axios.post('/api/students', payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Student added successfully');
      }
      fetchStudents();
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || (editingStudent ? 'Failed to update student' : 'Failed to add student'));
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

  // Derive filter options from data
  const uniqueGrades = [...new Set(students.map(s => s.gradeLevel).filter(Boolean))].sort();
  const uniqueExceptionalities = [...new Set(students.flatMap(s => s.disabilities || []).filter(Boolean))].sort();
  const uniqueCaseManagers = [...new Set(students.map(s => s.caseManager).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));

  const getIEPStatus = (s) => {
    const iep = s?.iep_plan_data;
    if (!iep) return 'pending';
    if (iep.is_reviewed) return 'reviewed';
    const has = iep.original_ai_draft?.plaafp_narrative || iep.original_ai_draft?.annual_goals?.length > 0 || iep.user_edited_version?.plaafp_narrative || iep.user_edited_version?.annual_goals?.length > 0;
    return has ? 'generated' : 'pending';
  };

  const filteredStudents = students
    .filter((s) => {
      const q = searchQuery.trim().toLowerCase();
      const nm = (s.name && String(s.name).toLowerCase()) || '';
      const sid = (s.studentId && String(s.studentId).toLowerCase()) || '';
      const cm = (s.caseManager && String(s.caseManager).toLowerCase()) || '';
      const matchSearch =
        !q ||
        nm.includes(q) ||
        sid.includes(q) ||
        cm.includes(q);
      const matchGrade = !filterGrade || s.gradeLevel === filterGrade;
      const matchIEP = !filterIEP || getIEPStatus(s) === filterIEP;
      const matchExc = !filterExceptionality || (s.disabilities || []).includes(filterExceptionality);
      const matchCaseMgr =
        !filterCaseManager ||
        (s.caseManager && String(s.caseManager) === filterCaseManager);
      return matchSearch && matchGrade && matchIEP && matchExc && matchCaseMgr;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = (a.name || '').localeCompare(b.name || ''); break;
        case 'age': cmp = (a.age || 0) - (b.age || 0); break;
        case 'grade': cmp = (a.gradeLevel || '').localeCompare(b.gradeLevel || ''); break;
        case 'iep': cmp = getIEPStatus(a).localeCompare(getIEPStatus(b)); break;
        case 'createdAt': {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          cmp = ta - tb;
          if (cmp === 0) cmp = String(b._id || '').localeCompare(String(a._id || ''));
          break;
        }
        default: cmp = 0;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedStudents = filteredStudents.slice((safePage - 1) * pageSize, safePage * pageSize);

  const activeFilters = [filterGrade, filterIEP, filterExceptionality, filterCaseManager].filter(Boolean).length;
  const clearFilters = () => {
    setFilterGrade('');
    setFilterIEP('');
    setFilterExceptionality('');
    setFilterCaseManager('');
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      // Newest-first when sorting by date; A→Z for name/grade, etc.
      setSortDir(key === 'createdAt' ? 'desc' : 'asc');
    }
  };

  const formatAdded = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-canvas text-slate-800">
      <Sidebar user={user} onLogout={handleLogout} />

      <div className="flex-1 overflow-auto">
        <WorkspaceTopBar
          user={user}
          left={
            <WorkspaceBreadcrumb
              items={[
                { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
                { label: 'Students', icon: Users },
              ]}
              className="mb-0"
            />
          }
        />

        <main className="p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-5">
            {/* Page header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Students</h1>
                <p className="text-sm text-slate-500 mt-0.5">{students.length} student{students.length !== 1 ? 's' : ''} enrolled</p>
              </div>
              <button
                onClick={handleOpenModal}
                className="flex items-center gap-2 h-10 px-5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              >
                <Plus className="w-4 h-4" />
                Add Student
              </button>
            </div>

            {/* Quick Actions */}
            {/* Main content: table + activity feed */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">
              {/* Student table card */}
              <div className="bg-white rounded-xl shadow-card border border-slate-200/60 overflow-hidden">
                {/* Toolbar: search + filters + view toggle */}
                <div className="px-5 py-3.5 border-b border-slate-100 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by name, ID, or case manager…"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-9 pr-4 h-9 rounded-lg text-sm bg-slate-50 border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all"
                      />
                    </div>

                    {/* Filter chips */}
                    <select
                      value={filterGrade}
                      onChange={(e) => { setFilterGrade(e.target.value); setCurrentPage(1); }}
                      className="h-9 pl-3 pr-7 rounded-lg text-sm bg-slate-50 border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all appearance-none cursor-pointer"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                    >
                      <option value="">All Grades</option>
                      {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>

                    <select
                      value={filterIEP}
                      onChange={(e) => { setFilterIEP(e.target.value); setCurrentPage(1); }}
                      className="h-9 pl-3 pr-7 rounded-lg text-sm bg-slate-50 border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all appearance-none cursor-pointer"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                    >
                      <option value="">All IEP Status</option>
                      <option value="generated">Generated</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="pending">Pending</option>
                    </select>

                    <select
                      value={filterExceptionality}
                      onChange={(e) => { setFilterExceptionality(e.target.value); setCurrentPage(1); }}
                      className="h-9 pl-3 pr-7 rounded-lg text-sm bg-slate-50 border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all appearance-none cursor-pointer max-w-[200px]"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                    >
                      <option value="">All Exceptionalities</option>
                      {uniqueExceptionalities.map(e => <option key={e} value={e}>{e.length > 30 ? e.slice(0, 30) + '...' : e}</option>)}
                    </select>

                    <select
                      value={filterCaseManager}
                      onChange={(e) => { setFilterCaseManager(e.target.value); setCurrentPage(1); }}
                      className="h-9 pl-3 pr-7 rounded-lg text-sm bg-slate-50 border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all appearance-none cursor-pointer max-w-[200px]"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                    >
                      <option value="">All Case Managers</option>
                      {uniqueCaseManagers.map((m) => (
                        <option key={m} value={m}>{m.length > 36 ? `${m.slice(0, 36)}…` : m}</option>
                      ))}
                    </select>

                    {activeFilters > 0 && (
                      <button onClick={clearFilters} className="flex items-center gap-1 h-9 px-3 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                        <X className="w-3.5 h-3.5" />
                        Clear ({activeFilters})
                      </button>
                    )}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* View toggle */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Table view"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('card')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Card view"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Results count */}
                  {(searchQuery || activeFilters > 0) && (
                    <p className="text-xs text-slate-400">{filteredStudents.length} result{filteredStudents.length !== 1 ? 's' : ''} found</p>
                  )}
                </div>

                {/* TABLE VIEW */}
                {viewMode === 'table' ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {[
                            { key: 'name',  label: 'Name' },
                            { key: null,    label: 'Case Manager' },
                            { key: null,    label: 'Student ID' },
                            { key: 'createdAt', label: 'Added' },
                            { key: 'iep',   label: 'IEP Plan' },
                          ].map(({ key, label }) => (
                            <th
                              key={label}
                              className={`text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider ${key ? 'cursor-pointer select-none hover:text-slate-700 transition-colors' : ''}`}
                              onClick={() => key && handleSort(key)}
                            >
                              <span className="inline-flex items-center gap-1">
                                {label}
                                {key && sortKey === key && (
                                  <ArrowUpDown className={`w-3 h-3 text-primary-500 ${sortDir === 'desc' ? 'rotate-180' : ''} transition-transform`} />
                                )}
                              </span>
                            </th>
                          ))}
                          <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {loading ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-20 text-center">
                              <div className="flex flex-col items-center gap-3 text-slate-400">
                                <svg className="animate-spin h-6 w-6 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-sm font-medium">Loading students...</span>
                              </div>
                            </td>
                          </tr>
                        ) : paginatedStudents.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-20 text-center">
                              <div className="flex flex-col items-center gap-3 text-slate-400">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                  <Users className="w-6 h-6 text-slate-300" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-slate-600">No students found</div>
                                  <div className="text-xs text-slate-400 mt-0.5">{activeFilters > 0 ? 'Try adjusting your filters' : 'Add a student to get started'}</div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          paginatedStudents.map((student) => {
                            const status = getIEPStatus(student);
                            const iepPath = `/students/${student._id}`;
                            return (
                              <tr
                                key={student._id}
                                className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                                onClick={() => router.push(iepPath)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    router.push(iepPath);
                                  }
                                }}
                                role="link"
                                tabIndex={0}
                              >
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <span className="font-bold text-sm">{student.name.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div className="text-sm font-semibold text-slate-900">{student.name}</div>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-sm text-slate-600 max-w-[160px]">
                                  <span className="line-clamp-2" title={student.caseManager || ''}>{student.caseManager || '—'}</span>
                                </td>
                                <td className="px-5 py-3.5 text-sm text-slate-600 font-mono tabular-nums">{student.studentId}</td>
                                <td className="px-5 py-3.5 text-sm text-slate-600 tabular-nums whitespace-nowrap">{formatAdded(student.createdAt)}</td>
                                <td className="px-5 py-3.5">
                                  {status === 'reviewed' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Reviewed
                                    </span>
                                  ) : status === 'generated' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Generated
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Pending
                                    </span>
                                  )}
                                </td>
                                <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button type="button" onClick={() => handleEditStudent(student)} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-[13px] font-medium transition-colors" title="Edit">
                                      <Pencil className="w-3.5 h-3.5" />Edit
                                    </button>
                                    <button type="button" onClick={() => router.push(iepPath)} className="flex items-center gap-1.5 px-3 py-1.5 text-primary-700 hover:bg-primary-50 rounded-md text-[13px] font-medium transition-colors" title="IEP">
                                      <FileText className="w-3.5 h-3.5" />IEP
                                    </button>
                                    <button type="button" onClick={() => setDeleteConfirm(student)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* CARD VIEW */
                  <div className="p-5">
                    {loading ? (
                      <div className="flex flex-col items-center gap-3 py-20 text-slate-400">
                        <svg className="animate-spin h-6 w-6 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm font-medium">Loading students...</span>
                      </div>
                    ) : paginatedStudents.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 py-20 text-slate-400">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center"><Users className="w-6 h-6 text-slate-300" /></div>
                        <div className="text-sm font-semibold text-slate-600">No students found</div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedStudents.map((student) => {
                          const status = getIEPStatus(student);
                          const hasGoals = student?.assignedGoals?.length > 0;
                          return (
                            <div key={student._id} className="border border-slate-200/60 rounded-xl p-4 hover:shadow-md hover:border-slate-300/60 transition-all group">
                              <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="font-bold text-base">{student.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-semibold text-slate-900 truncate">{student.name}</h3>
                                  <p className="text-[12px] text-slate-500">ID: {student.studentId}</p>
                                  {student.caseManager && (
                                    <p className="text-[11px] text-slate-500 mt-0.5 truncate" title={student.caseManager}>CM: {student.caseManager}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-[12px] text-slate-500 mb-3">
                                <span>{student.gradeLevel}</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span>{student.age} yrs</span>
                                {student.disabilities?.[0] && (
                                  <>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                    <span className="truncate max-w-[120px]">{student.disabilities[0]}</span>
                                  </>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mb-4">
                                {hasGoals ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Goals
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />No Goals
                                  </span>
                                )}
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  status === 'reviewed' ? 'bg-blue-50 text-blue-700' : status === 'generated' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${status === 'reviewed' ? 'bg-blue-500' : status === 'generated' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                  {status === 'reviewed' ? 'Reviewed' : status === 'generated' ? 'IEP Ready' : 'No IEP'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                                <button onClick={() => handleEditStudent(student)} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-[12px] font-medium transition-colors">
                                  <Pencil className="w-3 h-3" />Edit
                                </button>
                                <button onClick={() => router.push(`/students/${student._id}`)} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-primary-700 hover:bg-primary-50 rounded-md text-[12px] font-medium transition-colors">
                                  <FileText className="w-3 h-3" />IEP
                                </button>
                                <button onClick={() => setDeleteConfirm(student)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Pagination */}
                {!loading && filteredStudents.length > 0 && (
                  <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span>Show</span>
                      <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                        className="h-8 pl-2 pr-6 rounded-md text-sm bg-slate-50 border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all appearance-none cursor-pointer"
                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center' }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                      <span>of {filteredStudents.length}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={safePage <= 1}
                        className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                        .reduce((acc, p, i, arr) => {
                          if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item, i) =>
                          item === '...' ? (
                            <span key={`dots-${i}`} className="px-1 text-slate-400 text-sm">...</span>
                          ) : (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setCurrentPage(item)}
                              className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                                item === safePage ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {item}
                            </button>
                          )
                        )}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={safePage >= totalPages}
                        className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Activity Feed (right sidebar) */}
              <div className="hidden xl:block">
                <ActivityFeed students={students} />
              </div>
            </div>

            {/* Activity Feed (mobile - below table) */}
            <div className="xl:hidden">
              <ActivityFeed students={students} />
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <Modal title={editingStudent ? 'Edit Student' : 'Add Student'} onClose={handleCloseModal} size={wizardStep === 2 ? 'wizard' : 'lg'} noScroll>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col gap-6">
            {wizardStep === 1 ? (
              <>
                {/* Document Upload Feature Card */}
                <div className="flex items-center justify-between p-5 bg-blue-50/80 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Auto-fill from Document</p>
                      <p className="text-xs text-slate-600 mt-0.5">Upload a PDF or image to extract student information</p>
                    </div>
                  </div>
                  <div className="relative" ref={uploadDropdownRef}>
                    <input type="file" id="pdf-upload" accept="application/pdf" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                    <input type="file" id="image-upload" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/tiff" onChange={handleFileUpload} className="hidden" disabled={uploading} />

                    {uploading ? (
                      <div className="inline-flex items-center gap-2 h-10 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium opacity-70">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Analyzing...
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setUploadDropdownOpen(o => !o)}
                          className="inline-flex items-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          Upload
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${uploadDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {uploadDropdownOpen && (
                          <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-slate-200 shadow-float z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                            <button
                              type="button"
                              onClick={() => { document.getElementById('pdf-upload').click(); setUploadDropdownOpen(false); }}
                              className="flex items-center gap-2.5 px-3 py-2 w-full text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                              <FileText className="w-4 h-4 text-red-500" />
                              <div className="text-left">
                                <div className="font-medium">PDF Document</div>
                                <div className="text-[10px] text-slate-400">.pdf</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => { document.getElementById('image-upload').click(); setUploadDropdownOpen(false); }}
                              className="flex items-center gap-2.5 px-3 py-2 w-full text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                              <ImageIcon className="w-4 h-4 text-emerald-500" />
                              <div className="text-left">
                                <div className="font-medium">Image</div>
                                <div className="text-[10px] text-slate-400">.jpg, .png, .gif, .webp</div>
                              </div>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Form grid — matches Florida-style header: Student/School, then ID / Grade / DOB / Age */}
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
                    <label className="block text-xs font-medium text-slate-700 mb-2">School</label>
                    <input
                      type="text"
                      value={formData.schoolName}
                      onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                      placeholder="School or campus"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => {
                        const dob = e.target.value;
                        const { numeric } = calcAgeFromDob(dob);
                        setFormData({ ...formData, dateOfBirth: dob, age: numeric !== '' ? String(numeric) : '' });
                      }}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Age</label>
                    {formData.dateOfBirth ? (
                      <div className="w-full h-11 px-3 border border-gray-200 rounded-md bg-slate-50 text-sm text-slate-900 flex items-center">
                        {(() => {
                          const { years } = calcAgeFromDob(formData.dateOfBirth);
                          return `${years} Year(s)`;
                        })()}
                      </div>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                        required
                      />
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Contact and exceptionalities (detail)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-2">Address</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                        placeholder="Mailing or home address"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">Parent / Guardian</label>
                      <input
                        type="text"
                        value={formData.parentGuardian1}
                        onChange={(e) => setFormData({ ...formData, parentGuardian1: e.target.value })}
                        className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">Parent / Guardian (second)</label>
                      <input
                        type="text"
                        value={formData.parentGuardian2}
                        onChange={(e) => setFormData({ ...formData, parentGuardian2: e.target.value })}
                        className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-2">Case Manager</label>
                      <input
                        type="text"
                        value={formData.caseManager}
                        onChange={(e) => setFormData({ ...formData, caseManager: e.target.value })}
                        className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                        placeholder="Staff managing this student’s case"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-medium text-slate-700 mb-2">Primary exceptionality</label>
                      <select
                        value={formData.primaryExceptionality}
                        onChange={(e) => setFormData({ ...formData, primaryExceptionality: e.target.value })}
                        className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                      >
                        <option value="">Select primary exceptionality…</option>
                        {DISABILITIES_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-2">Related services / therapy</label>
                      <textarea
                        value={formData.relatedServicesTherapy}
                        onChange={(e) => setFormData({ ...formData, relatedServicesTherapy: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0 resize-y"
                        placeholder="e.g. Speech, OT, counseling"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">IEP key dates</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      ['originalMeetingPlanDate', 'Original meeting / plan date'],
                      ['initiationDate', 'Initiation date'],
                      ['durationDate', 'Duration date'],
                      ['reviewDueDate', 'Review due date'],
                      ['reevaluationDueDate', 'Reevaluation due date'],
                    ].map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-slate-700 mb-2">{label}</label>
                        <input
                          type="date"
                          value={formData[key]}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                          className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Amendment and meeting</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">Amendment date</label>
                      <input
                        type="date"
                        value={formData.amendmentDate}
                        onChange={(e) => setFormData({ ...formData, amendmentDate: e.target.value })}
                        className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">Previously amended</label>
                      <select
                        value={formData.previouslyAmended}
                        onChange={(e) => setFormData({ ...formData, previouslyAmended: e.target.value })}
                        className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                      >
                        <option value="">—</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-2">Meeting purpose</label>
                      <MeetingPurposeCollapsible
                        idPrefix="dash-mp"
                        tags={formData.meetingPurposeTags || []}
                        otherText={formData.meetingPurposeOther || ''}
                        onChange={(patch) => setFormData({ ...formData, ...patch })}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Program</p>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">Domain(s) / transition service activity area(s)</label>
                      <textarea
                        value={formData.domainsTransitionAreas}
                        onChange={(e) => setFormData({ ...formData, domainsTransitionAreas: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0 resize-y"
                        placeholder="Comma-separated"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">Associated Plan</label>
                      <input
                        type="text"
                        value={formData.associatedPlans}
                        onChange={(e) => setFormData({ ...formData, associatedPlans: e.target.value })}
                        className="w-full h-11 px-3 border border-gray-200 rounded-md bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
                        placeholder="e.g. IEP, 504"
                      />
                    </div>
                    <div className="col-span-2">
                      <MultiSelect
                        label="Domain area"
                        options={DOMAIN_AREA_OPTIONS}
                        value={formData.domainAreas}
                        onChange={(value) => setFormData({ ...formData, domainAreas: value })}
                        placeholder="Select domain area(s)…"
                      />
                    </div>
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
                      allowMultiplePerGroup
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
                      {editingStudent ? 'Save Changes' : 'Add Student'}
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
