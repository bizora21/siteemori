// Tempos sempre certos: depois de mudar o texto ou as cenas, o estúdio gera a voz sozinho (só a voz e os tempos, sem render)
// e atualiza a linha do tempo. As cenas que não mudaram já estão em cache, por isso é rápido.

const AUTO = { timer: 0, busy: false, done: {}, failed: '', asked: {} };

const autoSig = (p) => JSON.stringify([p.scenes.map((s) => [s.id, s.narration, s.voiceName, s.kind, s.presenter, s.clipRev]), p.voice]);

/** Chamado depois de cada alteração: marca a hora de atualizar quando se parar de mexer. */
function autoPlan(delay = 2500) {
  clearTimeout(AUTO.timer);
  if (!$('#ed-prev')) return;
  AUTO.timer = setTimeout(autoRun, delay);
}

const autoTyping = () => ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

async function autoRun() {
  if (!$('#ed-prev') || AUTO.busy || !state.data) return;
  const p = state.data.project;
  const sig = autoSig(p);
  if (AUTO.done[state.id] === sig || AUTO.failed === sig) return;
  if (p.scenes.some((s) => /Escreva aqui/i.test(s.narration ?? ''))) return; // ainda há texto de exemplo: não gerar a voz
  if (state.data.issues?.some((i) => i.level === 'error' && !i.finalOnly)) return;
  const jb = state.data.lastJob?.status;
  if (jb === 'queued' || jb === 'running') return autoPlan(4000);
  AUTO.busy = true;
  const id = state.id;
  const chip = (t) => { const el = $('#job-state'); if (el) el.textContent = t; };
  try {
    // guarda sem redesenhar (para não interromper quem está a escrever)
    const body = JSON.stringify(p);
    if (state.dirty) {
      await api(`/api/projects/${id}`, { method: 'PUT', body });
      if (JSON.stringify(state.data.project) === body) { state.dirty = false; const b = $('#save-btn'); if (b) b.textContent = '💾 Guardar'; }
    }
    chip('⏱ a atualizar os tempos…');
    const r = await api(`/api/projects/${id}/build`, { method: 'POST', body: JSON.stringify({ noRender: true, version: state.version || undefined }) });
    const status = await new Promise((ok) => {
      const es = new EventSource(`/api/jobs/${r.job}/events`);
      es.addEventListener('status', (e) => { const st = JSON.parse(e.data); if (st === 'done' || st === 'failed') { es.close(); ok(st); } });
      es.onerror = () => { es.close(); ok('failed'); };
    });
    if (status === 'done') {
      AUTO.done[id] = sig;
      const fresh = await api(`/api/projects/${id}`);
      if (state.id === id) {
        // só trago os tempos e o estado; as alterações ainda não guardadas ficam como estão
        const keep = state.dirty ? state.data.project : fresh.project;
        state.data = { ...fresh, project: keep };
        await loadState();
        if (!autoTyping()) renderEditor();
        const el = $('#job-state');
        if (el) el.textContent = '✓ tempos atualizados';
      }
    } else {
      AUTO.failed = sig;
      chip('');
      toast('Não consegui calcular os tempos sozinho (a voz precisa de internet). Carregue em "Calcular tempos" para ver o motivo.', 7000);
    }
  } catch {
    chip('');
  } finally {
    AUTO.busy = false;
    // se entretanto mudou mais alguma coisa, volta a tratar
    if ($('#ed-prev') && state.data && autoSig(state.data.project) !== AUTO.done[state.id] && AUTO.failed !== autoSig(state.data.project)) autoPlan(3000);
  }
}

/** Ao abrir um projeto com tempos ainda aproximados, calcula-os uma vez. */
function autoOnOpen() {
  const t = state.data?.timing;
  if (!t || t.exact || AUTO.asked[state.id]) return;
  AUTO.asked[state.id] = true;
  autoPlan(1500);
}
