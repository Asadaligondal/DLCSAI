"use client";

import React from 'react';
import { LayoutDashboard, FileText, Users } from 'lucide-react';
import WorkspaceBreadcrumb from '@/components/WorkspaceBreadcrumb';

export default function EditorHeader() {
  const items = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Students', icon: Users, href: '/dashboard/students' },
    { label: 'IEP Plan', icon: FileText },
  ];

  return <WorkspaceBreadcrumb items={items} className="mb-0" />;
}
