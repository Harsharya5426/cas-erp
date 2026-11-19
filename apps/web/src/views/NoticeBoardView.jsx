import React, { useState } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { formatDateIST } from '../utils/formatters.js';
import { PageHeader, StatusBadge, EmptyState } from '../components/UiPrimitives.jsx';
import { PlusCircle, Search } from 'lucide-react';

export const NoticeBoardView = ({ onOpenBroadcast }) => {
  const { announcements, can } = useERP();
  const { lang } = useLanguage();
  const [search, setSearch] = useState('');

  const filtered = announcements.filter(
    (a) =>
      !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.content?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Campus Broadcasts & Official Circulars"
        subtitle="Role-targeted bilingual notices persisted in MongoDB"
        actions={
          can('notifications', 'create') && (
            <button type="button" onClick={onOpenBroadcast} className="btn btn-primary btn-sm">
              <PlusCircle size={15} /> Publish Circular
            </button>
          )
        }
      />

      <div className="erp-card" style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem' }}>
        <div className="input-with-icon">
          <span className="icon-prefix"><Search size={15} /></span>
          <input className="input-field" placeholder="Search notices..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No notices found" description="Official circulars matching your role will appear here." />
      ) : (
        <div className="card-grid-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {filtered.map((n) => (
            <div key={n._id} className="erp-card" style={{ borderLeft: '4px solid var(--palette-cyan)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                  <StatusBadge status={n.priority} />
                  <span className="badge badge-neutral">{n.category}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target: {n.targetRole}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDateIST(n.publishedAt)}</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>
                {lang === 'hi' && n.titleHi ? n.titleHi : n.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                {lang === 'hi' && n.contentHi ? n.contentHi : n.content}
              </p>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Issued by {n.authorName} ({n.departmentName})
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
