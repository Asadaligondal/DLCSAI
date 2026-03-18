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
import { jsPDF } from 'jspdf';
import { ArrowLeft, Save, Wand2 } from 'lucide-react';

import StudentInfoHeader from './components/StudentInfoHeader';
import EditorHeader from './components/EditorHeader';
import StickyActionBar from './components/StickyActionBar';
import IEPPlanEditor from './components/IEPPlanEditor';
import RightTOC from './components/RightTOC';
import GoalsObjectivesSection from './components/GoalsObjectivesSection';
import CustomizeGoalModal from './components/CustomizeGoalModal';
import PipelineSelector from './components/PipelineSelector';
import PipelineMetricsPanel from './components/PipelineMetricsPanel';
// GoalsCard removed from main layout; custom goals are managed via StudentInfoHeader modal

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
  const [generateStage, setGenerateStage] = useState('idle'); // 'idle' | 'retrieving_context' | 'generating_iep'
  const [generateProgress, setGenerateProgress] = useState(''); // e.g. "Goals by Exceptionality done (1/5)"
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [customGoals, setCustomGoals] = useState([]);
  const [viewMode, setViewMode] = useState('edited'); // 'original' or 'edited'
  const [hasExistingPlan, setHasExistingPlan] = useState(false);
  const [ragContext, setRagContext] = useState(null);
  const [ragContextByQuery, setRagContextByQuery] = useState([]);
  const [ragStrategy, setRagStrategy] = useState('baseline');
  const [pipelineMetrics, setPipelineMetrics] = useState({});
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
    studentNotes: ''
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

    // Load persisted pipeline metrics for this student
    try {
      const stored = localStorage.getItem(`pipeline_metrics_${id}`);
      if (stored) setPipelineMetrics(JSON.parse(stored));
    } catch { /* ignore corrupt data */ }
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
      // Sync custom goals from assigned goals (persistent, used in similarity search)
      const assigned = studentData.assignedGoals || [];
      const goalsForRag = assigned
        .filter(g => g && typeof g === 'object' && g?.title)
        .map(g => ({ title: g.title, _id: g._id, description: g.description, category: g.category }));
      setCustomGoals(goalsForRag);
      setFormData({
        name: studentData.name,
        studentId: studentData.studentId,
        age: studentData.age,
        gradeLevel: studentData.gradeLevel,
        disabilities: studentData.disabilities || [],
        strengths: studentData.strengths || [],
        strengthsOther: studentData.strengthsOther || '',
        weaknesses: studentData.weaknesses || [],
        weaknessesOther: studentData.weaknessesOther || '',
        studentNotes: studentData.studentNotes || ''
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
          annualGoalsByExceptionality: Array.isArray(originalDraft?.annualGoalsByExceptionality) ? originalDraft.annualGoalsByExceptionality : Array.isArray(originalDraft?.annual_goals_by_exceptionality) ? originalDraft.annual_goals_by_exceptionality : [],
          shortTermObjectivesByExceptionality: Array.isArray(originalDraft?.shortTermObjectivesByExceptionality) ? originalDraft.shortTermObjectivesByExceptionality : Array.isArray(originalDraft?.short_term_objectives_by_exceptionality) ? originalDraft.short_term_objectives_by_exceptionality : [],
          recommendedAccommodations: Array.isArray(originalDraft?.recommendedAccommodations) ? originalDraft.recommendedAccommodations : [],
          academicPerformanceAchievement: originalDraft?.academicPerformanceAchievement || '',
          custom_goals: Array.isArray(originalDraft?.custom_goals) ? originalDraft.custom_goals : []
        };
        
        const sanitizedEdited = editedVersion ? {
          plaafp_narrative: editedVersion?.plaafp_narrative || '',
          annual_goals: Array.isArray(editedVersion?.annual_goals) ? editedVersion.annual_goals : [],
          short_term_objectives: Array.isArray(editedVersion?.short_term_objectives) ? editedVersion.short_term_objectives : [],
          intervention_recommendations: editedVersion?.intervention_recommendations || '',
          annualGoalsByExceptionality: Array.isArray(editedVersion?.annualGoalsByExceptionality) ? editedVersion.annualGoalsByExceptionality : Array.isArray(editedVersion?.annual_goals_by_exceptionality) ? editedVersion.annual_goals_by_exceptionality : [],
          shortTermObjectivesByExceptionality: Array.isArray(editedVersion?.shortTermObjectivesByExceptionality) ? editedVersion.shortTermObjectivesByExceptionality : Array.isArray(editedVersion?.short_term_objectives_by_exceptionality) ? editedVersion.short_term_objectives_by_exceptionality : [],
          recommendedAccommodations: Array.isArray(editedVersion?.recommendedAccommodations) ? editedVersion.recommendedAccommodations : [],
          academicPerformanceAchievement: editedVersion?.academicPerformanceAchievement || '',
          custom_goals: Array.isArray(editedVersion?.custom_goals) ? editedVersion.custom_goals : []
        } : { ...sanitizedOriginal };
        
        console.log('🔧 Sanitized original:', JSON.stringify(sanitizedOriginal, null, 2));
        console.log('🔧 Sanitized edited:', JSON.stringify(sanitizedEdited, null, 2));
        
        setHasExistingPlan(true);
        setOriginalAIPlan(sanitizedOriginal);
        setEditablePlan(sanitizedEdited);
        setIsReviewed(studentData.iep_plan_data.is_reviewed || false);
        setGeneratedPlan(sanitizedOriginal);
        setRagContext(studentData.iep_plan_data.rag_context || null);
        setRagContextByQuery([]); // Not persisted; only available after fresh generation
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
          weaknessesOther: formData.weaknessesOther,
          studentNotes: formData.studentNotes
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
    setGenerateStage('idle');
    setGenerateProgress('');
    try {
      const customGoalsForAPI = customGoals.map(g => g.title || g.description || g);
      const studentNotesValue = formData.studentNotes || student.studentNotes || '';

      const payload = {
        studentGrade: student.gradeLevel,
        studentAge: student.age,
        areaOfNeed: student.areaOfNeed || 'General Education',
        currentPerformance: `Quantitative: ${student.performanceQuantitative || 'Not specified'}, Narrative: ${student.performanceNarrative || 'Not specified'}`,
        disabilityCategory: student.disabilities?.join(', ') || 'Not specified',
        instructionalSetting: student.instructionalSetting || 'General Education',
        exceptionalities: Array.isArray(student.disabilities) ? student.disabilities : [],
        studentId: id,
        student_accommodations: student.student_accommodations || null,
        customGoals: customGoalsForAPI,
        student: { additionalContext: studentNotesValue },
        ragStrategy
      };

      const token = localStorage.getItem('token');
      const response = await fetch('/api/generate-iep/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.stage === 'retrieving_context') {
                setGenerateStage('retrieving_context');
                setGenerateProgress('');
              } else if (data.stage === 'generating_iep') {
                setGenerateStage('generating_iep');
                if (data.progress) setGenerateProgress(data.progress);
              } else if (data.stage === 'done') {
                const aiData = data.data;
                setGeneratedPlan(aiData);
                setOriginalAIPlan(aiData);
                setEditablePlan(aiData);
                setRagContext(data.ragContext || null);
                setRagContextByQuery(Array.isArray(data.ragContextByQuery) ? data.ragContextByQuery : []);
                setIsReviewed(false);
                setHasExistingPlan(true);
                setViewMode('edited');

                // Persist pipeline metrics for this strategy
                if (data.ragMetrics) {
                  setPipelineMetrics(prev => {
                    const next = {
                      ...prev,
                      [ragStrategy]: { metrics: data.ragMetrics, generatedAt: Date.now() }
                    };
                    try { localStorage.setItem(`pipeline_metrics_${id}`, JSON.stringify(next)); } catch { /* quota */ }
                    return next;
                  });
                }

                toast.success('IEP Plan generated successfully');
              } else if (data.stage === 'error') {
                throw new Error(data.error || 'Generation failed');
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate IEP plan');
      console.error('❌ Generate IEP error:', error);
    } finally {
      setIsGenerating(false);
      setGenerateStage('idle');
      setGenerateProgress('');
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
      // Merge any AI-generated fields from the original draft into the
      // user-edited version if they are missing. This ensures fields like
      // recommendedAccommodations, academicPerformanceAchievement and
      // custom_goals are persisted even when the edited object doesn't
      // include them (minimal, non-invasive fix).
      const mergedUserEdited = {
        ...(originalAIPlan || {}),
        ...(editablePlan || {})
      };

      const response = await axios.put(
        `/api/students/${id}/save-iep`,
        {
          original_ai_draft: originalAIPlan,
          user_edited_version: mergedUserEdited,
          is_reviewed: isReviewed,
          rag_context: ragContext || undefined
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
            ...(editablePlan.annual_goals || []).flatMap((goal, index) => {
              const isObj = goal && typeof goal === 'object';
              const goalText = isObj ? (goal.goal || [goal.condition, goal.observable_behavior, goal.mastery_criteria].filter(Boolean).join(' ')) : String(goal || '');
              const paragraphs = [
                new Paragraph({
                  children: [
                    new TextRun({ text: `Goal ${index + 1}`, bold: true }),
                    ...(isObj && goal.domain ? [new TextRun({ text: ` [${goal.domain}]`, italics: true })] : [])
                  ],
                  spacing: { before: 200, after: 80 }
                }),
                new Paragraph({ text: goalText, spacing: { after: 60 }, bullet: { level: 0 } })
              ];
              if (isObj && goal.progress_measurement) {
                paragraphs.push(new Paragraph({ children: [new TextRun({ text: `Measured by: ${goal.progress_measurement}`, italics: true, size: 20 })], spacing: { after: 40 } }));
              }
              if (isObj && goal.progress_reporting) {
                paragraphs.push(new Paragraph({ children: [new TextRun({ text: `Reported: ${goal.progress_reporting}`, italics: true, size: 20 })], spacing: { after: 40 } }));
              }
              const aligned = (editablePlan.short_term_objectives || []).filter(o => o && typeof o === 'object' && o.aligned_goal_index === index);
              if (aligned.length > 0) {
                paragraphs.push(new Paragraph({ children: [new TextRun({ text: 'Short-Term Objectives:', bold: true, size: 20 })], spacing: { before: 60, after: 40 } }));
                aligned.forEach((obj, oi) => {
                  const objText = typeof obj === 'string' ? obj : (obj.objective || [obj.condition, obj.observable_behavior, obj.mastery_criteria].filter(Boolean).join(' '));
                  paragraphs.push(new Paragraph({ text: `${oi + 1}. ${objText}`, spacing: { after: 60 }, bullet: { level: 1 } }));
                });
              }
              return paragraphs;
            }),
            // Unlinked short-term objectives
            ...(() => {
              const unlinked = (editablePlan.short_term_objectives || []).filter(o => !(o && typeof o === 'object' && typeof o.aligned_goal_index === 'number' && o.aligned_goal_index >= 0));
              if (unlinked.length === 0) return [];
              return [
                new Paragraph({ text: 'Additional Short-Term Objectives', heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
                ...unlinked.map((obj, index) => {
                  const text = typeof obj === 'string' ? obj : (obj?.objective || obj?.text || '');
                  return new Paragraph({ text: `${index + 1}. ${text}`, spacing: { after: 200 }, bullet: { level: 0 } });
                })
              ];
            })(),
            
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
      
      // Save to database (include all IEP fields for consistency)
      await axios.put(
        `/api/students/${id}/save-iep`,
        {
          original_ai_draft: originalAIPlan,
          user_edited_version: editablePlan,
          is_reviewed: isReviewed,
          rag_context: ragContext || undefined
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      toast.success('IEP document exported successfully');
    } catch (error) {
      toast.error('Failed to export document');
      console.error('Export error:', error);
    }
  };

  const handleExportToPDF = () => {
    if (!editablePlan || !isReviewed) return;

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const marginL = 18;
      const marginR = 18;
      const contentW = pageW - marginL - marginR;
      let y = 20;

      const checkPage = (need = 12) => {
        if (y + need > pdf.internal.pageSize.getHeight() - 15) {
          pdf.addPage();
          y = 18;
        }
      };

      const addTitle = (text) => {
        checkPage(14);
        pdf.setFont('helvetica', 'bold').setFontSize(16);
        pdf.text(text, pageW / 2, y, { align: 'center' });
        y += 10;
      };

      const addHeading = (text) => {
        checkPage(12);
        y += 4;
        pdf.setFont('helvetica', 'bold').setFontSize(12).setTextColor(30, 64, 120);
        pdf.text(text, marginL, y);
        y += 2;
        pdf.setDrawColor(30, 64, 120).setLineWidth(0.3);
        pdf.line(marginL, y, marginL + contentW, y);
        y += 6;
        pdf.setTextColor(0, 0, 0);
      };

      const addSubheading = (text) => {
        checkPage(10);
        y += 2;
        pdf.setFont('helvetica', 'bold').setFontSize(10).setTextColor(60, 60, 60);
        pdf.text(text, marginL, y);
        y += 5;
        pdf.setTextColor(0, 0, 0);
      };

      const addParagraph = (text, indent = 0) => {
        if (!text) return;
        pdf.setFont('helvetica', 'normal').setFontSize(10);
        const lines = pdf.splitTextToSize(String(text), contentW - indent);
        lines.forEach((line) => {
          checkPage(5);
          pdf.text(line, marginL + indent, y);
          y += 4.5;
        });
        y += 2;
      };

      const addBullet = (text, indent = 4) => {
        if (!text) return;
        pdf.setFont('helvetica', 'normal').setFontSize(10);
        const lines = pdf.splitTextToSize(String(text), contentW - indent - 4);
        checkPage(5);
        pdf.text('•', marginL + indent, y);
        lines.forEach((line, i) => {
          if (i > 0) checkPage(5);
          pdf.text(line, marginL + indent + 4, y);
          y += 4.5;
        });
        y += 1;
      };

      // Title
      addTitle('Individualized Education Program (IEP)');
      pdf.setFont('helvetica', 'normal').setFontSize(10);
      pdf.text(`Student: ${student.name}    |    ID: ${student.studentId}    |    Grade: ${student.gradeLevel}    |    Age: ${student.age}`, pageW / 2, y, { align: 'center' });
      y += 5;
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageW / 2, y, { align: 'center' });
      y += 10;

      // PLAAFP
      addHeading('Present Level of Academic Achievement and Functional Performance (PLAAFP)');
      addParagraph(editablePlan.plaafp_narrative);

      // Goals by Exceptionality
      if (editablePlan.annualGoalsByExceptionality?.length) {
        addHeading('Goals & Objectives by Exceptionality');
        editablePlan.annualGoalsByExceptionality.forEach((group) => {
          addSubheading(group.exceptionality);
          (group.goals || []).forEach((g, i) => {
            addBullet(`${i + 1}. ${g.goal || g}`);
          });
          const objGroup = (editablePlan.shortTermObjectivesByExceptionality || []).find(sg => sg.exceptionality === group.exceptionality);
          if (objGroup?.objectives?.length) {
            pdf.setFont('helvetica', 'bolditalic').setFontSize(9);
            checkPage(6);
            pdf.text('Short-Term Objectives:', marginL + 6, y);
            y += 5;
            objGroup.objectives.forEach((o, i) => addBullet(`${i + 1}. ${o.objective || o}`, 8));
          }
        });
      }

      // Structured Annual Goals
      if (editablePlan.annual_goals?.length) {
        addHeading('Annual Goals');
        editablePlan.annual_goals.forEach((goal, index) => {
          const isObj = goal && typeof goal === 'object';
          const goalText = isObj ? (goal.goal || [goal.condition, goal.observable_behavior, goal.mastery_criteria].filter(Boolean).join(' ')) : String(goal || '');
          const domain = isObj && goal.domain ? ` [${goal.domain}]` : '';

          checkPage(10);
          pdf.setFont('helvetica', 'bold').setFontSize(10);
          pdf.text(`Goal ${index + 1}${domain}`, marginL, y);
          y += 5;
          addParagraph(goalText, 4);

          if (isObj && goal.progress_measurement) {
            pdf.setFont('helvetica', 'italic').setFontSize(8.5).setTextColor(100, 100, 100);
            checkPage(5);
            pdf.text(`Measured by: ${goal.progress_measurement}    |    Reported: ${goal.progress_reporting || 'N/A'}`, marginL + 4, y);
            y += 5;
            pdf.setTextColor(0, 0, 0);
          }

          const aligned = (editablePlan.short_term_objectives || []).filter(o => o && typeof o === 'object' && o.aligned_goal_index === index);
          if (aligned.length) {
            pdf.setFont('helvetica', 'bolditalic').setFontSize(9);
            checkPage(6);
            pdf.text('Short-Term Objectives:', marginL + 4, y);
            y += 5;
            aligned.forEach((obj, oi) => {
              const objText = typeof obj === 'string' ? obj : (obj.objective || [obj.condition, obj.observable_behavior, obj.mastery_criteria].filter(Boolean).join(' '));
              addBullet(`${oi + 1}. ${objText}`, 8);
            });
          }
          y += 2;
        });
      }

      // Unlinked objectives
      const unlinked = (editablePlan.short_term_objectives || []).filter(o => !(o && typeof o === 'object' && typeof o.aligned_goal_index === 'number' && o.aligned_goal_index >= 0));
      if (unlinked.length) {
        addHeading('Additional Short-Term Objectives');
        unlinked.forEach((obj, i) => {
          const text = typeof obj === 'string' ? obj : (obj?.objective || obj?.text || '');
          addBullet(`${i + 1}. ${text}`);
        });
      }

      // Intervention Recommendations
      if (editablePlan.intervention_recommendations) {
        addHeading('Intervention Recommendations');
        addParagraph(editablePlan.intervention_recommendations);
      }

      pdf.save(`IEP_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('PDF export error:', error);
    }
  };

  // ── Florida IEP Format PDF Export ──
  const handleExportFloridaIEP = () => {
    if (!editablePlan || !isReviewed) return;

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const mL = 14;
      const mR = 14;
      const cW = pageW - mL - mR;
      let y = 12;
      let pageNum = 1;
      const planDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

      const addFooter = () => {
        const total = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= total; i++) {
          pdf.setPage(i);
          pdf.setFont('helvetica', 'normal').setFontSize(8).setTextColor(80, 80, 80);
          pdf.text(`Page ${i} of ${total}`, pageW / 2, pageH - 8, { align: 'center' });
          pdf.text(`Plan Date: ${planDate}`, pageW - mR, pageH - 8, { align: 'right' });
          pdf.setTextColor(0, 0, 0);
        }
      };

      const needPage = (need = 10) => {
        if (y + need > pageH - 16) {
          pdf.addPage();
          y = 14;
          pageNum++;
        }
      };

      const drawRow = (cells, rowY, rowH, opts = {}) => {
        const { fontSize = 8, bg = null } = opts;
        let x = mL;
        cells.forEach(({ text, w }) => {
          if (bg) { pdf.setFillColor(...bg); pdf.rect(x, rowY, w, rowH, 'F'); }
          pdf.setDrawColor(0, 0, 0).setLineWidth(0.25);
          pdf.rect(x, rowY, w, rowH, 'S');
          const str = String(text || '—');
          const colonIdx = str.indexOf(':');
          if (colonIdx > 0) {
            const label = str.slice(0, colonIdx + 1);
            const value = str.slice(colonIdx + 1);
            pdf.setFont('helvetica', 'bold').setFontSize(fontSize).setTextColor(0, 0, 0);
            const lw = pdf.getTextWidth(label);
            pdf.text(label, x + 1.5, rowY + 3.5);
            pdf.setFont('helvetica', 'normal');
            const valLines = pdf.splitTextToSize(value.trim(), w - 3 - lw - 1);
            if (valLines.length <= 1) {
              pdf.text(` ${value.trimStart()}`, x + 1.5 + lw, rowY + 3.5);
            } else {
              pdf.text(` ${valLines[0]}`, x + 1.5 + lw, rowY + 3.5);
              valLines.slice(1).forEach((line, li) => {
                if (li < Math.floor((rowH - 5) / 3.2))
                  pdf.text(line, x + 1.5, rowY + 6.7 + li * 3.2);
              });
            }
          } else {
            pdf.setFont('helvetica', 'normal').setFontSize(fontSize).setTextColor(0, 0, 0);
            const lines = pdf.splitTextToSize(str, w - 3);
            lines.forEach((line, li) => {
              if (li < Math.floor((rowH - 1) / 3.5))
                pdf.text(line, x + 1.5, rowY + 3.5 + li * 3.2);
            });
          }
          x += w;
        });
      };

      const dobStr = student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '—';
      const ageStr = student.dateOfBirth
        ? (() => { const bd = new Date(student.dateOfBirth); const now = new Date(); let yrs = now.getFullYear() - bd.getFullYear(); let mos = now.getMonth() - bd.getMonth(); if (mos < 0) { yrs--; mos += 12; } return `${yrs} Year(s) & ${mos} Month(s)`; })()
        : (student.age ? `${student.age} Year(s)` : '—');
      const primaryExc = student.disabilities?.[0] || '—';
      const otherExc = student.disabilities?.slice(1).join(', ') || '—';
      const domains = [...new Set((editablePlan.annual_goals || []).map(g => (g && typeof g === 'object' && g.domain) ? g.domain : null).filter(Boolean))].join(', ') || '—';

      // ── Header ──
      pdf.setFont('helvetica', 'bold').setFontSize(11).setTextColor(0, 0, 0);
      pdf.text('School District', pageW / 2, y, { align: 'center' });
      y += 5;
      pdf.setFontSize(10);
      pdf.text('Individual Educational Plan (IEP) - Present Levels and Goals', pageW / 2, y, { align: 'center' });
      y += 6;

      // ── Demographics Table ──
      const col1 = cW * 0.28;
      const col2 = cW * 0.22;
      const col3 = cW * 0.22;
      const col4 = cW * 0.28;
      const rH = 6;
      const rH2 = 8;

      drawRow([{ text: `Student: ${student.name || '—'}`, w: cW * 0.5, b: true }, { text: `School: —`, w: cW * 0.5 }], y, rH);
      y += rH;
      drawRow([{ text: `Student ID: ${student.studentId || '—'}`, w: col1, b: true }, { text: `Grade: ${student.gradeLevel || '—'}`, w: col2 }, { text: `DOB: ${dobStr}`, w: col3 }, { text: `Age: ${ageStr}`, w: col4 }], y, rH);
      y += rH;
      drawRow([{ text: `Address: —`, w: cW }], y, rH);
      y += rH;
      drawRow([{ text: `Parent/Guardian: —`, w: cW * 0.5 }, { text: `Parent/Guardian: —`, w: cW * 0.5 }], y, rH);
      y += rH;
      drawRow([{ text: `Original Meeting Date/Plan Date: —`, w: cW * 0.34 }, { text: `Initiation Date: —`, w: cW * 0.33 }, { text: `Duration Date: —`, w: cW * 0.33 }], y, rH);
      y += rH;
      drawRow([{ text: `Review Due Date: —`, w: cW * 0.5 }, { text: `Reevaluation Due Date: —`, w: cW * 0.5 }], y, rH);
      y += rH;
      drawRow([{ text: `Primary Exceptionality: ${primaryExc}`, w: cW, b: true }], y, rH);
      y += rH;
      drawRow([{ text: `Other Exceptionalities: ${otherExc}`, w: cW }], y, rH);
      y += rH;
      drawRow([{ text: `Related Services/Therapy(ies): —`, w: cW }], y, rH);
      y += rH;
      drawRow([{ text: `Amendment Date: —`, w: cW * 0.5 }, { text: `Previously Amended: —`, w: cW * 0.5 }], y, rH);
      y += rH;
      drawRow([{ text: `Meeting Purpose: —`, w: cW }], y, rH2);
      y += rH2;
      drawRow([{ text: `Domain(s)/Transition Service Activity Area(s): ${domains}`, w: cW, b: true }], y, rH);
      y += rH;
      drawRow([{ text: `Associated Plans: —`, w: cW }], y, rH);
      y += rH + 6;

      // ── PLAAFP Section ──
      needPage(30);
      pdf.setFont('helvetica', 'bold').setFontSize(10).setTextColor(0, 0, 0);
      pdf.text('Present Levels of Academic Achievement and Functional Performance and Annual Goals', mL, y);
      y += 4;
      pdf.setDrawColor(0).setLineWidth(0.4);
      pdf.line(mL, y, mL + cW, y);
      y += 5;

      pdf.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(60, 60, 60);
      const legalRef = '34 CFR §§ 300.320(a)(1) and (2), 300.323(d)(2), and 300.324(a)';
      pdf.text(legalRef, mL, y);
      y += 5;

      const plaafpIntro = 'Present level statements provide baseline data from which progress toward annual goals can be measured. They consider:\n• strengths, abilities or behaviors that positively influence the student\'s performance in the target area(s);\n• what the student can and cannot do in the target area(s) based on grade level standards and functional expectations; and\n• the effect of the exceptionality on the student\'s involvement and progress in the general curriculum.';
      pdf.setFont('helvetica', 'italic').setFontSize(7.5).setTextColor(80, 80, 80);
      const introLines = pdf.splitTextToSize(plaafpIntro, cW);
      introLines.forEach(line => {
        needPage(4);
        pdf.text(line, mL, y);
        y += 3.5;
      });
      y += 3;
      pdf.setTextColor(0, 0, 0);

      // Domain(s) line
      pdf.setFont('helvetica', 'bold').setFontSize(8);
      pdf.text(`Domain(s)/Transition Service Activity Area(s):`, mL, y);
      y += 4;
      pdf.setFont('helvetica', 'normal').setFontSize(8);
      pdf.text(domains, mL + 4, y);
      y += 6;

      // Strengths
      if (student.strengths?.length) {
        needPage(12);
        pdf.setFont('helvetica', 'bold').setFontSize(8.5);
        pdf.text('Strengths of the Student — Consider strengths, abilities or behaviors observed in school, home,', mL, y);
        y += 3.5;
        pdf.text('community, or work settings, including attributes that positively influence performance.', mL, y);
        y += 5;
        pdf.setFont('helvetica', 'normal').setFontSize(8);
        const strText = student.strengths.join(', ');
        const strLines = pdf.splitTextToSize(strText, cW - 4);
        strLines.forEach(line => { needPage(4); pdf.text(line, mL + 4, y); y += 3.8; });
        y += 4;
      }

      // PLAAFP Narrative as "Level of Achievement"
      if (editablePlan.plaafp_narrative) {
        needPage(12);
        pdf.setFont('helvetica', 'bold').setFontSize(8.5);
        const achieveTitle = 'Level of Achievement or Functioning — Describe what the student can and cannot do in the target area(s) based on grade level standards and functional expectations.';
        const achLines = pdf.splitTextToSize(achieveTitle, cW);
        achLines.forEach(line => { needPage(4); pdf.text(line, mL, y); y += 3.8; });
        y += 2;

        pdf.setFont('helvetica', 'normal').setFontSize(8);
        const narLines = pdf.splitTextToSize(editablePlan.plaafp_narrative, cW - 4);
        narLines.forEach(line => { needPage(4); pdf.text(line, mL + 4, y); y += 3.8; });
        y += 4;
      }

      // Academic Performance
      if (editablePlan.academicPerformanceAchievement) {
        needPage(12);
        pdf.setFont('helvetica', 'bold').setFontSize(8.5);
        pdf.text('Effect of the Exceptionality — Impact on involvement and progress in the general curriculum.', mL, y);
        y += 5;
        pdf.setFont('helvetica', 'normal').setFontSize(8);
        const acadLines = pdf.splitTextToSize(editablePlan.academicPerformanceAchievement, cW - 4);
        acadLines.forEach(line => { needPage(4); pdf.text(line, mL + 4, y); y += 3.8; });
        y += 4;
      }

      // ── Goal Boxes ──
      const drawGoalBox = (goal, index, alignedObjs) => {
        const isObj = goal && typeof goal === 'object';
        const goalText = isObj ? (goal.goal || [goal.condition, goal.observable_behavior, goal.mastery_criteria].filter(Boolean).join(' ')) : String(goal || '');
        const domain = (isObj && goal.domain) ? goal.domain : '—';
        const measurement = (isObj && goal.progress_measurement) ? goal.progress_measurement : '—';
        const reporting = (isObj && goal.progress_reporting) ? goal.progress_reporting : '—';

        pdf.setFontSize(8);
        const goalFullText = `${student.name || 'Student'} — ${goalText}`;
        const goalLines = pdf.splitTextToSize(goalFullText, cW - 8);
        const assessLines = pdf.splitTextToSize(`Assessment Procedures: ${measurement}`, cW - 8);
        const objTexts = alignedObjs.map(o => {
          const t = typeof o === 'string' ? o : (o.objective || [o.condition, o.observable_behavior, o.mastery_criteria].filter(Boolean).join(' '));
          return pdf.splitTextToSize(`• ${t}`, cW - 12);
        });
        const objTotalLines = objTexts.reduce((s, lines) => s + lines.length, 0);

        const estH = 4 + 5 + 4 + goalLines.length * 3.5 + 2 + assessLines.length * 3.5 + 1 + 4 + (alignedObjs.length > 0 ? 5 + objTotalLines * 3.5 : 0) + 3;

        needPage(Math.min(estH + 6, pageH - 30));

        const boxY = y;
        let cy = boxY + 4;

        pdf.setFont('helvetica', 'bold').setFontSize(8).setTextColor(0, 0, 0);
        pdf.text(`Domain(s)/TSAA(s): `, mL + 3, cy);
        const dLabelW = pdf.getTextWidth('Domain(s)/TSAA(s): ');
        pdf.setFont('helvetica', 'normal');
        pdf.text(domain, mL + 3 + dLabelW, cy);
        cy += 5;

        pdf.setFont('helvetica', 'bold').setFontSize(8);
        pdf.text('Goal: ', mL + 3, cy);
        const gLabelW = pdf.getTextWidth('Goal: ');
        pdf.setFont('helvetica', 'normal');
        const firstGoalLine = goalLines[0] || '';
        pdf.text(firstGoalLine, mL + 3 + gLabelW, cy);
        cy += 3.5;
        goalLines.slice(1).forEach(line => {
          pdf.text(line, mL + 3, cy);
          cy += 3.5;
        });
        cy += 1;

        pdf.setFont('helvetica', 'bold').setFontSize(7.5);
        pdf.text('Assessment Procedures: ', mL + 3, cy);
        const aLabelW = pdf.getTextWidth('Assessment Procedures: ');
        pdf.setFont('helvetica', 'normal');
        pdf.text(measurement, mL + 3 + aLabelW, cy);
        cy += 4;

        pdf.setFont('helvetica', 'bold').setFontSize(7.5);
        pdf.text('Progress Reported: ', mL + 3, cy);
        const pLabelW = pdf.getTextWidth('Progress Reported: ');
        pdf.setFont('helvetica', 'normal');
        pdf.text(reporting, mL + 3 + pLabelW, cy);
        cy += 4;

        if (alignedObjs.length > 0) {
          pdf.setFont('helvetica', 'bold').setFontSize(8);
          pdf.text('Short-term Objectives or Benchmarks:', mL + 3, cy);
          cy += 4;

          pdf.setFont('helvetica', 'normal').setFontSize(7.5);
          objTexts.forEach(lines => {
            lines.forEach(line => {
              pdf.text(line, mL + 6, cy);
              cy += 3.5;
            });
          });
        }

        cy += 2;
        const boxH = cy - boxY;
        pdf.setDrawColor(0).setLineWidth(0.35);
        pdf.rect(mL, boxY, cW, boxH, 'S');

        y = boxY + boxH + 4;
      };

      // Render annual goals as bordered boxes
      if (editablePlan.annual_goals?.length) {
        y += 2;
        editablePlan.annual_goals.forEach((goal, index) => {
          const aligned = (editablePlan.short_term_objectives || []).filter(o => o && typeof o === 'object' && o.aligned_goal_index === index);
          drawGoalBox(goal, index, aligned);
        });
      }

      // Goals by Exceptionality as bordered boxes
      if (editablePlan.annualGoalsByExceptionality?.length) {
        editablePlan.annualGoalsByExceptionality.forEach((group) => {
          needPage(10);
          pdf.setFont('helvetica', 'bold').setFontSize(9).setTextColor(0, 0, 0);
          pdf.text(`Domain(s)/Transition Service Activity Area(s):`, mL, y);
          y += 4;
          pdf.setFont('helvetica', 'normal').setFontSize(9);
          pdf.text(group.exceptionality, mL + 4, y);
          y += 6;

          const matchingObjs = (editablePlan.shortTermObjectivesByExceptionality || []).find(sg => sg.exceptionality === group.exceptionality)?.objectives || [];

          (group.goals || []).forEach((g, gi) => {
            const goalObj = { goal: g.goal || g, domain: group.exceptionality, progress_measurement: '—', progress_reporting: '—' };
            const gObjs = matchingObjs.slice(gi * Math.ceil(matchingObjs.length / Math.max((group.goals || []).length, 1)), (gi + 1) * Math.ceil(matchingObjs.length / Math.max((group.goals || []).length, 1)));
            drawGoalBox(goalObj, gi, gi === 0 ? matchingObjs : []);
          });
        });
      }

      // Unlinked objectives
      const unlinkedObjs = (editablePlan.short_term_objectives || []).filter(o => !(o && typeof o === 'object' && typeof o.aligned_goal_index === 'number' && o.aligned_goal_index >= 0));
      if (unlinkedObjs.length) {
        needPage(12);
        pdf.setFont('helvetica', 'bold').setFontSize(9);
        pdf.text('Additional Short-Term Objectives:', mL, y);
        y += 5;
        pdf.setFont('helvetica', 'normal').setFontSize(8);
        unlinkedObjs.forEach((obj) => {
          const text = typeof obj === 'string' ? obj : (obj?.objective || obj?.text || '');
          const lines = pdf.splitTextToSize(`• ${text}`, cW - 6);
          lines.forEach(line => { needPage(4); pdf.text(line, mL + 4, y); y += 3.8; });
          y += 1;
        });
      }

      // Intervention Recommendations
      if (editablePlan.intervention_recommendations) {
        needPage(12);
        pdf.setFont('helvetica', 'bold').setFontSize(9);
        pdf.text('Intervention Recommendations:', mL, y);
        y += 5;
        pdf.setFont('helvetica', 'normal').setFontSize(8);
        const intLines = pdf.splitTextToSize(editablePlan.intervention_recommendations, cW - 4);
        intLines.forEach(line => { needPage(4); pdf.text(line, mL + 4, y); y += 3.8; });
        y += 4;
      }

      // Accommodations
      const acc = student.student_accommodations;
      if (acc) {
        const cats = ['presentation', 'response', 'scheduling', 'setting', 'assistive_technology_device'];
        const contexts = [{ key: 'classroom', label: 'Classroom' }, { key: 'assessment', label: 'Assessment' }];
        let hasAny = false;
        contexts.forEach(ctx => { cats.forEach(cat => { if (acc[ctx.key]?.[cat]?.length) hasAny = true; }); });

        if (hasAny) {
          needPage(12);
          pdf.setFont('helvetica', 'bold').setFontSize(9);
          pdf.text('Accommodations:', mL, y);
          y += 5;

          contexts.forEach(ctx => {
            let ctxHas = false;
            cats.forEach(cat => { if (acc[ctx.key]?.[cat]?.length) ctxHas = true; });
            if (!ctxHas) return;

            pdf.setFont('helvetica', 'bold').setFontSize(8);
            pdf.text(`${ctx.label}:`, mL + 2, y);
            y += 4;

            cats.forEach(cat => {
              const items = acc[ctx.key]?.[cat] || [];
              if (!items.length) return;
              pdf.setFont('helvetica', 'normal').setFontSize(7.5);
              const label = cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              const itemText = items.map(i => typeof i === 'string' ? i : (i.label || i.name || JSON.stringify(i))).join('; ');
              const aLines = pdf.splitTextToSize(`${label}: ${itemText}`, cW - 8);
              aLines.forEach(line => { needPage(4); pdf.text(line, mL + 6, y); y += 3.5; });
              y += 1;
            });
            y += 2;
          });
        }
      }

      // ── Signature Block ──
      needPage(50);
      y += 6;
      pdf.setDrawColor(0).setLineWidth(0.3);
      pdf.setFont('helvetica', 'normal').setFontSize(8).setTextColor(80, 80, 80);

      const sigText = 'I have reviewed and agree to this Individualized Education Program.';
      pdf.text(sigText, mL, y);
      y += 8;

      const sigLines = [
        'Parent/Guardian Signature',
        'LEA Representative',
        'Special Education Teacher',
        'General Education Teacher',
        'Student (if applicable)'
      ];
      sigLines.forEach(label => {
        needPage(12);
        pdf.setDrawColor(0).setLineWidth(0.2);
        pdf.line(mL, y, mL + cW * 0.55, y);
        pdf.line(mL + cW * 0.62, y, mL + cW, y);
        pdf.setFont('helvetica', 'normal').setFontSize(7).setTextColor(100, 100, 100);
        pdf.text(label, mL, y + 3.5);
        pdf.text('Date', mL + cW * 0.62, y + 3.5);
        y += 10;
      });

      pdf.setTextColor(0, 0, 0);

      // ── Confidentiality Footer ──
      addFooter();

      pdf.save(`Florida_IEP_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Florida IEP format exported');
    } catch (error) {
      toast.error('Failed to export Florida IEP');
      console.error('Florida IEP export error:', error);
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

  const updateGoal = (index, text) => {
    const newGoals = Array.isArray(editablePlan?.annual_goals) ? [...editablePlan.annual_goals] : [];
    const existing = newGoals[index];
    if (existing && typeof existing === 'object') {
      newGoals[index] = { ...existing, goal: text };
    } else {
      newGoals[index] = text;
    }
    setEditablePlan({ ...editablePlan, annual_goals: newGoals });
  };

  const updateObjective = (index, text) => {
    const newObjectives = Array.isArray(editablePlan?.short_term_objectives)
      ? [...editablePlan.short_term_objectives]
      : [];
    const existing = newObjectives[index];
    if (existing && typeof existing === 'object') {
      newObjectives[index] = { ...existing, objective: text };
    } else {
      newObjectives[index] = text;
    }
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
    <div className="flex h-screen bg-canvas text-slate-800">
      <Sidebar user={userLocal} onLogout={() => { localStorage.clear(); router.push('/login'); }} />

      <div className="flex-1 overflow-auto">
        <Navbar />

        <div className="max-w-full px-6 py-5 lg:px-8">
          <EditorHeader student={student} />

          <StickyActionBar
            onRegenerate={handleGenerateIEP}
            onSave={handleSaveChanges}
            onDownload={handleExportToWord}
            onDownloadPDF={handleExportToPDF}
            onDownloadFloridaIEP={handleExportFloridaIEP}
            onReset={handleResetToOriginal}
            isReviewed={isReviewed}
            isBusy={isGenerating}
            generateStage={generateStage}
            generateProgress={generateProgress}
          />

          {showCustomizeModal && (
            <CustomizeGoalModal
              isOpen={showCustomizeModal}
              onClose={() => setShowCustomizeModal(false)}
              student={student}
              onSaved={() => {
                fetchStudent(localStorage.getItem('token'));
              }}
            />
          )}

          {/* Unified grid: Student Context + IEP Plan share the left column, TOC on the right */}
          <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-4">
            <div>
              <StudentInfoHeader
                student={student}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                formData={formData}
                setFormData={setFormData}
                handleUpdate={handleUpdate}
                isGenerating={isGenerating}
                generateStage={generateStage}
                handleGenerateIEP={handleGenerateIEP}
                hasExistingPlan={hasExistingPlan}
                disabilitiesOptions={DISABILITIES_OPTIONS}
                strengthsOptions={STRENGTHS_OPTIONS}
                weaknessesOptions={WEAKNESSES_OPTIONS}
                onCustomizeGoals={() => setShowCustomizeModal(true)}
                onCustomGoalsSaved={(goals) => setCustomGoals(goals)}
                onAccommodationsSaved={() => fetchStudent(localStorage.getItem('token'))}
                customGoals={customGoals}
              />

              <div className="mt-3 space-y-2">
                <PipelineSelector
                  value={ragStrategy}
                  onChange={setRagStrategy}
                  disabled={isGenerating}
                />
                <PipelineMetricsPanel pipelineMetrics={pipelineMetrics} />
              </div>

              {!hasExistingPlan && (
                <div className="mt-4 flex flex-col items-center justify-center py-12 px-6 bg-white rounded-xl border border-slate-200/60 shadow-card">
                  <p className="text-slate-600 text-center mb-4">Generate your first IEP plan for this student.</p>
                  <button
                    onClick={handleGenerateIEP}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <Wand2 className={`w-5 h-5 ${isGenerating ? 'animate-pulse' : ''}`} />
                    {isGenerating && generateStage === 'retrieving_context' ? 'Retrieving context...' : isGenerating && generateStage === 'generating_iep' ? (generateProgress || 'Generating IEP...') : 'Generate IEP Plan'}
                  </button>
                </div>
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
                  generateStage={generateStage}
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
                  ragContext={ragContext}
                  ragContextByQuery={ragContextByQuery}
                />
              )}
            </div>

            {hasExistingPlan && generatedPlan && editablePlan && (
              <div>
                <RightTOC sections={[
                  { id: 'plaafp-narrative', label: 'PLAAFP Narrative' },
                  { id: 'academic-performance-achievement', label: 'Academic Performance' },
                  { id: 'goals-objectives-by-exceptionality', label: 'Goals by Exceptionality' },
                  { id: 'annual-goals', label: 'Annual Goals & Objectives' },
                  { id: 'custom-goals', label: 'Custom Goals' },
                  { id: 'recommended-accommodations', label: 'Accommodations' },
                  { id: 'intervention-recommendations', label: 'Interventions' },
                  { id: 'raw-retrieved-context', label: 'Raw Retrieved Context' },
                  { id: 'final-review', label: 'Final Review' }
                ]} />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );

}

