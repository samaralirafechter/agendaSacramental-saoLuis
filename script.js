
// ======================================================================
// COLE SEU firebaseConfig AQUI — substitua o objeto abaixo pelo que o
// Firebase te deu no passo "Registrar um app Web".
// ======================================================================
const firebaseConfig = {
  apiKey: "AIzaSyAXkIauvsc7tcXOOemS2Tow5yP3hLWz3Ak",
  authDomain: "ramo5-ctm.firebaseapp.com",
  projectId: "ramo5-ctm",
  storageBucket: "ramo5-ctm.firebasestorage.app",
  messagingSenderId: "890316894866",
  appId: "1:890316894866:web:514fc4f745b94ff3326c4b",
  measurementId: "G-FZ7B22LS0D"
};
// ======================================================================

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const COLLECTION = "reunioes_ramo5";

const statusEl = document.getElementById('conn-status');
db.collection(COLLECTION).limit(1).get()
  .then(() => { statusEl.textContent = 'Conectado — dados salvos em tempo real'; statusEl.className = 'rs-status online'; })
  .catch((err) => { statusEl.textContent = 'Erro de conexão: ' + err.message; statusEl.className = 'rs-status offline'; });

(function() {
  const discursoLabels1a4 = ["Primeiro Orador(a) (Elder/Sister)", "Segundo Orador(a) (Elder/Sister)", "Terceiro Orador(a) (Elder/Sister)", "Quarto Orador(a) (Elder/Sister)"];
  const wrap1a4 = document.getElementById('f-discursos-1a4');
  discursoLabels1a4.forEach((label, i) => {
    const row = document.createElement('div');
    row.className = 'rs-discurso-row';
    row.innerHTML = '<div class="rs-discurso-num">' + (i+1) + '</div>' +
      '<input type="text" class="f-discurso" data-idx="' + i + '" placeholder="' + label + '" />';
    wrap1a4.appendChild(row);
  });
  const wrap5 = document.getElementById('f-discurso-5');
  wrap5.innerHTML = '<div class="rs-discurso-row"><div class="rs-discurso-num">5</div>' +
    '<input type="text" class="f-discurso" data-idx="4" placeholder="Quinto Orador(a)" /></div>';

  const tabs = document.querySelectorAll('.rs-tab');
  const viewForm = document.getElementById('rs-view-form');
  const viewHistory = document.getElementById('rs-view-history');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    if (t.dataset.tab === 'form') {
      viewForm.style.display = ''; viewHistory.style.display = 'none';
    } else {
      viewForm.style.display = 'none'; viewHistory.style.display = ''; loadHistory();
    }
  }));

  function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  document.getElementById('f-date').value = todayISO();

  function collectForm() {
    return {
      date: document.getElementById('f-date').value,
      preludio: document.getElementById('f-preludio').value.trim(),
      dirigidoPor: document.getElementById('f-dirigido').value.trim(),
      presididoPor: document.getElementById('f-presidido').value.trim(),
      regente: document.getElementById('f-regente').value.trim(),
      reconhecimentos: document.getElementById('f-reconhecimentos').value.trim(),
      anuncios: document.getElementById('f-anuncios').value.trim(),
      hinoAbertura: document.getElementById('f-hino-abertura').value.trim(),
      oracaoAbertura: document.getElementById('f-oracao-abertura').value.trim(),
      hinoSacramental: document.getElementById('f-hino-sacramental').value.trim(),
      discursos: Array.from(document.querySelectorAll('.f-discurso')).map(el => el.value.trim()),
      numeroMusical: document.getElementById('f-numero-musical').value.trim(),
      hinoEncerramento: document.getElementById('f-hino-encerramento').value.trim(),
      oracaoEncerramento: document.getElementById('f-oracao-encerramento').value.trim(),
    };
  }

  function fillForm(entry) {
    document.getElementById('f-date').value = entry.date || todayISO();
    document.getElementById('f-preludio').value = entry.preludio || '';
    document.getElementById('f-dirigido').value = entry.dirigidoPor || '';
    document.getElementById('f-presidido').value = entry.presididoPor || '';
    document.getElementById('f-regente').value = entry.regente || '';
    document.getElementById('f-reconhecimentos').value = entry.reconhecimentos || '';
    document.getElementById('f-anuncios').value = entry.anuncios || '';
    document.getElementById('f-hino-abertura').value = entry.hinoAbertura || '';
    document.getElementById('f-oracao-abertura').value = entry.oracaoAbertura || '';
    document.getElementById('f-hino-sacramental').value = entry.hinoSacramental || '';
    const discursoEls = document.querySelectorAll('.f-discurso');
    discursoEls.forEach((el, i) => { el.value = (entry.discursos && entry.discursos[i]) || ''; });
    document.getElementById('f-numero-musical').value = entry.numeroMusical || '';
    document.getElementById('f-hino-encerramento').value = entry.hinoEncerramento || '';
    document.getElementById('f-oracao-encerramento').value = entry.oracaoEncerramento || '';
  }

  function clearForm() { fillForm({ date: todayISO() }); }
  document.getElementById('btn-clear').addEventListener('click', clearForm);

  function showMsg(text, ok) {
    const el = document.getElementById('f-msg');
    el.textContent = text;
    el.className = 'rs-msg ' + (ok ? 'ok' : 'err');
    setTimeout(() => { el.className = 'rs-msg'; }, 3500);
  }

  function formatDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return d + '/' + m + '/' + y;
  }

  document.getElementById('btn-save').addEventListener('click', async () => {
    const entry = collectForm();
    if (!entry.date) { showMsg('Informe a data da reunião antes de salvar.', false); return; }
    const btn = document.getElementById('btn-save');
    btn.disabled = true;
    try {
      await db.collection(COLLECTION).doc(entry.date).set(entry);
      showMsg('Reunião de ' + formatDate(entry.date) + ' salva no histórico.', true);
    } catch (err) {
      showMsg('Erro ao salvar: ' + err.message, false);
    } finally {
      btn.disabled = false;
    }
  });

  async function loadHistory() {
    const listEl = document.getElementById('hist-list');
    listEl.innerHTML = '<div class="rs-loading">Carregando histórico…</div>';
    try {
      const snapshot = await db.collection(COLLECTION).orderBy('date', 'desc').get();
      if (snapshot.empty) {
        listEl.innerHTML = '<div class="rs-hist-empty">Nenhuma reunião salva ainda.<br/>Preencha o formulário e clique em "Salvar reunião".</div>';
        return;
      }
      const entries = [];
      snapshot.forEach(doc => entries.push(doc.data()));
      renderHistory(entries);
    } catch (err) {
      listEl.innerHTML = '<div class="rs-hist-empty">Erro ao carregar histórico: ' + err.message + '</div>';
    }
  }

  function fieldRow(label, value) {
    if (!value) return '';
    return '<div class="rs-hist-row"><div class="rs-hist-label">' + label + '</div><div class="rs-hist-val">' + escapeHtml(value) + '</div></div>';
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function renderHistory(entries) {
    const listEl = document.getElementById('hist-list');
    listEl.innerHTML = '';
    entries.forEach(entry => {
      const card = document.createElement('div');
      card.className = 'rs-hist-card';
      const discursosCount = (entry.discursos || []).filter(Boolean).length;
      card.innerHTML =
        '<div class="rs-hist-head">' +
          '<div><div class="rs-hist-date">' + formatDate(entry.date) + '</div>' +
          '<div class="rs-hist-sub">' + (entry.dirigidoPor ? 'Dirigido por: ' + escapeHtml(entry.dirigidoPor) + ' · ' : '') + discursosCount + ' orador(es)</div></div>' +
          '<div class="rs-hist-chevron">&#9662;</div>' +
        '</div>' +
        '<div class="rs-hist-body">' +
          fieldRow('Prelúdio musical', entry.preludio) +
          fieldRow('Dirigido por', entry.dirigidoPor) +
          fieldRow('Presidido por', entry.presididoPor) +
          fieldRow('Regente', entry.regente) +
          fieldRow('Reconhecimentos', entry.reconhecimentos) +
          fieldRow('Anúncios', entry.anuncios) +
          fieldRow('Hino de abertura', entry.hinoAbertura) +
          fieldRow('Oração de abertura', entry.oracaoAbertura) +
          fieldRow('Hino sacramental', entry.hinoSacramental) +
          fieldRow('Primeiro orador(a)', entry.discursos && entry.discursos[0]) +
          fieldRow('Segundo orador(a)', entry.discursos && entry.discursos[1]) +
          fieldRow('Terceiro orador(a)', entry.discursos && entry.discursos[2]) +
          fieldRow('Quarto orador(a)', entry.discursos && entry.discursos[3]) +
          fieldRow('Número musical especial', entry.numeroMusical) +
          fieldRow('Quinto orador(a)', entry.discursos && entry.discursos[4]) +
          fieldRow('Hino de encerramento', entry.hinoEncerramento) +
          fieldRow('Oração de encerramento', entry.oracaoEncerramento) +
          '<div class="rs-hist-actions">' +
            '<button class="btn-edit">Editar</button>' +
            '<button class="btn-delete danger">Excluir</button>' +
          '</div>' +
        '</div>';

      const head = card.querySelector('.rs-hist-head');
      const body = card.querySelector('.rs-hist-body');
      const chevron = card.querySelector('.rs-hist-chevron');
      head.addEventListener('click', () => {
        const open = body.classList.toggle('open');
        chevron.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
      });

      card.querySelector('.btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        fillForm(entry);
        document.querySelector('.rs-tab[data-tab="form"]').click();
        showMsg('Reunião de ' + formatDate(entry.date) + ' carregada para edição.', true);
      });

      card.querySelector('.btn-delete').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Excluir a reunião de ' + formatDate(entry.date) + ' do histórico?')) return;
        try {
          await db.collection(COLLECTION).doc(entry.date).delete();
          loadHistory();
        } catch (err) {
          alert('Erro ao excluir: ' + err.message);
        }
      });

      listEl.appendChild(card);
    });
  }
})();