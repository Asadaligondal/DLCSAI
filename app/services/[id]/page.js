'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Navbar from '@/components/Navbar';
import { ArrowLeft, Wand2, Save, FileText, RefreshCw } from 'lucide-react';

export default function ServicesPage() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentGoals, setCurrentGoals] = useState('');
  const [aiDraft, setAiDraft] = useState('');
  const [finalVersion, setFinalVersion] = useState('');

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
      setLoading(true);
      const response = await axios.get(`/api/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const studentData = response.data.student;
      setStudent(studentData);

      // Load annual goals from IEP data
      if (studentData.iep_plan_data?.user_edited_version?.annual_goals) {
        const goals = studentData.iep_plan_data.user_edited_version.annual_goals.join('\n\n');
        setCurrentGoals(goals);
      } else if (studentData.iep_plan_data?.original_ai_draft?.annual_goals) {
        const goals = studentData.iep_plan_data.original_ai_draft.annual_goals.join('\n\n');
        setCurrentGoals(goals);
      } else if (studentData.annualGoals) {
        setCurrentGoals(studentData.annualGoals);
      }

      // Load existing services if available
      if (studentData.servicesRecommendations) {
        setAiDraft(studentData.servicesRecommendations);
        setFinalVersion(studentData.servicesRecommendations);
      }
    } catch (error) {
      toast.error('Failed to load student data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateServices = async () => {
    if (!currentGoals.trim()) {
      toast.error('No annual goals found. Please generate an IEP plan first.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post('/api/generate-services', {
        studentData: {
          name: student.name,
          gradeLevel: student.gradeLevel,
          age: student.age,
          disabilities: student.disabilities,
          areaOfNeed: student.areaOfNeed,
          instructionalSetting: student.instructionalSetting
        },
        currentGoals: currentGoals
      });

      const generatedText = response.data.data;
      setAiDraft(generatedText);
      setFinalVersion(generatedText);
      toast.success('Services & Recommendations generated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate services');
      console.error('Generate error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveServices = async () => {
    const token = localStorage.getItem('token');
    setIsSaving(true);
    try {
      await axios.put(
        `/api/students/${id}`,
        { 
          servicesRecommendations: finalVersion,
          annualGoals: currentGoals
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Services & Recommendations saved successfully');
    } catch (error) {
      toast.error('Failed to save services');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToAI = () => {
    setFinalVersion(aiDraft);
    toast.info('Reset to AI draft');
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg">Loading student data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <p className="text-gray-500">Student not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Services & Recommendations</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {student.name}
                </span>
                <span>Grade {student.gradeLevel}</span>
                <span>Age {student.age}</span>
                {student.disabilities?.length > 0 && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                    {student.disabilities.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Current Annual Goals Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Current Annual Goals
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            These are the goals that the services and recommendations will be based on.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            {currentGoals ? (
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{currentGoals}</pre>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">
                No annual goals found. Please generate an IEP plan first from the student detail page.
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <button
            onClick={handleGenerateServices}
            disabled={isGenerating || !currentGoals}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating Services...' : 'Generate Services & Recommendations'}
          </button>
        </div>

        {/* Editor Section - Side by Side */}
        {aiDraft && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left: AI Draft (Read-only) */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">AI Draft (Read-Only)</h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  Original
                </span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-[600px] overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{aiDraft}</pre>
              </div>
            </div>

            {/* Right: Final Version (Editable) */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Final Version (Editable)</h3>
                <button
                  onClick={handleResetToAI}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset to AI
                </button>
              </div>
              <textarea
                value={finalVersion}
                onChange={(e) => setFinalVersion(e.target.value)}
                className="w-full h-[600px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-sans resize-none"
                placeholder="The editable version will appear here after generation..."
              />
            </div>
          </div>
        )}

        {/* Save Button */}
        {aiDraft && (
          <div className="flex justify-end">
            <button
              onClick={handleSaveServices}
              disabled={isSaving || !finalVersion}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Saving...' : 'Save Services & Recommendations'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
