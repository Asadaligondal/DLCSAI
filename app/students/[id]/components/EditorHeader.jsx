"use client";

import React from 'react';
import { LayoutDashboard, User, FileText, Users } from 'lucide-react';
import WorkspaceBreadcrumb from '@/components/WorkspaceBreadcrumb';

export default function EditorHeader({ student }) {
  const studentName = (student?.name && String(student.name).trim()) || 'Student';

  const items = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Students', icon: Users, href: '/dashboard' },
    { label: studentName, icon: User },
    { label: 'IEP Plan', icon: FileText },
  ];

  return <WorkspaceBreadcrumb items={items} />;
}
