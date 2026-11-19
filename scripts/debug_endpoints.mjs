async function debug() {
  const loginRes = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@cas.res.in', password: 'CasErp@2026!' })
  });
  const adminToken = (await loginRes.json()).data.accessToken;

  const studentLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@cas.res.in', password: 'CasErp@2026!' })
  });
  const studentToken = (await studentLogin.json()).data.accessToken;

  console.log('--- 1. Healthz:');
  const h = await fetch('http://localhost:4000/api/v1/healthz');
  console.log(h.status, await h.json());

  console.log('--- 2. Readyz:');
  const r = await fetch('http://localhost:4000/api/v1/readyz');
  console.log(r.status, await r.json());

  console.log('--- 3. Non-existent login:');
  const ne = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bad@test.com', password: 'CasErp@2026!' })
  });
  console.log(ne.status, await ne.json());

  console.log('--- 4. Student audit logs:');
  const sa = await fetch('http://localhost:4000/api/v1/audit/logs', {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  console.log(sa.status, await sa.json());

  console.log('--- 5. Super Admin audit logs:');
  const aa = await fetch('http://localhost:4000/api/v1/audit/logs', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log(aa.status, await aa.json());

  console.log('--- 6. Subjects:');
  const sub = await fetch('http://localhost:4000/api/v1/academics/subjects', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log(sub.status, await sub.json());

  console.log('--- 7. Biometric face match:');
  const bio = await fetch('http://localhost:4000/api/v1/academics/attendance/face-match', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId: 'DEV-01', faceDescriptor: [0.1, 0.2] })
  });
  console.log(bio.status, await bio.json());

  console.log('--- 8. Library:');
  const lib = await fetch('http://localhost:4000/api/v1/campus/library', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log(lib.status, await lib.json());

  console.log('--- 9. Inventory:');
  const inv = await fetch('http://localhost:4000/api/v1/campus/inventory', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log(inv.status, await inv.json());

  console.log('--- 10. Ledger:');
  const led = await fetch('http://localhost:4000/api/v1/finance/ledger', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log(led.status, await led.json());
}

debug().catch(console.error);
