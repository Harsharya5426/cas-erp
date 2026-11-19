import React, { useState } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/apiClient.js';
import { PageHeader } from '../components/UiPrimitives.jsx';
import { BookOpen, PlusCircle } from 'lucide-react';

export const CoursesView = ({ onOpenAddCourse }) => {
  const { subjects, departments, programs, publicFaculty, can, refreshAll, showToast } = useERP();
  const { lang } = useLanguage();
  const [selectedDept, setSelectedDept] = useState('ALL');

  const findFacultyProfile = (name) => {
    if (!name) return null;
    const lower = name.toLowerCase();
    return publicFaculty.find((f) => f.name?.toLowerCase().includes(lower) || lower.includes(f.name?.toLowerCase()));
  };

  const filtered = subjects.filter(
    (s) => selectedDept === 'ALL' || s.departmentId?.code === selectedDept
  );

  const handleProgressBump = async (sub) => {
    const next = Math.min(100, (sub.syllabusProgressPct || 0) + 10);
    try {
      await api.patch(`/org/subjects/${sub._id}`, { syllabusProgressPct: next });
      await refreshAll();
      showToast(`Saved ${sub.code} syllabus coverage: ${next}%`);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Configurable Academic Structure & Curriculum"
        subtitle="Institution -> Department -> Program -> Subject catalog (no hard-coded offerings)"
        actions={
          can('academics', 'create') && (
            <button type="button" onClick={onOpenAddCourse} className="btn btn-primary btn-sm">
              <PlusCircle size={15} /> Register Subject
            </button>
          )
        }
      />

      <div className="erp-card" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          <strong>{departments.length}</strong> Departments • <strong>{programs.length}</strong> Programs • <strong>{subjects.length}</strong> Active Subjects
        </div>
        <select className="select-field" style={{ width: 'auto' }} value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
          <option value="ALL">All Departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d.code}>{d.code} — {d.name}</option>
          ))}
        </select>
      </div>

      <div className="card-grid-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {filtered.map((sub) => (
          <div key={sub._id} className="erp-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--palette-cyan)' }}>{sub.code}</span>
              <span className="badge badge-info">{sub.credits} Credits • Sem {sub.semesterNumber}</span>
            </div>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>
              <BookOpen size={14} style={{ display: 'inline', marginRight: '6px' }} />
              {lang === 'hi' && sub.nameHi ? sub.nameHi : sub.name}
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {findFacultyProfile(sub.facultyName)?.photoUrl && (
                <img
                  src={findFacultyProfile(sub.facultyName).photoUrl}
                  alt={sub.facultyName}
                  style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: '1px solid var(--accent-primary)' }}
                />
              )}
              <span>Dept: {sub.departmentId?.code || '—'} • Faculty: <strong>{sub.facultyName || 'Unassigned'}</strong></span>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span>Syllabus Progress</span>
                <strong>{sub.syllabusProgressPct || 0}%</strong>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${sub.syllabusProgressPct || 0}%`, height: '100%', background: 'var(--accent-primary)' }} />
              </div>
            </div>
            {can('academics', 'edit') && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleProgressBump(sub)}>
                +10% Syllabus Covered
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
