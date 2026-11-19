import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useERP } from '../context/ERPContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/apiClient.js';
import { PageHeader, StatusBadge } from '../components/UiPrimitives.jsx';
import { extractFaceDescriptor, averageDescriptors, loadImageFile } from '../utils/faceRecognition.js';
import { formatDateTimeIST, todayIST } from '../utils/formatters.js';
import {
  Shield,
  ScanFace,
  CheckCircle2,
  Camera,
  CameraOff,
  UserPlus,
  Trash2,
  Upload,
  QrCode,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Lock
} from 'lucide-react';

export const FaceAttendanceView = () => {
  const { showToast, students, subjects, can, currentRole, refreshAll } = useERP();
  const { t } = useLanguage();

  const [activeSubTab, setActiveSubTab] = useState('recognize');
  const [policy, setPolicy] = useState(null);
  const [userConsent, setUserConsent] = useState(null);
  const [alternativeMethod, setAlternativeMethod] = useState('qr');
  const [consentGiven, setConsentGiven] = useState(false);

  // Face Recognition & Enrollment State
  const [profiles, setProfiles] = useState([]);
  const [recentFaceEvents, setRecentFaceEvents] = useState([]);
  const [subjectCode, setSubjectCode] = useState(subjects[0]?.code || 'CS-501');
  const [sessionDate, setSessionDate] = useState(todayIST());
  const [lectureSlot, setLectureSlot] = useState('SLOT-1');
  const [markStatus, setMarkStatus] = useState('Present');
  const [thresholdPct, setThresholdPct] = useState(84);

  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?._id || '');
  const [enrollConsent, setEnrollConsent] = useState(true);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const [lastMatchResult, setLastMatchResult] = useState(null);
  const [enrollProgress, setEnrollProgress] = useState('');

  // QR Check-In State
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [generatedQr, setGeneratedQr] = useState(null);

  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const autoScanTimerRef = useRef(null);

  const loadData = useCallback(() => {
    api
      .get('/attendance/biometric-policy')
      .then((d) => {
        setPolicy(d.policy);
        setUserConsent(d.userConsent);
        if (d.userConsent) {
          setConsentGiven(Boolean(d.userConsent.consentGiven));
          setAlternativeMethod(d.userConsent.alternativeMethodSelected || 'qr');
        }
      })
      .catch(() => {});

    api
      .get('/attendance/face/profiles')
      .then((d) => setProfiles(d.profiles || []))
      .catch(() => {});

    api
      .get(`/attendance/events?sessionDate=${todayIST()}`)
      .then((d) => setRecentFaceEvents((d.events || []).filter((e) => e.personType === 'student')))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stopCamera = useCallback(() => {
    if (autoScanTimerRef.current) {
      clearInterval(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
    }
    setAutoScan(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Webcam API is unavailable in this browser. Use the Upload Photo option below instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      setCameraActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch (err) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Allow camera access or use the Upload Photo button below.'
          : `Could not open webcam (${err.message}). You can still use the Upload Photo button below.`
      );
    }
  };

  const drawOverlayBox = (box, label, matched) => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!box) return;

    const stroke = matched === true ? '#10b981' : matched === false ? '#f59e0b' : '#88CCF1';
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    if (label) {
      ctx.font = '600 14px Inter, sans-serif';
      const tw = ctx.measureText(label).width + 16;
      ctx.fillStyle = stroke;
      ctx.fillRect(box.x, Math.max(0, box.y - 26), tw, 24);
      ctx.fillStyle = '#0b161c';
      ctx.fillText(label, box.x + 8, Math.max(16, box.y - 9));
    }
  };

  const runRecognitionFromElement = useCallback(
    async (sourceEl) => {
      setIsProcessing(true);
      try {
        const extracted = await extractFaceDescriptor(sourceEl);
        if (!extracted.faceDetected || !extracted.descriptor) {
          setLastMatchResult({ matched: false, message: extracted.reason || 'No clear face detected in frame.' });
          showToast(extracted.reason || 'No clear face detected in frame.', 'warning');
          return;
        }

        const res = await api.post('/attendance/face/recognize-and-mark', {
          descriptor: extracted.descriptor,
          subjectCode: subjectCode || subjects[0]?.code || 'CS-501',
          sessionDate,
          lectureSlot,
          threshold: thresholdPct / 100,
          status: markStatus
        });

        setLastMatchResult({ ...res, qualityScore: extracted.qualityScore });
        if (sourceEl === videoRef.current) {
          drawOverlayBox(
            extracted.box,
            res.matched ? `${res.student.name} (${res.confidencePct}%)` : `No Match (${res.bestConfidencePct || 0}%)`,
            res.matched
          );
        }

        if (res.matched) {
          showToast(
            res.alreadyMarked
              ? `${res.student.name} (${res.student.rollNumber}) already marked for ${subjectCode} (${res.confidencePct}% match).`
              : `Attendance marked ${markStatus} for ${res.student.name} (${res.confidencePct}% match)!`,
            'success'
          );
          loadData();
          refreshAll();
        } else {
          showToast(res.message || 'Face did not match any enrolled student.', 'warning');
        }
      } catch (err) {
        showToast(err.message, 'danger');
        setLastMatchResult({ matched: false, message: err.message });
      } finally {
        setIsProcessing(false);
      }
    },
    [subjectCode, subjects, sessionDate, lectureSlot, thresholdPct, markStatus, showToast, loadData, refreshAll]
  );

  // Auto-scan interval when enabled
  useEffect(() => {
    if (autoScan && cameraActive && activeSubTab === 'recognize') {
      autoScanTimerRef.current = setInterval(() => {
        if (videoRef.current && !isProcessing) {
          runRecognitionFromElement(videoRef.current);
        }
      }, 3200);
      return () => {
        if (autoScanTimerRef.current) clearInterval(autoScanTimerRef.current);
      };
    }
  }, [autoScan, cameraActive, activeSubTab, isProcessing, runRecognitionFromElement]);

  const handleEnrollLiveCamera = async () => {
    if (!enrollConsent) {
      showToast('Please confirm informed consent before enrolling a face template.', 'warning');
      return;
    }
    if (!videoRef.current || !cameraActive) {
      showToast('Start the webcam first or upload a portrait photo.', 'warning');
      return;
    }
    const targetId = selectedStudentId || students[0]?._id;
    if (can('attendance', 'create') && !targetId) {
      showToast('Select a student to enroll.', 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      const descriptors = [];
      for (let i = 1; i <= 3; i += 1) {
        setEnrollProgress(`Capturing sample ${i} of 3... Hold steady`);
        const extracted = await extractFaceDescriptor(videoRef.current);
        if (extracted.faceDetected && extracted.descriptor) {
          descriptors.push(extracted.descriptor);
          drawOverlayBox(extracted.box, `Enrolling ${i}/3`, true);
        }
        if (i < 3) await new Promise((r) => setTimeout(r, 350));
      }

      if (descriptors.length === 0) {
        showToast('Could not detect a clear face. Check lighting and try again.', 'danger');
        setEnrollProgress('');
        return;
      }

      const averaged = averageDescriptors(descriptors);
      const res = await api.post('/attendance/face/enroll', {
        studentId: targetId || undefined,
        descriptor: averaged,
        sampleCount: descriptors.length,
        consentGiven: true
      });
      showToast(`Face template enrolled for ${res.profile.personName} (${res.profile.personCode}).`);
      setEnrollProgress(`Enrolled ${res.profile.personName} (${descriptors.length} samples averaged).`);
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
      setEnrollProgress('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadPhotoAction = async (e, mode) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsProcessing(true);
    try {
      const img = await loadImageFile(file);
      if (mode === 'recognize') {
        await runRecognitionFromElement(img);
      } else {
        if (!enrollConsent) {
          showToast('Please confirm informed consent before enrolling.', 'warning');
          return;
        }
        const extracted = await extractFaceDescriptor(img);
        if (!extracted.faceDetected || !extracted.descriptor) {
          showToast(extracted.reason || 'Could not detect a clear face in the uploaded photo.', 'danger');
          return;
        }
        const targetId = selectedStudentId || students[0]?._id;
        const res = await api.post('/attendance/face/enroll', {
          studentId: targetId || undefined,
          descriptor: extracted.descriptor,
          sampleCount: 1,
          consentGiven: true
        });
        showToast(`Face template enrolled from photo for ${res.profile.personName} (${res.profile.personCode}).`);
        setEnrollProgress(`Enrolled ${res.profile.personName} from uploaded portrait.`);
        loadData();
      }
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteProfile = async (personId, name) => {
    try {
      await api.delete(`/attendance/face/profiles/${personId}`);
      showToast(`Face template revoked and deleted for ${name}.`, 'info');
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleSaveConsent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/biometric-consent', {
        consentGiven,
        alternativeMethodSelected: alternativeMethod
      });
      showToast('Attendance capture & consent preference persisted.');
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleTogglePolicy = async () => {
    try {
      const next = !policy?.settingsFaceEnabled;
      await api.patch('/attendance/biometric-policy', {
        faceMatchingEnabled: next,
        privacyAssessmentApproved: next
      });
      showToast(`Institutional face recognition policy ${next ? 'enabled' : 'disabled'}.`);
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleGenerateQr = async () => {
    try {
      const res = await api.post('/attendance/qr-sessions', {
        subjectCode: subjectCode || subjects[0]?.code || 'CS-501',
        sessionDate,
        lectureSlot,
        ttlMinutes: 15
      });
      setGeneratedQr(res.session);
      showToast(`QR Check-In Token generated: ${res.session.codeToken}`);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleQrCheckin = async (e) => {
    e.preventDefault();
    if (!qrTokenInput.trim()) return;
    try {
      const res = await api.post('/attendance/qr-checkin', { codeToken: qrTokenInput.trim() });
      showToast(res.duplicateIgnored ? 'Attendance already marked for this QR session.' : 'QR Attendance marked Present!');
      setQrTokenInput('');
      loadData();
      refreshAll();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const activeSubjectValue = subjectCode || subjects[0]?.code || 'CS-501';
  const activeStudentValue = selectedStudentId || students[0]?._id || '';

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Mark Attendance"
        subtitle="Live face recognition attendance marking, student face template enrollment, QR check-in, and privacy safeguards"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeSubTab === 'recognize' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveSubTab('recognize')}
            >
              <ScanFace size={15} /> Face Recognition
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeSubTab === 'enroll' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveSubTab('enroll')}
            >
              <UserPlus size={15} /> Enroll Face ({profiles.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeSubTab === 'policy' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveSubTab('policy')}
            >
              <Shield size={15} /> QR & Privacy Policy
            </button>
          </div>
        }
      />

      {/* TAB 1 & TAB 2: LIVE CAMERA + FACE RECOGNITION / ENROLLMENT */}
      {(activeSubTab === 'recognize' || activeSubTab === 'enroll') && (
        <>
          {/* Session Configuration Bar (for Recognition Mode) */}
          {activeSubTab === 'recognize' && (
            <div className="erp-card" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem', alignItems: 'end' }}>
                <div className="input-group">
                  <label className="input-label">Subject / Course</label>
                  <select className="select-field" value={activeSubjectValue} onChange={(e) => setSubjectCode(e.target.value)}>
                    {subjects.length === 0 ? (
                      <option value="CS-501">CS-501 — Advanced Algorithms</option>
                    ) : (
                      subjects.map((sub) => (
                        <option key={sub._id || sub.code} value={sub.code}>
                          {sub.code} — {sub.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Session Date</label>
                  <input type="date" className="input-field" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
                </div>

                <div className="input-group">
                  <label className="input-label">Lecture Slot</label>
                  <select className="select-field" value={lectureSlot} onChange={(e) => setLectureSlot(e.target.value)}>
                    {['SLOT-1', 'SLOT-2', 'SLOT-3', 'SLOT-4', 'SLOT-5', 'LAB-1'].map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Attendance Status</label>
                  <select className="select-field" value={markStatus} onChange={(e) => setMarkStatus(e.target.value)}>
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Match Threshold ({thresholdPct}%)</label>
                  <input
                    type="range"
                    min="70"
                    max="95"
                    value={thresholdPct}
                    onChange={(e) => setThresholdPct(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)', height: '38px' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {/* Camera Preview Panel */}
            <div className="erp-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Camera size={18} color="var(--palette-cyan)" />
                  {activeSubTab === 'recognize' ? 'Live Face Recognition Camera' : 'Face Template Enrollment Camera'}
                </h2>
                <StatusBadge status={cameraActive ? 'active' : 'pending'} />
              </div>

              {cameraError && (
                <div
                  role="alert"
                  style={{
                    padding: '0.7rem 0.85rem',
                    marginBottom: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--warning-bg)',
                    border: '1px solid var(--warning-border)',
                    color: 'var(--warning)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <AlertCircle size={16} /> <span>{cameraError}</span>
                </div>
              )}

              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4 / 3',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-color)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.9rem'
                }}
              >
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: cameraActive ? 'block' : 'none',
                    transform: 'scaleX(-1)'
                  }}
                />
                <canvas
                  ref={overlayCanvasRef}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    transform: 'scaleX(-1)'
                  }}
                />

                {cameraActive && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      width: '52%',
                      height: '68%',
                      borderRadius: '50%',
                      border: '2px dashed rgba(136, 204, 241, 0.55)',
                      pointerEvents: 'none'
                    }}
                  />
                )}

                {!cameraActive && (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                    <ScanFace size={48} color="var(--palette-cyan)" style={{ margin: '0 auto 0.65rem', opacity: 0.75 }} />
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      Camera Standby
                    </div>
                    <p style={{ fontSize: '0.78rem', maxWidth: '300px', margin: '0 auto' }}>
                      Click <strong>Start Camera</strong> for live webcam face recognition, or use <strong>Upload Photo</strong> below.
                    </p>
                  </div>
                )}
              </div>

              {/* Camera & Action Controls */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem', alignItems: 'center' }}>
                {!cameraActive ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={startCamera}>
                    <Camera size={15} /> Start Camera
                  </button>
                ) : (
                  <button type="button" className="btn btn-danger btn-sm" onClick={stopCamera}>
                    <CameraOff size={15} /> Stop Camera
                  </button>
                )}

                {activeSubTab === 'recognize' ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      disabled={!cameraActive || isProcessing}
                      onClick={() => videoRef.current && runRecognitionFromElement(videoRef.current)}
                    >
                      <ScanFace size={15} /> {isProcessing ? 'Scanning...' : 'Scan & Mark Attendance'}
                    </button>

                    <button
                      type="button"
                      className={`btn btn-sm ${autoScan ? 'btn-primary' : 'btn-secondary'}`}
                      disabled={!cameraActive}
                      onClick={() => setAutoScan(!autoScan)}
                    >
                      <RefreshCw size={14} className={autoScan ? 'animate-spin' : ''} /> {autoScan ? 'Auto-Scan ON' : 'Auto-Scan'}
                    </button>

                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                      <Upload size={14} /> Upload Photo to Mark
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleUploadPhotoAction(e, 'recognize')}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      disabled={!cameraActive || isProcessing}
                      onClick={handleEnrollLiveCamera}
                    >
                      <Sparkles size={15} /> {isProcessing ? 'Capturing...' : 'Capture 3 Samples & Enroll'}
                    </button>

                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                      <Upload size={14} /> Enroll from Photo
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleUploadPhotoAction(e, 'enroll')}
                      />
                    </label>
                  </>
                )}
              </div>

              <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
                Privacy guarantee: Face features are extracted locally in-browser as a 128-D numerical vector. Raw face photographs are never uploaded or stored on the server.
              </p>
            </div>

            {/* Right Panel: Recognition Result OR Enrollment Form */}
            {activeSubTab === 'recognize' ? (
              <div className="erp-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CheckCircle2 size={18} color="var(--success)" /> Recognition Status & Result
                  </h2>
                  <span className="badge badge-info">{profiles.length} Enrolled Faces</span>
                </div>

                {profiles.length === 0 && (
                  <div
                    style={{
                      padding: '0.9rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--info-bg)',
                      border: '1px solid var(--info-border)',
                      fontSize: '0.82rem'
                    }}
                  >
                    <strong>Step 1:</strong> No student faces are enrolled yet. Switch to the{' '}
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('enroll')}
                      style={{ background: 'none', border: 'none', color: 'var(--palette-cyan)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      Enroll Face
                    </button>{' '}
                    tab to register a student&apos;s face template first, then return here to mark attendance automatically!
                  </div>
                )}

                {lastMatchResult ? (
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: lastMatchResult.matched ? 'var(--success-bg)' : 'var(--warning-bg)',
                      border: `1px solid ${lastMatchResult.matched ? 'var(--success-border)' : 'var(--warning-border)'}`
                    }}
                  >
                    {lastMatchResult.matched ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--success)' }}>
                            {lastMatchResult.alreadyMarked ? 'Verified — Already Marked' : 'Face Verified & Attendance Marked'}
                          </span>
                          <span className="badge badge-success">{lastMatchResult.confidencePct}% Match</span>
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>{lastMatchResult.student?.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          Roll No: <strong>{lastMatchResult.student?.rollNumber}</strong> • Dept: <strong>{lastMatchResult.student?.deptCode}</strong> • Overall Attendance: <strong>{lastMatchResult.student?.attendancePct}%</strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                          Subject: {activeSubjectValue} • Slot: {lectureSlot} • Status: {lastMatchResult.event?.status || markStatus}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 700, color: 'var(--warning)', marginBottom: '0.3rem' }}>No Confident Match</div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>{lastMatchResult.message}</p>
                        {lastMatchResult.candidates?.length > 0 && (
                          <div style={{ marginTop: '0.55rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            Closest candidates:{' '}
                            {lastMatchResult.candidates.map((c) => `${c.personName} (${c.confidencePct}%)`).join(', ')}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                    Align the student&apos;s face inside the oval guide and click <strong>Scan &amp; Mark Attendance</strong>.
                  </div>
                )}

                <div>
                  <h3 style={{ fontSize: '0.92rem', marginBottom: '0.6rem' }}>Today&apos;s Marked Attendance ({recentFaceEvents.length})</h3>
                  <div className="table-container" style={{ maxHeight: '230px', overflowY: 'auto' }}>
                    <table className="erp-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Subject</th>
                          <th>Method</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentFaceEvents.slice(0, 10).map((ev) => (
                          <tr key={ev._id}>
                            <td>
                              <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{ev.personName}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ev.personCode}</div>
                            </td>
                            <td style={{ fontSize: '0.8rem' }}>{ev.subjectCode} • {ev.lectureSlot}</td>
                            <td>
                              <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                                {ev.captureMethod === 'face_advisory' ? 'Face AI' : ev.captureMethod}
                              </span>
                            </td>
                            <td><StatusBadge status={ev.status} /></td>
                          </tr>
                        ))}
                        {recentFaceEvents.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              No attendance marked yet for {todayIST()}.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="erp-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <h2 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <UserPlus size={18} color="var(--palette-cyan)" /> Register Student Face Template
                </h2>

                {can('attendance', 'create') ? (
                  <div className="input-group">
                    <label className="input-label">Select Student to Enroll</label>
                    <select className="select-field" value={activeStudentValue} onChange={(e) => setSelectedStudentId(e.target.value)}>
                      {students.map((stu) => (
                        <option key={stu._id} value={stu._id}>
                          {stu.name} ({stu.rollNumber} • {stu.deptCode})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', padding: '0.65rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    Self-enrollment mode active ({currentRole}). Your face vector will be linked strictly to your own student profile.
                  </div>
                )}

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={enrollConsent}
                    onChange={(e) => setEnrollConsent(e.target.checked)}
                    style={{ marginTop: '3px' }}
                  />
                  <span>
                    I confirm informed consent to store a revocable 128-D mathematical face vector for attendance verification (no raw image is stored).
                  </span>
                </label>

                {enrollProgress && (
                  <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>
                    {enrollProgress}
                  </div>
                )}

                <div>
                  <h3 style={{ fontSize: '0.92rem', marginBottom: '0.55rem' }}>Enrolled Face Templates ({profiles.length})</h3>
                  <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <table className="erp-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Samples</th>
                          <th>Enrolled</th>
                          {can('attendance', 'create') && <th>Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {profiles.map((p) => (
                          <tr key={p._id}>
                            <td>
                              <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{p.personName}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                {p.personCode} • #{p.descriptorHash?.slice(0, 8)}
                              </div>
                            </td>
                            <td><span className="badge badge-info">{p.sampleCount || 1}x</span></td>
                            <td style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{formatDateTimeIST(p.updatedAt)}</td>
                            {can('attendance', 'create') && (
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-icon"
                                  title="Revoke & Delete Face Template"
                                  onClick={() => handleDeleteProfile(p.personId, p.personName)}
                                >
                                  <Trash2 size={15} color="var(--danger)" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                        {profiles.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              No students enrolled yet. Start camera or upload a clear face photo to enroll.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 3: QR CHECK-IN & BIOMETRIC PRIVACY POLICY */}
      {activeSubTab === 'policy' && (
        <>
          <div
            className="erp-card"
            style={{
              marginBottom: '1.25rem',
              borderColor: policy?.faceMatchingEnabled ? 'var(--success-border)' : 'var(--warning-border)',
              background: policy?.faceMatchingEnabled ? 'var(--success-bg)' : 'var(--warning-bg)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                {policy?.faceMatchingEnabled ? <ScanFace size={22} color="var(--success)" /> : <Lock size={22} color="var(--warning)" />}
                <div>
                  <h2 style={{ fontSize: '1.02rem', marginBottom: '0.35rem' }}>
                    Face Recognition Status: {policy?.faceMatchingEnabled ? 'Active (Privacy-Preserving Vector Mode)' : 'Disabled by Policy Gate'}
                  </h2>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {t('biometrics.policyNotice')}
                  </p>
                </div>
              </div>
              {can('settings', 'configure') && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleTogglePolicy}>
                  {policy?.settingsFaceEnabled ? 'Disable Institution Policy' : 'Approve Institution Policy'}
                </button>
              )}
            </div>
          </div>

          <div className="card-grid-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {/* QR Attendance Alternative */}
            <div className="erp-card">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <QrCode size={18} color="var(--palette-cyan)" /> QR Session Check-In (Non-Biometric)
              </h3>
              {can('attendance', 'create') && (
                <div style={{ marginBottom: '1rem' }}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleGenerateQr}>
                    Generate 15-Min QR Session Token ({activeSubjectValue})
                  </button>
                  {generatedQr && (
                    <div style={{ marginTop: '0.65rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', textAlign: 'center', color: 'var(--palette-cyan)' }}>
                      {generatedQr.codeToken}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleQrCheckin} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter CASQR-... session token"
                  value={qrTokenInput}
                  onChange={(e) => setQrTokenInput(e.target.value)}
                />
                <button type="submit" className="btn btn-success btn-sm" style={{ whiteSpace: 'nowrap' }}>
                  Check In
                </button>
              </form>
            </div>

            {/* Institutional Safeguard Checklist */}
            <div className="erp-card">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Shield size={18} color="var(--palette-cyan)" /> Institutional Safeguard Checklist
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Environment Gate (`BIOMETRIC_POLICY_APPROVED`)</span>
                  <StatusBadge status={policy?.envPolicyApproved ? 'approved' : 'pending'} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Privacy / Legal Impact Assessment</span>
                  <StatusBadge status={policy?.privacyAssessmentApproved ? 'approved' : 'pending'} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Penalty-Free Non-Biometric Alternative</span>
                  <StatusBadge status="active" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Template Retention Window</span>
                  <strong>{policy?.retentionDays ?? 365} days</strong>
                </div>
              </div>
            </div>

            {/* Personal Consent Form */}
            <form onSubmit={handleSaveConsent} className="erp-card">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.85rem' }}>Your Consent & Preferred Alternative</h3>
              <div className="input-group" style={{ marginBottom: '0.85rem' }}>
                <label className="input-label">Penalty-Free Non-Biometric Method</label>
                <select className="select-field" value={alternativeMethod} onChange={(e) => setAlternativeMethod(e.target.value)}>
                  <option value="qr">QR Session Token Check-In</option>
                  <option value="rfid">Campus RFID / Smart ID Card</option>
                  <option value="manual">Manual Faculty Roll Call</option>
                </select>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', marginBottom: '1rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)} />
                I acknowledge the institutional privacy notice and consent to face vector attendance verification.
              </label>

              <button type="submit" className="btn btn-primary btn-sm">
                <CheckCircle2 size={15} /> Save Consent Preference
              </button>

              {userConsent && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.65rem' }}>
                  Recorded choice: {userConsent.consentGiven ? 'Consented' : 'Non-biometric only'} • Alternative: {userConsent.alternativeMethodSelected.toUpperCase()}
                </p>
              )}
            </form>
          </div>
        </>
      )}
    </div>
  );
};
