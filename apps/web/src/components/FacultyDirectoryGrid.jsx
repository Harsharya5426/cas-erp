import React, { useState, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  BookOpen,
  GraduationCap,
  Award,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const FacultyDirectoryGrid = ({
  faculty = [],
  title = 'CAS Faculty Directory',
  subtitle = 'Verified current faculty roster from cas.res.in/faculty.html',
  compact = false
}) => {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

  const departments = useMemo(() => {
    const set = new Set(faculty.map((f) => f.deptCode).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [faculty]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return faculty.filter((f) => {
      if (deptFilter !== 'ALL' && f.deptCode !== deptFilter) return false;
      if (!q) return true;
      return (
        f.name?.toLowerCase().includes(q) ||
        f.designation?.toLowerCase().includes(q) ||
        f.qualification?.toLowerCase().includes(q) ||
        f.specialization?.toLowerCase().includes(q) ||
        (f.areasOfInterest || []).some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [faculty, search, deptFilter]);

  const visibleList = compact ? filtered.slice(0, 6) : filtered;

  return (
    <section className="erp-card" style={{ marginBottom: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GraduationCap size={19} color="var(--palette-cyan)" /> {title} ({filtered.length})
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            {subtitle}
          </p>
        </div>

        <a
          href="https://cas.res.in/faculty.html"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
        >
          cas.res.in/faculty.html <ExternalLink size={13} />
        </a>
      </div>

      {!compact && (
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginBottom: '1.15rem',
            alignItems: 'center'
          }}
        >
          <div className="input-with-icon" style={{ flex: 1, minWidth: '220px' }}>
            <span className="icon-prefix">
              <Search size={15} />
            </span>
            <input
              type="search"
              className="input-field"
              placeholder="Search faculty by name, qualification, or research interest..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {departments.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDeptFilter(d)}
                className={`btn btn-sm ${deptFilter === d ? 'btn-primary' : 'btn-secondary'}`}
              >
                {d === 'ALL' ? 'All Depts' : d}
              </button>
            ))}
          </div>
        </div>
      )}

      {visibleList.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
          No faculty records match your current filter.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
            gap: '1rem'
          }}
        >
          {visibleList.map((f) => {
            const key = f._id || f.employeeCode || f.name;
            const isExpanded = expandedId === key;
            const isDean = f.name?.toLowerCase().includes('anuj kumar sharma');

            return (
              <article
                key={key}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: isDean ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                  {f.photoUrl ? (
                    <img
                      src={f.photoUrl}
                      alt={f.name}
                      style={{
                        width: '62px',
                        height: '62px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        objectPosition: 'top',
                        border: '2px solid var(--accent-primary)',
                        flexShrink: 0,
                        background: 'var(--bg-secondary)'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '62px',
                        height: '62px',
                        borderRadius: '50%',
                        background: 'var(--accent-primary)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.15rem',
                        flexShrink: 0
                      }}
                    >
                      {f.name?.charAt(0) || 'F'}
                    </div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '0.94rem', fontWeight: 800, margin: 0 }}>{f.name}</h3>
                      {isDean && (
                        <span className="badge badge-info" style={{ fontSize: '0.58rem' }}>
                          Dean Academics
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--palette-cyan)', fontWeight: 600 }}>
                      {f.designation}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '0.62rem' }}>
                        {f.deptCode}
                      </span>
                      {f.publicationsCount > 0 && (
                        <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>
                          <Award size={10} /> {f.publicationsCount}+ Papers
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {f.qualification && (
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Qualification:</strong> {f.qualification}
                  </div>
                )}

                {(f.areasOfInterest?.length > 0 || f.specialization) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {(f.areasOfInterest?.length ? f.areasOfInterest : [f.specialization]).slice(0, 4).map((area, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.67rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                )}

                {f.bio && (
                  <div>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        margin: 0,
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: isExpanded ? 'unset' : 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {f.bio}
                    </p>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : key)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--palette-cyan)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '0.2rem 0 0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      {isExpanded ? (
                        <>
                          Show less <ChevronUp size={12} />
                        </>
                      ) : (
                        <>
                          Read profile <ChevronDown size={12} />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Official Academic Links */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: 'auto', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)' }}>
                  {f.profilePageUrl && (
                    <a href={f.profilePageUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                      Profile <ExternalLink size={10} />
                    </a>
                  )}
                  {f.googleScholarUrl && (
                    <a href={f.googleScholarUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                      <BookOpen size={10} /> Scholar
                    </a>
                  )}
                  {f.scopusUrl && (
                    <a href={f.scopusUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                      Scopus <ExternalLink size={10} />
                    </a>
                  )}
                  {f.orcidUrl && (
                    <a href={f.orcidUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                      ORCID
                    </a>
                  )}
                  {f.researchGateUrl && (
                    <a href={f.researchGateUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                      ResearchGate
                    </a>
                  )}
                  {f.publicationsPdfUrl && (
                    <a href={f.publicationsPdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                      <FileText size={10} /> Publications
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
