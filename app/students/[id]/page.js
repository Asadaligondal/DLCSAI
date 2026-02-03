"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MultiSelect from '@/components/MultiSelect';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { ArrowLeft, Save } from 'lucide-react';

import StudentInfoHeader from './components/StudentInfoHeader';
import IEPPlanEditor from './components/IEPPlanEditor';
import GoalsObjectivesSection from './components/GoalsObjectivesSection';
import CustomizeGoalModal from './components/CustomizeGoalModal';
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
  const [userLocal, setUserLocal] = useState(null);
  const [student, setStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [originalAIPlan, setOriginalAIPlan] = useState(null);
  const [editablePlan, setEditablePlan] = useState(null);
  const [isReviewed, setIsReviewed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  // Handle regeneration initiated from CustomizeGoalModal via event
  const regenerateIEPWithCustomGoals = async (goalsList) => {
    try {
      if (!goalsList || goalsList.length === 0) {
        toast.info('No custom goals to include');
        return;
      }
      const customGoals = goalsList.map(g => g.title || g);

      setIsGenerating(true);
      const res = await axios.post('/api/generate-iep', {
        studentGrade: student.gradeLevel,
        studentAge: student.age,
        areaOfNeed: student.areaOfNeed || 'General Education',
        currentPerformance: `Quantitative: ${student.performanceQuantitative || 'Not specified'}, Narrative: ${student.performanceNarrative || 'Not specified'}`,
        disabilityCategory: student.disabilities?.join(', ') || 'Not specified',
        instructionalSetting: student.instructionalSetting || 'General Education',
        exceptionalities: Array.isArray(student.disabilities) ? student.disabilities : [],
        customGoals
      });

      const aiData = res.data.data;
      if (!aiData) {
        toast.error('Failed to generate IEP');
        return;
      }

      aiData.custom_goals = aiData.custom_goals || [];

      setGeneratedPlan(aiData);
      setOriginalAIPlan(aiData);
      setEditablePlan(aiData);
      setIsReviewed(false);
      setHasExistingPlan(true);
      setViewMode('edited');

      await axios.put(`/api/students/${id}/save-iep`, {
        original_ai_draft: aiData,
        user_edited_version: aiData,
        is_reviewed: false
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

      toast.success('IEP regenerated with custom goals');
    } catch (err) {
      console.error('Regenerate error', err);
      toast.error('Failed to regenerate IEP');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      const goalsList = e.detail?.goals || [];
      regenerateIEPWithCustomGoals(goalsList);
    };

    window.addEventListener('customGoalsRegenerate', handler);
    return () => window.removeEventListener('customGoalsRegenerate', handler);
  }, [student, id]);
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
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    setUserLocal(u);
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

  // Handler triggered from the header regenerate button
  const handleRegenerateFromHeader = async () => {
    if (!student) return;
    try {
      // Build a list of goals with titles. If student.assignedGoals contains IDs, fetch them.
      const assigned = student.assignedGoals || [];
      if (assigned.length === 0) {
        toast.info('No custom goals to include');
        return;
      }

      const token = localStorage.getItem('token');
      const goalsList = await Promise.all(assigned.map(async (g) => {
        if (!g) return null;
        if (typeof g === 'string') {
          const res = await axios.get(`/api/goals/${g}`, { headers: { Authorization: `Bearer ${token}` } });
          return res.data?.goal ? { title: res.data.goal.title, _id: res.data.goal._id } : null;
        }
        // assume populated object
        return { title: g.title, _id: g._id };
      }));

      const filtered = goalsList.filter(Boolean);
      if (filtered.length === 0) {
        toast.info('No custom goals found');
        return;
      }

      await regenerateIEPWithCustomGoals(filtered);
    } catch (err) {
      console.error('Header regenerate error', err);
      toast.error('Failed to regenerate IEP');
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
              text: 'Goals & Objectives by Exceptionality',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 }
            }),
            ...((editablePlan.annualGoalsByExceptionality || []).flatMap((group) => {
              const arr = [
                new Paragraph({
                  text: group.exceptionality,
                  heading: HeadingLevel.HEADING_3,
                  spacing: { before: 150, after: 80 }
                })
              ];

              if (Array.isArray(group.goals)) {
                group.goals.forEach((g) => {
                  arr.push(new Paragraph({
                    text: `${parseInt(g.referenceId, 10) + 1}. ${g.goal}`,
                    spacing: { after: 100 },
                    bullet: { level: 0 }
                  }));
                });
              }

              const objGroup = Array.isArray(editablePlan.shortTermObjectivesByExceptionality) ? editablePlan.shortTermObjectivesByExceptionality.find(sg => sg.exceptionality === group.exceptionality) : null;
              if (objGroup && Array.isArray(objGroup.objectives) && objGroup.objectives.length > 0) {
                arr.push(new Paragraph({ text: 'Short-Term Objectives', spacing: { before: 80, after: 60 } }));
                objGroup.objectives.forEach((o) => {
                  arr.push(new Paragraph({
                    text: `${parseInt(o.referenceId, 10) + 1}. ${o.objective}`,
                    spacing: { after: 80 },
                    bullet: { level: 0 }
                  }));
                });
              }

              return arr;
            })),
            
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
    <div className="flex h-screen bg-[#F7F9FB] font-sans text-slate-800">
      <Sidebar user={userLocal} onLogout={() => { localStorage.clear(); router.push('/login'); }} />

      <div className="flex-1 overflow-auto">
        <Navbar />

        <div className="max-w-full px-8 py-6">
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
            onCustomizeGoals={() => setShowCustomizeModal(true)}
            onRegenerateCustomGoals={handleRegenerateFromHeader}
            onAccommodationsSaved={() => fetchStudent(localStorage.getItem('token'))}
          />

          {showCustomizeModal && (
            <CustomizeGoalModal
              isOpen={showCustomizeModal}
              onClose={() => setShowCustomizeModal(false)}
              student={student}
              onSaved={(goal) => {
                // Refresh student to pick up the assigned goal
                fetchStudent(localStorage.getItem('token'));
              }}
            />
          )}

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
              handleRegenerateOriginal={handleGenerateIEP}
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
      </div>
    </div>
  );

}

