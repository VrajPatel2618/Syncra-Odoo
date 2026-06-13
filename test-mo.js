async function test() {
  try {
    const login = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@universal.com', password: 'admin123' })
    }).then(r => r.json());
    console.log("Login:", JSON.stringify(login).substring(0, 100));
    if (!login.success) return console.error("Login failed");
    const token = login.data.token;

    console.log("Token:", token.substring(0, 10));

    const boms = await fetch('http://localhost:5000/api/manufacturing/boms', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json());
    console.log("BOMs:", JSON.stringify(boms).substring(0, 100));
    
    if (!boms.data || boms.data.length === 0) {
       console.error("No BOMs found"); return;
    }
    const bomId = boms.data[0].id;

    const wcs = await fetch('http://localhost:5000/api/manufacturing/work-centers', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json());
    console.log("WorkCenters:", JSON.stringify(wcs).substring(0, 100));
    const workCenterId = wcs.data[0].id;

    const res = await fetch('http://localhost:5000/api/manufacturing/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bomId, workCenterId, quantity: 5 })
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error(err);
  }
}
test();
