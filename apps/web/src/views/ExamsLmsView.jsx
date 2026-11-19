import React, { useState, useEffect, useCallback } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { api } from '../services/apiClient.js';
import { PageHeader, StatusBadge } from '../components/UiPrimitives.jsx';
import { Award, BookOpen, CheckCircle2, Lock } from 'lucide-react';

export const ExamsLmsView = () => {
  const { students, subjects, can, showToast, refreshAll } = useERP();
  const [schedules, setSchedules] = useState([]);
  const [results, setResults] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [marksForm, setMarksForm] = useState({ examId: '', studentId: '', internalMarks: 25, practicalMarks: 20, externalMarks: 45 });
  const [matForm, setMatForm] = useState({ subjectCode: subjects[0]?.code || 'CS-501', title: '', materialType: 'notes', description: '' });

  const loadAll = useCallback(() => {
    if (can('exams', 'view')) {
      api.get('/exams/schedules').then((d) => {
        setSchedules(d.schedules || []);
        if (d.schedules?.[0]?._id) setMarksForm((f) => ({ ...f, examId: f.examId || d.schedules[0]._id }));
      }).catch(() => {});
      api.get('/exams/results').then((d) => setResults(d.results || [])).catch(() => {});
    }
    if (can('lms', 'view')) {
      api.get('/exams/lms/materials').then((d) => setMaterials(d.materials || [])).catch(() => {});
    }
  }, [can]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    try {
      await api.put('/exams/marks', {
        examId: marksForm.examId || schedules[0]?._id,
        studentId: marksForm.studentId || students[0]?._id,
        internalMarks: Number(marksForm.internalMarks),
        practicalMarks: Number(marksForm.practicalMarks),
        externalMarks: Number(marksForm.externalMarks)
      });
      showToast('Marks submitted for moderation.');
      loadAll();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleExamAction = async (id, action) => {
    try {
      await api.post(`/exams/schedules/${id}/${action}`);
      showToast(`Exam ${action} completed.`);
      loadAll();
      refreshAll();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handlePostMaterial = async (e) => {
    e.preventDefault();
    try {
      await api.post('/exams/lms/materials', matForm);
      showToast('LMS material published.');
      setMatForm({ ...matForm, title: '', description: '' });
      loadAll();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Examinations, Audit-Locked Results & Basic LMS"
        subtitle="Faculty marks entry -> HOD/Controller verification -> Immutable SGPA/CGPA publication & course resources"
      />

      {can('exams', 'view') && (
        <>
          <div className="erp-card" style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Award size={17} color="var(--palette-cyan)" /> Examination Schedules & Moderation Pipeline
            </h2>
            <div className="table-container">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Exam Code</th>
                    <th>Subject</th>
                    <th>Date / Room</th>
                    <th>State</th>
                    <th>Governance Action</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((sc) => (
                    <tr key={sc._id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{sc.examCode}</td>
                      <td>{sc.subjectCode} — {sc.subjectName}</td>
                      <td>{sc.examDate} • {sc.room}</td>
                      <td><StatusBadge status={sc.state} /></td>
                      <td style={{ display: 'flex', gap: '0.4rem' }}>
                        {can('exams', 'approve') && sc.state === 'marks_open' && (
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleExamAction(sc._id, 'verify')}>
                            <CheckCircle2 size={14} /> Verify Marks
                          </button>
                        )}
                        {can('exams', 'publish') && sc.state === 'verified' && (
                          <button type="button" className="btn btn-success btn-sm" onClick={() => handleExamAction(sc._id, 'publish')}>
                            <Lock size={14} /> Publish & Audit-Lock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {can('exams', 'edit') && schedules.length > 0 && students.length > 0 && (
            <form onSubmit={handleSaveMarks} className="erp-card" style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Faculty Marks Entry</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.65rem' }}>
                <select className="select-field" value={marksForm.examId || schedules[0]?._id} onChange={(e) => setMarksForm({ ...marksForm, examId: e.target.value })}>
                  {schedules.map((s) => <option key={s._id} value={s._id}>{s.examCode}</option>)}
                </select>
                <select className="select-field" value={marksForm.studentId || students[0]?._id} onChange={(e) => setMarksForm({ ...marksForm, studentId: e.target.value })}>
                  {students.map((st) => <option key={st._id} value={st._id}>{st.name} ({st.rollNumber})</option>)}
                </select>
                <input type="number" min="0" max="50" className="input-field" placeholder="Internal" value={marksForm.internalMarks} onChange={(e) => setMarksForm({ ...marksForm, internalMarks: e.target.value })} />
                <input type="number" min="0" max="50" className="input-field" placeholder="Practical" value={marksForm.practicalMarks} onChange={(e) => setMarksForm({ ...marksForm, practicalMarks: e.target.value })} />
                <input type="number" min="0" max="100" className="input-field" placeholder="External" value={marksForm.externalMarks} onChange={(e) => setMarksForm({ ...marksForm, externalMarks: e.target.value })} />
                <button type="submit" className="btn btn-primary btn-sm">Submit Marks</button>
              </div>
            </form>
          )}

          {results.length > 0 && (
            <div className="erp-card" style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Audit-Locked Published Results</h2>
              <div className="table-container">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Academic Year / Sem</th>
                      <th>SGPA</th>
                      <th>Credits (Earned/Total)</th>
                      <th>Backlogs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r._id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r.rollNumber}</td>
                        <td>{r.academicYear} • Sem {r.semesterNumber}</td>
                        <td><span className="badge badge-purple">{r.sgpa.toFixed(2)}</span></td>
                        <td>{r.earnedCredits} / {r.totalCredits}</td>
                        <td>{r.backlogCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {can('lms', 'view') && (
        <section className="erp-card">
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <BookOpen size={17} color="var(--palette-cyan)" /> Basic LMS (Notes, Syllabus & Assignments)
          </h2>
          {can('lms', 'create') && (
            <form onSubmit={handlePostMaterial} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
              <select className="select-field" value={matForm.subjectCode} onChange={(e) => setMatForm({ ...matForm, subjectCode: e.target.value })}>
                {subjects.map((s) => <option key={s.code} value={s.code}>{s.code}</option>)}
              </select>
              <select className="select-field" value={matForm.materialType} onChange={(e) => setMatForm({ ...matForm, materialType: e.target.value })}>
                <option value="notes">Lecture Notes</option>
                <option value="syllabus">Syllabus</option>
                <option value="assignment">Assignment</option>
              </select>
              <input className="input-field" placeholder="Resource Title" required value={matForm.title} onChange={(e) => setMatForm({ ...matForm, title: e.target.value })} />
              <input className="input-field" placeholder="Instructions / Summary" value={matForm.description} onChange={(e) => setMatForm({ ...matForm, description: e.target.value })} />
              <button type="submit" className="btn btn-primary btn-sm">Publish Resource</button>
            </form>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
            {materials.map((m) => (
              <div key={m._id} style={{ padding: '0.85rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.72rem' }}>
                  <span className="badge badge-info">{m.subjectCode}</span>
                  <span style={{ textTransform: 'uppercase', color: 'var(--text-muted)' }}>{m.materialType}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.title}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{m.description}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

