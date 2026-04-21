"use client";

import React from "react";
import { LayoutDashboard, FileText, Users } from "lucide-react";
import WorkspaceBreadcrumb from "@/components/WorkspaceBreadcrumb";

/**
 * @param {{ variant?: 'provider' | 'admin', studentLabel?: string }} props
 */
export default function EditorHeader({ variant = "provider", studentLabel } = {}) {
  const items =
    variant === "admin"
      ? [
          { label: "Admin", icon: LayoutDashboard, href: "/admin" },
          ...(studentLabel ? [{ label: studentLabel }] : []),
          { label: "IEP Plan", icon: FileText },
        ]
      : [
          { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
          { label: "Students", icon: Users, href: "/dashboard/students" },
          { label: "IEP Plan", icon: FileText },
        ];

  return <WorkspaceBreadcrumb items={items} className="mb-0" />;
}
