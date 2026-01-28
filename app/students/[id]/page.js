"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Navbar from '@/components/Navbar';
import MultiSelect from '@/components/MultiSelect';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { ArrowLeft, Save } from 'lucide-react';

import StudentInfoHeader from './components/StudentInfoHeader';
import IEPPlanEditor from './components/IEPPlanEditor';
import GoalsObjectivesSection from './components/GoalsObjectivesSection';
import { HeaderActions, FooterActions } from './components/InterventionsAndFooterActions';

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
          intervention_recommendations: originalDraft?.intervention_recommendations || '',
          // new grouped fields returned by LLM (camelCase)
          annualGoalsByExceptionality: Array.isArray(originalDraft?.annualGoalsByExceptionality) ? originalDraft.annualGoalsByExceptionality : Array.isArray(originalDraft?.annual_goals_by_exceptionality) ? originalDraft.annual_goals_by_exceptionality : [],
          shortTermObjectivesByExceptionality: Array.isArray(originalDraft?.shortTermObjectivesByExceptionality) ? originalDraft.shortTermObjectivesByExceptionality : Array.isArray(originalDraft?.short_term_objectives_by_exceptionality) ? originalDraft.short_term_objectives_by_exceptionality : []
        };
        
        const sanitizedEdited = editedVersion ? {
          plaafp_narrative: editedVersion?.plaafp_narrative || '',
          annual_goals: Array.isArray(editedVersion?.annual_goals) ? editedVersion.annual_goals : [],
          short_term_objectives: Array.isArray(editedVersion?.short_term_objectives) ? editedVersion.short_term_objectives : [],
          intervention_recommendations: editedVersion?.intervention_recommendations || '',
          // preserve grouped fields when present
          annualGoalsByExceptionality: Array.isArray(editedVersion?.annualGoalsByExceptionality) ? editedVersion.annualGoalsByExceptionality : Array.isArray(editedVersion?.annual_goals_by_exceptionality) ? editedVersion.annual_goals_by_exceptionality : [],
          shortTermObjectivesByExceptionality: Array.isArray(editedVersion?.shortTermObjectivesByExceptionality) ? editedVersion.shortTermObjectivesByExceptionality : Array.isArray(editedVersion?.short_term_objectives_by_exceptionality) ? editedVersion.short_term_objectives_by_exceptionality : []
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
        ,
        exceptionalities: Array.isArray(student.disabilities) ? student.disabilities : []
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

  // Remove a goal from the editable plan
  const removeGoal = (index) => {
    const newGoals = Array.isArray(editablePlan?.annual_goals) ? [...editablePlan.annual_goals] : [];
    newGoals.splice(index, 1);
    setEditablePlan({ ...editablePlan, annual_goals: newGoals });
  };

  // Remove a short-term objective from the editable plan
  const removeObjective = (index) => {
    const newObjectives = Array.isArray(editablePlan?.short_term_objectives)
      ? [...editablePlan.short_term_objectives]
      : [];
    newObjectives.splice(index, 1);
    setEditablePlan({ ...editablePlan, short_term_objectives: newObjectives });
  };

  // Update a specific annual goal text (keeps same behavior)
  const updateGoal = (index, text) => {
    const newGoals = Array.isArray(editablePlan?.annual_goals) ? [...editablePlan.annual_goals] : [];
    newGoals[index] = text;
    setEditablePlan({ ...editablePlan, annual_goals: newGoals });
  };

  // Update a specific short-term objective text
  const updateObjective = (index, text) => {
    const newObjectives = Array.isArray(editablePlan?.short_term_objectives)
      ? [...editablePlan.short_term_objectives]
      : [];
    newObjectives[index] = text;
    setEditablePlan({ ...editablePlan, short_term_objectives: newObjectives });
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

        <StudentInfoHeader
          student={student}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          formData={formData}
          setFormData={setFormData}
          handleUpdate={handleUpdate}
          isGenerating={isGenerating}
          handleGenerateIEP={handleGenerateIEP}
          hasExistingPlan={hasExistingPlan}
          disabilitiesOptions={DISABILITIES_OPTIONS}
          strengthsOptions={STRENGTHS_OPTIONS}
          weaknessesOptions={WEAKNESSES_OPTIONS}
        />

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
                {/* Goals & Objectives grouped by Exceptionality (if provided) */}
                {originalAIPlan.annualGoalsByExceptionality && originalAIPlan.annualGoalsByExceptionality.length > 0 && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Goals & Objectives by Exceptionality</h3>
                    <div className="space-y-4">
                      {originalAIPlan.annualGoalsByExceptionality.map((group) => (
                        <div key={group.exceptionality} className="p-3 bg-white border border-gray-100 rounded">
                          <div className="text-sm font-medium text-gray-800 mb-2">{group.exceptionality}</div>
                          <div className="grid grid-cols-1 gap-2">
                            {group.goals?.map((g, gi) => (
                              <div key={`g-${g.referenceId}-${gi}`} className="flex gap-3 items-start">
                                <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-1">{parseInt(g.referenceId, 10) + 1}</div>
                                <p className="text-gray-700 text-sm">{g.goal}</p>
                              </div>
                            ))}
                            {originalAIPlan.shortTermObjectivesByExceptionality && originalAIPlan.shortTermObjectivesByExceptionality.length > 0 && (
                              <div className="mt-3">
                                <div className="text-xs font-medium text-gray-600 mb-2">Short-Term Objectives</div>
                                <div className="space-y-2">
                                  { (originalAIPlan.shortTermObjectivesByExceptionality.find(sg => sg.exceptionality === group.exceptionality)?.objectives || []).map((o) => (
                                    <div key={`o-${o.referenceId}`} className="flex gap-3 items-start">
                                      <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-1">{parseInt(o.referenceId, 10) + 1}</div>
                                      <p className="text-gray-700 text-sm">{o.objective}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

              {hasExistingPlan && generatedPlan && editablePlan && (
                <IEPPlanEditor
                  originalAIPlan={originalAIPlan}
                  editablePlan={editablePlan}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  isReviewed={isReviewed}
                  setIsReviewed={setIsReviewed}
                  isGenerating={isGenerating}
                  handleGenerateIEP={handleGenerateIEP}
                  handleResetToOriginal={handleResetToOriginal}
                  handleSaveChanges={handleSaveChanges}
                  handleExportToWord={handleExportToWord}
                  removeGoal={removeGoal}
                  removeObjective={removeObjective}
                  updateGoal={updateGoal}
                  updateObjective={updateObjective}
                  setEditablePlan={setEditablePlan}
                />
              )}

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );

}

