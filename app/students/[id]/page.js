'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Navbar from '@/components/Navbar';
import MultiSelect from '@/components/MultiSelect';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Calendar,
  GraduationCap,
  Target,
  Wand2
} from 'lucide-react';

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

export default function StudentDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [originalAIPlan, setOriginalAIPlan] = useState(null);
  const [editablePlan, setEditablePlan] = useState(null);
  const [isReviewed, setIsReviewed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState('edited'); // 'original' or 'edited'
  const [hasExistingPlan, setHasExistingPlan] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    age: '',
    gradeLevel: '',
    disabilities: [],
    strengths: [],
    strengthsOther: '',
    weaknesses: [],
    weaknessesOther: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchStudent(token);
  }, [id, router]);

  const fetchStudent = async (token) => {
    try {
      const response = await axios.get(`/api/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const studentData = response.data.student;
      console.log('📥 Fetched student data:', studentData);
      console.log('📦 IEP plan data:', studentData.iep_plan_data);
      
      setStudent(studentData);
      setFormData({
        name: studentData.name,
        studentId: studentData.studentId,
        age: studentData.age,
        gradeLevel: studentData.gradeLevel,
        disabilities: studentData.disabilities || [],
        strengths: studentData.strengths || [],
        strengthsOther: studentData.strengthsOther || '',
        weaknesses: studentData.weaknesses || [],
        weaknessesOther: studentData.weaknessesOther || ''
      });

      // Load existing IEP plan if available
      if (studentData.iep_plan_data && studentData.iep_plan_data.original_ai_draft) {
        const originalDraft = studentData.iep_plan_data.original_ai_draft;
        
        // Check if there's actual content (not just empty structure)
        const hasActualContent = (
          originalDraft.plaafp_narrative && originalDraft.plaafp_narrative.trim().length > 0
        ) || (
          originalDraft.annual_goals && originalDraft.annual_goals.length > 0
        ) || (
          originalDraft.short_term_objectives && originalDraft.short_term_objectives.length > 0
        ) || (
          originalDraft.intervention_recommendations && originalDraft.intervention_recommendations.trim().length > 0
        );
        
        if (!hasActualContent) {
          console.log('⚠️ IEP structure exists but no actual content found - treating as no plan');
          setHasExistingPlan(false);
          return;
        }
        
        console.log('✅ Found existing IEP plan with content');
        console.log('📝 Original AI draft:', JSON.stringify(studentData.iep_plan_data.original_ai_draft, null, 2));
        console.log('✏️ User edited version:', JSON.stringify(studentData.iep_plan_data.user_edited_version, null, 2));
        
        const editedVersion = studentData.iep_plan_data.user_edited_version;
        
        // Ensure arrays exist and are not null/undefined
        const sanitizedOriginal = {
          plaafp_narrative: originalDraft?.plaafp_narrative || '',
          annual_goals: Array.isArray(originalDraft?.annual_goals) ? originalDraft.annual_goals : [],
          short_term_objectives: Array.isArray(originalDraft?.short_term_objectives) ? originalDraft.short_term_objectives : [],
          intervention_recommendations: originalDraft?.intervention_recommendations || ''
        };
        
        const sanitizedEdited = editedVersion ? {
          plaafp_narrative: editedVersion?.plaafp_narrative || '',
          annual_goals: Array.isArray(editedVersion?.annual_goals) ? editedVersion.annual_goals : [],
          short_term_objectives: Array.isArray(editedVersion?.short_term_objectives) ? editedVersion.short_term_objectives : [],
          intervention_recommendations: editedVersion?.intervention_recommendations || ''
        } : sanitizedOriginal;
        
        console.log('🔧 Sanitized original:', JSON.stringify(sanitizedOriginal, null, 2));
        console.log('🔧 Sanitized edited:', JSON.stringify(sanitizedEdited, null, 2));
        
        setHasExistingPlan(true);
        setOriginalAIPlan(sanitizedOriginal);
        setEditablePlan(sanitizedEdited);
        setIsReviewed(studentData.iep_plan_data.is_reviewed || false);
        setGeneratedPlan(sanitizedOriginal);
        setViewMode('edited');
      } else {
        console.log('❌ No existing IEP plan found');
        setHasExistingPlan(false);
      }
    } catch (error) {
      console.error('❌ Error fetching student:', error);
      toast.error('Failed to load student data');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      await axios.put(
        `/api/students/${id}`,
        {
          name: formData.name,
          studentId: formData.studentId,
          age: parseInt(formData.age),
          gradeLevel: formData.gradeLevel,
          disabilities: formData.disabilities,
          strengths: formData.strengths,
          strengthsOther: formData.strengthsOther,
          weaknesses: formData.weaknesses,
          weaknessesOther: formData.weaknessesOther
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Student updated successfully');
      setIsEditing(false);
      fetchStudent(token);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating student');
    }
  };

  const handleGenerateIEP = async () => {
    setIsGenerating(true);
    try {
      console.log('🎯 Generating IEP for student:', student);
      
      const response = await axios.post('/api/generate-iep', {
        studentGrade: student.gradeLevel,
        studentAge: student.age,
        areaOfNeed: student.areaOfNeed || 'General Education',
        currentPerformance: `Quantitative: ${student.performanceQuantitative || 'Not specified'}, Narrative: ${student.performanceNarrative || 'Not specified'}`,
        disabilityCategory: student.disabilities?.join(', ') || 'Not specified',
        instructionalSetting: student.instructionalSetting || 'General Education'
      });

      const aiData = response.data.data;
      console.log('🤖 AI Response Data:', JSON.stringify(aiData, null, 2));
      console.log('📝 PLAAFP length:', aiData.plaafp_narrative?.length);
      console.log('🎯 Annual goals count:', aiData.annual_goals?.length);
      console.log('🎯 Objectives count:', aiData.short_term_objectives?.length);
      console.log('💡 Recommendations length:', aiData.intervention_recommendations?.length);
      
      setGeneratedPlan(aiData);
      setOriginalAIPlan(aiData);
      setEditablePlan(aiData);
      setIsReviewed(false);
      setHasExistingPlan(true);
      setViewMode('edited');
      
      console.log('✅ State updated with AI data');
      toast.success('IEP Plan generated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate IEP plan');
      console.error('❌ Generate IEP error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetToOriginal = () => {
    if (originalAIPlan) {
      setEditablePlan(JSON.parse(JSON.stringify(originalAIPlan)));
      setIsReviewed(false);
      toast.info('Content reset to original AI version');
    }
  };

  const handleSaveChanges = async () => {
    try {
      console.log('💾 Saving IEP changes...');
      console.log('📝 Original AI Plan:', originalAIPlan);
      console.log('✏️ Editable Plan:', editablePlan);
      console.log('✅ Is Reviewed:', isReviewed);
      
      const response = await axios.put(
        `/api/students/${id}/save-iep`,
        {
          original_ai_draft: originalAIPlan,
          user_edited_version: editablePlan,
          is_reviewed: isReviewed
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      console.log('✅ Save response:', response.data);
      toast.success('Changes saved successfully');
    } catch (error) {
      console.error('❌ Save error:', error);
      toast.error('Failed to save changes');
    }
  };

  const handleExportToWord = async () => {
    if (!editablePlan || !isReviewed) return;

    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: 'Individualized Education Program (IEP)',
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            new Paragraph({
              text: `Student: ${student.name}`,
              spacing: { after: 200 }
            }),
            new Paragraph({
              text: `Student ID: ${student.studentId}`,
              spacing: { after: 200 }
            }),
            new Paragraph({
              text: `Grade: ${student.gradeLevel} | Age: ${student.age}`,
              spacing: { after: 400 }
            }),
            
            new Paragraph({
              text: 'Present Level of Academic Achievement and Functional Performance (PLAAFP)',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
              text: editablePlan.plaafp_narrative,
              spacing: { after: 400 }
            }),
            
            new Paragraph({
              text: 'Annual Goals',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            ...editablePlan.annual_goals.map((goal, index) => 
              new Paragraph({
                text: `${index + 1}. ${goal}`,
                spacing: { after: 200 },
                bullet: { level: 0 }
              })
            ),
            
            new Paragraph({
              text: 'Short-Term Objectives',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            ...editablePlan.short_term_objectives.map((obj, index) => 
              new Paragraph({
                text: `${index + 1}. ${obj}`,
                spacing: { after: 200 },
                bullet: { level: 0 }
              })
            ),
            
            new Paragraph({
              text: 'Intervention Recommendations',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
              text: editablePlan.intervention_recommendations,
              spacing: { after: 400 }
            })
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `IEP_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`);
      
      // Save to database
      await axios.put(
        `/api/students/${id}/save-iep`,
        {
          original_ai_draft: originalAIPlan,
          user_edited_version: editablePlan,
          is_reviewed: isReviewed
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      toast.success('IEP document exported successfully');
    } catch (error) {
      toast.error('Failed to export document');
      console.error('Export error:', error);
    }
  };

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-full px-8 py-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {!isEditing ? (
              <div className="space-y-4">
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
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-semibold text-gray-700">Disabilities</span>
                <p className="text-sm text-gray-600 mt-1">{student.disabilities?.join(', ') || 'None'}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-semibold text-gray-700">Strengths</span>
                <p className="text-sm text-gray-600 mt-1">{student.strengths?.join(', ') || 'None'}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-semibold text-gray-700">Weaknesses</span>
                <p className="text-sm text-gray-600 mt-1">{student.weaknesses?.join(', ') || 'None'}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Edit Student</h2>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                        <input
                          type="text"
                          value={formData.studentId}
                          onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                        <input
                          type="number"
                          value={formData.age}
                          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                        <input
                          type="text"
                          value={formData.gradeLevel}
                          onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
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

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">IEP Plan</h3>
              </div>

              {student.assignedGoals && student.assignedGoals.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {student.assignedGoals.map((goal) => (
                    <div key={goal._id} className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <h4 className="font-medium text-gray-900 text-sm">{goal.title}</h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{goal.description}</p>
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                        {goal.category}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm mb-4 text-center py-6 bg-gray-50 rounded-lg">No goals assigned yet</p>
              )}

              {!hasExistingPlan && (
                <button
                  onClick={handleGenerateIEP}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Wand2 className="w-4 h-4" />
                  {isGenerating ? 'Generating...' : 'Generate IEP Plan'}
                </button>
              )}
            </div>
          </div>
        </div>

        {hasExistingPlan && generatedPlan && editablePlan && (
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">IEP Plan - Review & Edit</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveChanges}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={handleResetToOriginal}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Reset to Original
                </button>
                <button
                  onClick={handleExportToWord}
                  disabled={!isReviewed}
                  className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium ${
                    isReviewed
                      ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Word Doc
                </button>
              </div>
            </div>

            {/* Toggle Between Original and Edited */}
            <div className="mb-6 flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setViewMode('original')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'original'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Original AI Draft (Read-Only)
              </button>
              <button
                onClick={() => setViewMode('edited')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'edited'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Current Edited Version
              </button>
            </div>

            {/* Display Content Based on View Mode */}
            {viewMode === 'original' ? (
              // Original AI Draft - Read Only
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">PLAAFP Narrative</h3>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{originalAIPlan.plaafp_narrative}</p>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Annual Goals</h3>
                  <ul className="space-y-2">
                    {originalAIPlan.annual_goals?.map((goal, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <p className="text-gray-700 text-sm pt-0.5">{goal}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Short-Term Objectives</h3>
                  <ul className="space-y-2">
                    {originalAIPlan.short_term_objectives?.map((objective, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <p className="text-gray-700 text-sm pt-0.5">{objective}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Intervention Recommendations</h3>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{originalAIPlan.intervention_recommendations}</p>
                </div>
              </div>
            ) : (
              // Current Edited Version - Editable
              <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">PLAAFP Narrative</h3>
                <textarea
                  value={editablePlan.plaafp_narrative}
                  onChange={(e) => setEditablePlan({ ...editablePlan, plaafp_narrative: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed"
                  rows="8"
                />
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Annual Goals</h3>
                <div className="space-y-3">
                  {editablePlan.annual_goals?.map((goal, index) => (
                    <div key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-2">
                        {index + 1}
                      </span>
                      <textarea
                        value={goal}
                        onChange={(e) => {
                          const newGoals = [...editablePlan.annual_goals];
                          newGoals[index] = e.target.value;
                          setEditablePlan({ ...editablePlan, annual_goals: newGoals });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        rows="2"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Short-Term Objectives</h3>
                <div className="space-y-3">
                  {editablePlan.short_term_objectives?.map((objective, index) => (
                    <div key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-2">
                        {index + 1}
                      </span>
                      <textarea
                        value={objective}
                        onChange={(e) => {
                          const newObjectives = [...editablePlan.short_term_objectives];
                          newObjectives[index] = e.target.value;
                          setEditablePlan({ ...editablePlan, short_term_objectives: newObjectives });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        rows="2"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Intervention Recommendations</h3>
                <textarea
                  value={editablePlan.intervention_recommendations}
                  onChange={(e) => setEditablePlan({ ...editablePlan, intervention_recommendations: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm leading-relaxed"
                  rows="6"
                />
              </div>

              <div className="p-4 border-2 border-yellow-400 bg-yellow-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="review-checkbox"
                    checked={isReviewed}
                    onChange={(e) => setIsReviewed(e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="review-checkbox" className="flex-1 text-sm text-gray-900 font-medium cursor-pointer">
                    I have reviewed this content for accuracy and professional standards. This IEP plan meets Florida Department of Education requirements and is ready for export.
                  </label>
                </div>
              </div>
            </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
