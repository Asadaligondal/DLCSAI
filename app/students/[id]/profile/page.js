"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { LayoutDashboard, Users, User, AlertTriangle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import WorkspaceTopBar from '@/components/WorkspaceTopBar';
import WorkspaceBreadcrumb from '@/components/WorkspaceBreadcrumb';
import StudentProfileForm from '../components/StudentProfileForm';
import StudentWorkspaceNav from '../components/StudentWorkspaceNav';
import Modal from '@/components/Modal';
import IepGeniusLetterReveal from '@/components/IepGeniusLetterReveal';
import useMinLoadingGate from '@/hooks/useMinLoadingGate';
import { calcAgeFromDob } from '@/lib/studentFormConstants';

const MIN_ROUTE_LOAD_MS = 3000;

export default function StudentProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [userLocal, setUserLocal] = useState(null);
  const [student, setStudent] = useState(null);
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    setUserLocal(u);
  }, [router]);

  const fetchStudent = async (token) => {
    try {
      const response = await axios.get(`/api/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const studentData = response.data.student;
      setStudent(studentData);
      const toDateInput = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');
      const dob = studentData.dateOfBirth ? toDateInput(studentData.dateOfBirth) : '';
      const ageFromDob = dob ? calcAgeFromDob(dob) : null;
      setFormData({
        name: studentData.name,
        studentId: studentData.studentId,
        age: ageFromDob ? String(ageFromDob.numeric) : studentData.age != null ? String(studentData.age) : '',
        gradeLevel: studentData.gradeLevel,
        dateOfBirth: dob,
        disabilities: studentData.disabilities || [],
        schoolName: studentData.schoolName || '',
        address: studentData.address || '',
        parentGuardian1: studentData.parentGuardian1 || '',
        parentGuardian2: studentData.parentGuardian2 || '',
        caseManager: studentData.caseManager || '',
        relatedServicesTherapy: studentData.relatedServicesTherapy || '',
        domainAreas: Array.isArray(studentData.domainAreas) ? studentData.domainAreas : [],
        domainsTransitionAreas: studentData.domainsTransitionAreas || '',
        associatedPlans: studentData.associatedPlans || '',
        studentNotes: studentData.studentNotes || '',
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to load student');
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      router.push(u?.role === 'admin' ? '/admin' : '/dashboard/students');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetchStudent(token);
  }, [id, router]);

  const hasStudent = !!student && !!formData;
  const showBlockingLoader = useMinLoadingGate(hasStudent, MIN_ROUTE_LOAD_MS, id);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setSaving(true);
    try {
      const ageNum = formData.dateOfBirth
        ? calcAgeFromDob(formData.dateOfBirth).numeric
        : parseInt(formData.age, 10);
      await axios.put(
        `/api/students/${id}`,
        {
          name: formData.name,
          studentId: formData.studentId,
          age: typeof ageNum === 'number' && !Number.isNaN(ageNum) ? ageNum : parseInt(formData.age, 10),
          gradeLevel: formData.gradeLevel,
          dateOfBirth: formData.dateOfBirth || null,
          schoolName: formData.schoolName,
          address: formData.address,
          parentGuardian1: formData.parentGuardian1,
          parentGuardian2: formData.parentGuardian2,
          caseManager: formData.caseManager,
          relatedServicesTherapy: formData.relatedServicesTherapy,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Profile saved');
      await fetchStudent(token);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !deletePassword.trim()) {
      toast.error('Enter your password to confirm');
      return;
    }
    setDeleting(true);
    try {
      await axios.delete(`/api/students/${id}`, {
        data: { currentPassword: deletePassword.trim() },
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Student removed');
      setShowDeleteModal(false);
      setDeletePassword('');
      router.push(userLocal?.role === 'admin' ? '/admin' : '/dashboard/students');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete student');
    } finally {
      setDeleting(false);
    }
  };

  if (!userLocal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <IepGeniusLetterReveal subtitle="Loading…" />
      </div>
    );
  }

  if (!hasStudent || showBlockingLoader) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <IepGeniusLetterReveal text="Individual Education Plan" subtitle="Loading profile…" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-canvas text-slate-800">
      <Sidebar user={userLocal} onLogout={handleLogout} />

      <div className="flex-1 overflow-auto">
        <WorkspaceTopBar
          user={userLocal}
          left={
            <WorkspaceBreadcrumb
              items={[
                { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
                { label: 'Students', icon: Users, href: '/dashboard/students' },
                { label: student?.name || 'Student', icon: User, href: `/students/${id}` },
                { label: 'Profile', icon: User },
              ]}
              className="mb-0"
            />
          }
        />

        <main className="p-6 lg:p-8">
          <div className="max-w-[900px] mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student profile</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Demographics and contact details. Program, primary and listed exceptionalities, additional student
                  context, IEP dates, strengths, and assessment are on the{' '}
                  <a href={`/students/${id}`} className="text-primary-600 font-medium hover:underline">
                    IEP plan
                  </a>{' '}
                  page.
                </p>
              </div>
              <StudentWorkspaceNav studentId={id} studentName={student?.name} />
            </div>

            <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-6 sm:p-8">
              <StudentProfileForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleProfileSave}
                disabled={saving}
              />
            </div>

            <div className="rounded-xl border border-red-200/80 bg-red-50/40 p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold text-red-900 tracking-tight">Delete student</h2>
                  <p className="mt-1 text-xs text-red-900/80 leading-relaxed">
                    Permanently removes this student and all IEP data, including version history. This cannot be undone.
                    Deleting from the student list is no longer available — use this action only when you are certain.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDeletePassword('');
                      setShowDeleteModal(true);
                    }}
                    className="mt-4 h-9 px-4 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Delete student…
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showDeleteModal && (
        <Modal
          title="Confirm delete student"
          onClose={() => {
            if (!deleting) {
              setShowDeleteModal(false);
              setDeletePassword('');
            }
          }}
          size="sm"
        >
          <form onSubmit={handleDeleteStudent} className="space-y-4 p-1">
            <p className="text-sm text-slate-600">
              Type your <span className="font-semibold text-slate-800">own account password</span> (the password you use to log in) to confirm. This will delete{' '}
              <span className="font-semibold text-slate-900">{student?.name || 'this student'}</span> and all related IEP records.
            </p>
            <div>
              <label htmlFor="delete-student-pwd" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Your password
              </label>
              <input
                id="delete-student-pwd"
                type="password"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                placeholder="Current password"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="h-9 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deleting}
                className="h-9 px-4 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
