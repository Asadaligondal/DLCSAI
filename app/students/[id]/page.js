'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
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
  Wand2,
  Lightbulb
} from 'lucide-react';

const DISABILITIES_OPTIONS = ['ADHD', 'Dyslexia', 'Autism', 'Speech Impairment', 'Visual Impairment', 'Hearing Impairment', 'Others'];
const STRENGTHS_OPTIONS = ['Good Memory', 'Creative', 'Problem Solving', 'Communication', 'Leadership', 'Artistic', 'Athletic', 'Others'];
const WEAKNESSES_OPTIONS = ['Reading Comprehension', 'Focus', 'Math Skills', 'Social Skills', 'Writing', 'Organization', 'Others'];

export default function StudentDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [assignConfirm, setAssignConfirm] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [originalAIPlan, setOriginalAIPlan] = useState(null);
  const [editablePlan, setEditablePlan] = useState(null);
  const [isReviewed, setIsReviewed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    age: '',
    gradeLevel: '',
    disabilities: [],
    strengths: [],
    weaknesses: []
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
      setStudent(studentData);
      setFormData({
        name: studentData.name,
        studentId: studentData.studentId,
        age: studentData.age,
        gradeLevel: studentData.gradeLevel,
        disabilities: studentData.disabilities || [],
        strengths: studentData.strengths || [],
        weaknesses: studentData.weaknesses || []
      });
    } catch (error) {
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
          weaknesses: formData.weaknesses
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

  const handleGetRecommendations = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`/api/students/${id}/assign-goals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecommendations(response.data.recommendations);
      setShowRecommendations(true);
    } catch (error) {
      toast.error('Failed to get goal recommendations');
    }
  };

  const handleAutoAssignGoals = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `/api/students/${id}/assign-goals`,
        { auto: true },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success(`Assigned ${response.data.student.assignedGoals.length} goals to student`);
      fetchStudent(token);
      setShowRecommendations(false);
      setAssignConfirm(false);
    } catch (error) {
      toast.error('Failed to assign goals');
    }
  };

  const handleGenerateIEP = async () => {
    setIsGenerating(true);
    try {
      const response = await axios.post('/api/generate-iep', {
        studentGrade: student.gradeLevel,
        studentAge: student.age,
        areaOfNeed: student.areaOfNeed || 'General Education',
        currentPerformance: `Quantitative: ${student.performanceQuantitative || 'Not specified'}, Narrative: ${student.performanceNarrative || 'Not specified'}`,
        disabilityCategory: student.disabilities?.join(', ') || 'Not specified',
        instructionalSetting: student.instructionalSetting || 'General Education'
      });

      const aiData = response.data.data;
      setGeneratedPlan(aiData);
      setOriginalAIPlan(aiData);
      setEditablePlan(aiData);
      setIsReviewed(false);
      toast.success('IEP Plan generated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate IEP plan');
      console.error('Generate IEP error:', error);
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
      try {
        await axios.put(
          `/api/students/${id}/save-iep`,
          {
            ai_generated_draft: originalAIPlan,
            final_approved_content: editablePlan
          },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
      } catch (dbError) {
        console.error('Failed to save IEP to database:', dbError);
      }
      
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {!isEditing ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">{student.name}</h2>
                        <p className="text-sm text-gray-600">ID: {student.studentId}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium">Age</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{student.age}</p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <GraduationCap className="w-4 h-4" />
                        <span className="text-xs font-medium">Grade Level</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{student.gradeLevel}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
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
                      label="Disabilities"
                      options={DISABILITIES_OPTIONS}
                      value={formData.disabilities}
                      onChange={(value) => setFormData({ ...formData, disabilities: value })}
                      placeholder="Select disabilities..."
                    />

                    <MultiSelect
                      label="Strengths"
                      options={STRENGTHS_OPTIONS}
                      value={formData.strengths}
                      onChange={(value) => setFormData({ ...formData, strengths: value })}
                      placeholder="Select strengths..."
                    />

                    <MultiSelect
                      label="Weaknesses"
                      options={WEAKNESSES_OPTIONS}
                      value={formData.weaknesses}
                      onChange={(value) => setFormData({ ...formData, weaknesses: value })}
                      placeholder="Select weaknesses..."
                    />

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
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Assigned Goals</h3>
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

              <div className="space-y-2">
                <button
                  onClick={handleGetRecommendations}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Lightbulb className="w-4 h-4" />
                  Get Recommendations
                </button>
                <button
                  onClick={() => setAssignConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Wand2 className="w-4 h-4" />
                  Auto-Assign Goals
                </button>
                <button
                  onClick={handleGenerateIEP}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Wand2 className="w-4 h-4" />
                  {isGenerating ? 'Generating...' : 'Generate IEP Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {generatedPlan && editablePlan && (
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Generated IEP Plan - Review & Edit</h2>
              <div className="flex gap-2">
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
          </div>
        )}
      </div>

      {showRecommendations && (
        <Modal
          title="Recommended Goals"
          onClose={() => setShowRecommendations(false)}
          size="lg"
        >
        <div className="p-6">
          {recommendations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recommendations available</p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div key={rec.goalId} className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-semibold text-gray-900">{rec.title}</h5>
                    <span className="px-2 py-1 bg-white text-green-800 text-xs font-medium rounded">
                      Score: {rec.score}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{rec.category}</p>
                  <div className="flex flex-wrap gap-1">
                    {rec.matchReasons.map((reason, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-white px-2 py-1 rounded text-gray-700"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </Modal>
      )}

      {assignConfirm && (
        <ConfirmDialog
          title="Auto-Assign Goals"
          message="This will automatically assign the most suitable goals based on the student's profile. Continue?"
          confirmText="Assign Goals"
          type="info"
          onConfirm={handleAutoAssignGoals}
          onCancel={() => setAssignConfirm(false)}
        />
      )}
    </div>
  );
}
