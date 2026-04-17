"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { LayoutDashboard, Users, User } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import WorkspaceTopBar from '@/components/WorkspaceTopBar';
import WorkspaceBreadcrumb from '@/components/WorkspaceBreadcrumb';
import StudentProfileForm from '../components/StudentProfileForm';
import StudentWorkspaceNav from '../components/StudentWorkspaceNav';
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
      router.push('/dashboard/students');
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
          </div>
        </main>
      </div>
    </div>
  );
}
