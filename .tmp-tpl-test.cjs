// test template string reference to outer const
try {
  const html = `outer ${`inner`}`;
  console.log('ok1:', html);
} catch (e) { console.log('err1:', e.message); }

try {
  const html = `outer ${(() => html)()}`;
  console.log('ok2:', html);
} catch (e) { console.log('err2:', e.message); }

// Simulate the cjs pattern: const html = `outer ${STATUS_META.map(...html\`...\`)}`
try {
  const STATUS_META = [{id: 'a'}, {id: 'b'}];
  const html = `<div>${STATUS_META.map(st => html`<span>${st.id}</span>`)}</div>`;
  console.log('ok3:', html);
} catch (e) { console.log('err3:', e.message); }

try {
  const STATUS_META2 = [{id: 'a'}, {id: 'b'}];
  const x = `<div>${STATUS_META2.map(st => x`<span>${st.id}</span>`)}</div>`;
  console.log('ok4:', x);
} catch (e) { console.log('err4:', e.message); }
