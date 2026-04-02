import { jsPDF } from 'jspdf';

async function loadFloridaHeaderLogo(logoUrl) {
  if (!logoUrl || typeof logoUrl !== 'string' || !logoUrl.trim()) return null;
  const url = logoUrl.trim();
  try {
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    const dims = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = reject;
      img.src = dataUrl;
    });
    return { dataUrl, ...dims };
  } catch {
    return null;
  }
}

/**
 * Florida IEP layout (same as student detail export).
 * @param {object} student
 * @param {object} editablePlan
 * @param {{ stampDate?: Date|string, fileName?: string, logoUrl?: string|null }} [options]
 * logoUrl — PNG from settings only; omit/null means no header logo
 */
export async function downloadFloridaIepPdf(student, editablePlan, options = {}) {
  const stampDate = options.stampDate != null ? options.stampDate : null;
  const planDate = stampDate
    ? new Date(stampDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const fileNameOpt = options.fileName;
  const logo = await loadFloridaHeaderLogo(options.logoUrl);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const mL = 14;
      const mR = 14;
      const cW = pageW - mL - mR;
      let y = 12;
      let pageNum = 1;
      // planDate computed at top of downloadFloridaIepPdf

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

      const dobStr = (() => {
        if (!student.dateOfBirth) return '—';
        const raw = String(student.dateOfBirth);
        const m = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (m) return `${m[2]}/${m[3]}/${m[1]}`;
        return new Date(student.dateOfBirth).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      })();
      const ageStr = student.dateOfBirth
        ? (() => {
            const bd = new Date(student.dateOfBirth);
            const now = new Date();
            let yrs = now.getFullYear() - bd.getFullYear();
            if (now.getMonth() < bd.getMonth() || (now.getMonth() === bd.getMonth() && now.getDate() < bd.getDate())) yrs--;
            return `${yrs} Year(s)`;
          })()
        : (student.age != null ? `${student.age} Year(s)` : '—');
      const pdfDate = (d) => {
        if (!d) return '—';
        const raw = String(d);
        const m = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (m) return `${m[2]}/${m[3]}/${m[1]}`;
        const dt = new Date(d);
        return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      };
      const primaryExc =
        (student.primaryExceptionality && String(student.primaryExceptionality).trim()) ||
        student.disabilities?.[0] ||
        '—';
      const otherExc =
        (student.otherExceptionalities && String(student.otherExceptionalities).trim())
          ? student.otherExceptionalities
          : (student.primaryExceptionality && String(student.primaryExceptionality).trim())
            ? (student.disabilities || []).join(', ') || '—'
            : student.disabilities?.slice(1).join(', ') || '—';
      const domainsFromGoals = [...new Set((editablePlan.annual_goals || []).map(g => (g && typeof g === 'object' && g.domain) ? g.domain : null).filter(Boolean))].join(', ') || '—';
      const domains =
        (student.domainsTransitionAreas && String(student.domainsTransitionAreas).trim()) || domainsFromGoals;

      // ── Header: small logo top-left; titles centered on full page below ──
      const headerTop = 10;
      const subtitle = 'Individual Educational Plan (IEP) - Present Levels and Goals';
      if (logo && logo.w > 0 && logo.h > 0) {
        const maxW = 28;
        const maxH = 14;
        let dw = maxW;
        let dh = dw * (logo.h / logo.w);
        if (dh > maxH) {
          dh = maxH;
          dw = dh * (logo.w / logo.h);
        }
        pdf.addImage(logo.dataUrl, 'PNG', mL, headerTop, dw, dh);
        let ty = headerTop + dh + 3;
        pdf.setFont('helvetica', 'bold').setFontSize(11).setTextColor(0, 0, 0);
        pdf.text('School District', pageW / 2, ty, { align: 'center' });
        ty += 5;
        pdf.setFontSize(10);
        pdf.splitTextToSize(subtitle, cW).forEach((line) => {
          pdf.text(line, pageW / 2, ty, { align: 'center' });
          ty += 4;
        });
        y = ty + 2;
      } else {
        y = headerTop;
        pdf.setFont('helvetica', 'bold').setFontSize(11).setTextColor(0, 0, 0);
        pdf.text('School District', pageW / 2, y, { align: 'center' });
        y += 5;
        pdf.setFontSize(10);
        pdf.text(subtitle, pageW / 2, y, { align: 'center' });
        y += 6;
      }

      // ── Demographics Table ──
      const col1 = cW * 0.28;
      const col2 = cW * 0.22;
      const col3 = cW * 0.22;
      const col4 = cW * 0.28;
      const rH = 6;
      const rH2 = 8;

      drawRow(
        [
          { text: `Student: ${student.name || '—'}`, w: cW * 0.5, b: true },
          { text: `School: ${student.schoolName || '—'}`, w: cW * 0.5 },
        ],
        y,
        rH
      );
      y += rH;
      drawRow([{ text: `Student ID: ${student.studentId || '—'}`, w: col1, b: true }, { text: `Grade: ${student.gradeLevel || '—'}`, w: col2 }, { text: `DOB: ${dobStr}`, w: col3 }, { text: `Age: ${ageStr}`, w: col4 }], y, rH);
      y += rH;
      drawRow([{ text: `Address: ${student.address || '—'}`, w: cW }], y, rH);
      y += rH;
      drawRow(
        [
          { text: `Parent/Guardian: ${student.parentGuardian1 || '—'}`, w: cW * 0.5 },
          { text: `Parent/Guardian: ${student.parentGuardian2 || '—'}`, w: cW * 0.5 },
        ],
        y,
        rH
      );
      y += rH;
      drawRow(
        [
          { text: `Original Meeting Date/Plan Date: ${pdfDate(student.originalMeetingPlanDate)}`, w: cW * 0.34 },
          { text: `Initiation Date: ${pdfDate(student.initiationDate)}`, w: cW * 0.33 },
          { text: `Duration Date: ${pdfDate(student.durationDate)}`, w: cW * 0.33 },
        ],
        y,
        rH
      );
      y += rH;
      drawRow(
        [
          { text: `Review Due Date: ${pdfDate(student.reviewDueDate)}`, w: cW * 0.5 },
          { text: `Reevaluation Due Date: ${pdfDate(student.reevaluationDueDate)}`, w: cW * 0.5 },
        ],
        y,
        rH
      );
      y += rH;
      drawRow([{ text: `Primary Exceptionality: ${primaryExc}`, w: cW, b: true }], y, rH);
      y += rH;
      drawRow([{ text: `Other Exceptionalities: ${otherExc}`, w: cW }], y, rH);
      y += rH;
      drawRow([{ text: `Related Services/Therapy(ies): ${student.relatedServicesTherapy || '—'}`, w: cW }], y, rH);
      y += rH;
      drawRow(
        [
          { text: `Amendment Date: ${pdfDate(student.amendmentDate)}`, w: cW * 0.5 },
          { text: `Previously Amended: ${student.previouslyAmended || '—'}`, w: cW * 0.5 },
        ],
        y,
        rH
      );
      y += rH;
      drawRow([{ text: `Meeting Purpose: ${student.meetingPurpose || '—'}`, w: cW }], y, rH2);
      y += rH2;
      drawRow([{ text: `Domain(s)/Transition Service Activity Area(s): ${domains}`, w: cW, b: true }], y, rH);
      y += rH;
      drawRow([{ text: `Associated Plans: ${student.associatedPlans || '—'}`, w: cW }], y, rH);
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
        pdf.text(line, mL, y, { maxWidth: cW, align: 'justify' });
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
        strLines.forEach(line => { needPage(4); pdf.text(line, mL + 4, y, { maxWidth: cW - 4, align: 'justify' }); y += 3.8; });
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
        narLines.forEach(line => { needPage(4); pdf.text(line, mL + 4, y, { maxWidth: cW - 4, align: 'justify' }); y += 3.8; });
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
        acadLines.forEach(line => { needPage(4); pdf.text(line, mL + 4, y, { maxWidth: cW - 4, align: 'justify' }); y += 3.8; });
        y += 4;
      }

      // ── Goal Boxes ──
      const drawGoalBox = (goal, index, alignedObjs) => {
        const isObj = goal && typeof goal === 'object';
        const goalText = isObj ? (goal.goal || [goal.condition, goal.observable_behavior, goal.mastery_criteria].filter(Boolean).join(' ')) : String(goal || '');
        const domain = (isObj && goal.domain) ? goal.domain : '—';
        const measurement = (isObj && goal.progress_measurement) ? goal.progress_measurement : '—';
        const reporting = (isObj && goal.progress_reporting) ? goal.progress_reporting : '—';
        const pad = 3;
        const innerW = cW - pad * 2;

        pdf.setFontSize(8);
        const goalFullText = `${student.name || 'Student'} — ${goalText}`;
        pdf.setFont('helvetica', 'normal').setFontSize(8);
        const glWPre = pdf.getTextWidth('Goal: ');
        const goalFirstLines = pdf.splitTextToSize(goalFullText, innerW - glWPre);
        const goalRestText = goalFullText.slice(goalFirstLines[0]?.length || 0).trim();
        const goalRestLines = goalRestText ? pdf.splitTextToSize(goalRestText, innerW) : [];
        const totalGoalLines = 1 + goalRestLines.length;
        const objTexts = alignedObjs.map(o => {
          const t = typeof o === 'string' ? o : (o.objective || [o.condition, o.observable_behavior, o.mastery_criteria].filter(Boolean).join(' '));
          return pdf.splitTextToSize(`• ${t}`, innerW - 4);
        });
        const objTotalLines = objTexts.reduce((s, lines) => s + lines.length, 0);
        const estH = 4 + 5 + totalGoalLines * 3.5 + 2 + 4 + 4 + (alignedObjs.length > 0 ? 5 + objTotalLines * 3.5 : 0) + 4;
        needPage(Math.min(estH + 6, pageH - 30));

        const boxY = y;
        let cy = boxY + 4;

        pdf.setFont('helvetica', 'bold').setFontSize(8).setTextColor(0, 0, 0);
        pdf.text('Domain(s)/TSAA(s):', mL + pad, cy);
        pdf.setFont('helvetica', 'normal');
        pdf.text(` ${domain}`, mL + pad + pdf.getTextWidth('Domain(s)/TSAA(s):'), cy);
        cy += 5;

        pdf.setFont('helvetica', 'bold').setFontSize(8);
        pdf.text('Goal:', mL + pad, cy);
        pdf.setFont('helvetica', 'normal');
        pdf.text(goalFirstLines[0] || '', mL + pad + glWPre, cy, { maxWidth: innerW - glWPre, align: 'justify' });
        cy += 3.5;
        if (goalRestLines.length) {
          goalRestLines.forEach(line => { pdf.text(line, mL + pad, cy, { maxWidth: innerW, align: 'justify' }); cy += 3.5; });
        }
        cy += 1;

        pdf.setFont('helvetica', 'bold').setFontSize(7.5);
        pdf.text('Assessment Procedures:', mL + pad, cy);
        pdf.setFont('helvetica', 'normal');
        pdf.text(` ${measurement}`, mL + pad + pdf.getTextWidth('Assessment Procedures:'), cy);
        cy += 4;

        pdf.setFont('helvetica', 'bold').setFontSize(7.5);
        pdf.text('Progress Reported:', mL + pad, cy);
        pdf.setFont('helvetica', 'normal');
        pdf.text(` ${reporting}`, mL + pad + pdf.getTextWidth('Progress Reported:'), cy);
        cy += 4;

        if (alignedObjs.length > 0) {
          pdf.setFont('helvetica', 'bold').setFontSize(8);
          pdf.text('Short-term Objectives or Benchmarks:', mL + pad, cy);
          cy += 4;
          pdf.setFont('helvetica', 'normal').setFontSize(7.5);
          objTexts.forEach(lines => {
            lines.forEach(line => { pdf.text(line, mL + pad + 3, cy, { maxWidth: innerW - 3, align: 'justify' }); cy += 3.5; });
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
            const aligned = matchingObjs.filter(o => o.alignedAnnualGoalReferenceId && o.alignedAnnualGoalReferenceId === g.referenceId);
            drawGoalBox(goalObj, gi, aligned);
          });

          const linkedRefs = new Set((group.goals || []).map(g => g.referenceId).filter(Boolean));
          const unlinkedExc = matchingObjs.filter(o => !o.alignedAnnualGoalReferenceId || !linkedRefs.has(o.alignedAnnualGoalReferenceId));
          if (unlinkedExc.length) {
            drawGoalBox({ goal: 'Additional Objectives', domain: group.exceptionality, progress_measurement: '—', progress_reporting: '—' }, 0, unlinkedExc);
          }
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
          lines.forEach(line => { needPage(4); pdf.text(line, mL + 4, y, { maxWidth: cW - 6, align: 'justify' }); y += 3.8; });
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
        intLines.forEach(line => { needPage(4); pdf.text(line, mL + 4, y, { maxWidth: cW - 4, align: 'justify' }); y += 3.8; });
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
              aLines.forEach(line => { needPage(4); pdf.text(line, mL + 6, y, { maxWidth: cW - 8, align: 'justify' }); y += 3.5; });
              y += 1;
            });
            y += 2;
          });
        }
      }

      pdf.setTextColor(0, 0, 0);

      // ── Confidentiality Footer ──
      addFooter();

  const defaultName = `Florida_IEP_${(student.name || 'Student').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileNameOpt || defaultName);
}
