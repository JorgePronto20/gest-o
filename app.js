// ════════════════════════════════════════════════════════════
// UTILITÁRIOS GERAIS
// ════════════════════════════════════════════════════════════

function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-PT');
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function toast(msg, type = 'info') {
  console.log(`[${type}]`, msg);
  // Aqui podes ligar ao teu sistema real de toasts
}

// ════════════════════════════════════════════════════════════
// API WRAPPER
// ════════════════════════════════════════════════════════════

const apiBaseUrl = 'https://smsworkers.jorgepronto20.workers.dev';

const api = {
  async get(path) {
    const res = await fetch(apiBaseUrl + path, { credentials: 'include' });
    if (!res.ok) throw new Error('Erro ao carregar dados');
    return res.json();
  },
  async post(path, body) {
    const res = await fetch(apiBaseUrl + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Erro ao gravar dados');
    return res.json();
  },
  async put(path, body) {
    const res = await fetch(apiBaseUrl + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Erro ao atualizar dados');
    return res.json();
  },
  async delete(path) {
    const res = await fetch(apiBaseUrl + path, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Erro ao eliminar');
    return res.json().catch(() => ({}));
  }
}

// ════════════════════════════════════════════════════════════
// TAGS / LABELS
// ════════════════════════════════════════════════════════════

function estadoTag(estado) {
  switch (estado) {
    case 'concluido':
    case 'concluído':
      return '<span class="tag tag--green">Concluído</span>';
    case 'pendente':
      return '<span class="tag tag--orange">Pendente</span>';
    case 'cancelado':
      return '<span class="tag tag--gray">Cancelado</span>';
    default:
      return `<span class="tag tag--gray">${escHtml(estado || '—')}</span>`;
  }
}

function prioridadeTag(p) {
  switch (String(p)) {
    case '1':
      return '<span class="tag tag--green">Baixa</span>';
    case '2':
      return '<span class="tag tag--orange">Média</span>';
    case '3':
      return '<span class="tag tag--red">Alta</span>';
    default:
      return '<span class="tag tag--gray">—</span>';
  }
}

// ════════════════════════════════════════════════════════════
// ESTADO EM MEMÓRIA
// ════════════════════════════════════════════════════════════

let modelosCache = [];
let colaboradoresCache = [];

// ════════════════════════════════════════════════════════════
// NAVEGAÇÃO SPA
// ════════════════════════════════════════════════════════════

function navigateTo(sectionId) {
  const sections = document.querySelectorAll('[data-section]');
  sections.forEach(sec => {
    sec.style.display = sec.id === sectionId ? 'block' : 'none';
  });

  const menuItems = document.querySelectorAll('[data-nav]');
  menuItems.forEach(item => {
    item.classList.toggle('is-active', item.getAttribute('data-nav') === sectionId);
  });

  const breadcrumb = document.getElementById('breadcrumb-current');
  if (breadcrumb) {
    const active = document.querySelector(`[data-nav="${sectionId}"]`);
    breadcrumb.textContent = active ? active.textContent.trim() : '';
  }

  switch (sectionId) {
    case 'sec-dashboard':
      loadDashboard();
      break;
    case 'sec-colaboradores':
      loadColaboradores();
      break;
    case 'sec-modelos':
      loadModelos();
      break;
    case 'sec-checklists':
      loadChecklists();
      break;
    case 'sec-alertas':
      loadAlertas();
      break;
    case 'sec-relatorios':
      setupRelatorios();
      break;
    case 'sec-configuracoes':
      loadConfiguracoes();
      break;
  }
}

// ════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════

async function loadDashboard() {
  const elHoje        = document.getElementById('kpi-hoje');
  const elConcluidos  = document.getElementById('kpi-concluidos');
  const elPendentes   = document.getElementById('kpi-pendentes');
  const elAlertas     = document.getElementById('kpi-alertas');
  const elColabs      = document.getElementById('kpi-colaboradores');
  const elAtividade   = document.getElementById('atividade-lista');

  if (!elHoje || !elConcluidos || !elPendentes || !elAlertas || !elColabs || !elAtividade) {
    console.warn('Elementos do dashboard não encontrados.');
    return;
  }

  elHoje.textContent       = '…';
  elConcluidos.textContent = '…';
  elPendentes.textContent  = '…';
  elAlertas.textContent    = '…';
  elColabs.textContent     = '…';
  elAtividade.innerHTML    = '<p class="empty-state">A carregar…</p>';

  try {
    const data = await api.get('/api/dashboard');

    elHoje.textContent       = data.hoje ?? 0;
    elConcluidos.textContent = data.concluidos ?? 0;
    elPendentes.textContent  = data.pendentes ?? 0;
    elAlertas.textContent    = data.alertas ?? 0;
    elColabs.textContent     = data.colaboradores ?? 0;

    if (!data.atividade?.length) {
      elAtividade.innerHTML = '<p class="empty-state">Sem atividade recente.</p>';
      return;
    }

    elAtividade.innerHTML = data.atividade.map(a => `
  <div class="atividade-item">
    <div class="atividade-tipo">${escHtml(a.tipo)}</div>
    <div class="atividade-msg">${escHtml(a.descricao)}</div>
    <div class="atividade-data">${formatDateTime(a.criado_em)}</div>
  </div>
`).join('');

  } catch (err) {
    elAtividade.innerHTML = '<p class="empty-state">Erro ao carregar dashboard.</p>';
    toast(err.message, 'error');
  }
}

// ════════════════════════════════════════════════════════════
// COLABORADORES
// ════════════════════════════════════════════════════════════

async function loadColaboradores() {
  const el = document.getElementById('colaboradores-lista');
  el.innerHTML = '<p class="empty-state">A carregar…</p>';

  try {
    const cols = await api.get('/api/colaboradores');

    if (!cols.length) {
      el.innerHTML = '<p class="empty-state">Nenhum colaborador registado.</p>';
      return;
    }

    el.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Ativo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${cols.map(c => `
              <tr>
                <td>${escHtml(c.nome)}</td>
                <td>${escHtml(c.pin || '—')}</td>
                <td>${c.ativo ? '✅' : '❌'}</td>
                <td>
                  <div class="actions">
                    <button class="btn btn--secondary btn--sm" onclick="App.editColaborador(${c.id})">Editar</button>
                    <button class="btn btn--danger btn--sm" onclick="App.deleteColaborador(${c.id})">Eliminar</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    colaboradoresCache = cols;

  } catch (err) {
    el.innerHTML = '<p class="empty-state">Erro ao carregar colaboradores.</p>';
    toast(err.message, 'error');
  }
}

async function editColaborador(id) {
  try {
    const c = await api.get(`/api/colaboradores/${id}`);

    document.getElementById('col-id').value    = c.id;
    document.getElementById('col-nome').value  = c.nome || '';
    document.getElementById('col-pin').value = c.pin || '';
    document.getElementById('col-ativo').checked = !!c.ativo;

    openModal('modal-colaborador');

  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteColaborador(id) {
  if (!confirm('Eliminar este colaborador?')) return;

  try {
    await api.delete(`/api/colaboradores/${id}`);
    toast('Colaborador eliminado.', 'success');
    loadColaboradores();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ════════════════════════════════════════════════════════════
// MODELOS
// ════════════════════════════════════════════════════════════

async function loadModelos() {
  const el = document.getElementById('modelos-lista');
  el.innerHTML = '<p class="empty-state">A carregar…</p>';

  try {
    const modelos = await api.get('/api/modelos');

    if (!modelos.length) {
      el.innerHTML = '<p class="empty-state">Nenhum modelo registado.</p>';
      return;
    }

    el.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Itens</th>
              <th>Ativo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${modelos.map(m => `
              <tr>
                <td>${escHtml(m.nome)}</td>
                <td>${m.total_itens ?? 0}</td>
                <td>${m.ativo ? '✅' : '❌'}</td>
                <td>
                  <div class="actions">
                    <button class="btn btn--secondary btn--sm" onclick="App.editModelo(${m.id})">Editar</button>
                    <button class="btn btn--danger btn--sm" onclick="App.deleteModelo(${m.id})">Eliminar</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    modelosCache = modelos;

  } catch (err) {
    el.innerHTML = '<p class="empty-state">Erro ao carregar modelos.</p>';
    toast(err.message, 'error');
  }
}

async function editModelo(id) {
  try {
    const m = await api.get(`/api/modelos/${id}`);

    document.getElementById('mod-id').value   = m.id;
    document.getElementById('mod-nome').value = m.nome || '';
    document.getElementById('mod-ativo').checked = !!m.ativo;

    openModal('modal-modelo');

  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteModelo(id) {
  if (!confirm('Eliminar este modelo?')) return;

  try {
    await api.delete(`/api/modelos/${id}`);
    toast('Modelo eliminado.', 'success');
    loadModelos();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ════════════════════════════════════════════════════════════
// CHECKLISTS
// ════════════════════════════════════════════════════════════

async function loadChecklists() {
  const el = document.getElementById('checklists-lista');
  el.innerHTML = '<p class="empty-state">A carregar…</p>';

  try {
    const cks = await api.get('/api/checklists');

    if (!cks.length) {
      el.innerHTML = '<p class="empty-state">Nenhum checklist registado.</p>';
      return;
    }

    el.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Data</th>
              <th>Colaborador</th>
              <th>Modelo</th>
              <th>Estado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${cks.map(c => `
              <tr>
                <td>${escHtml(c.titulo)}</td>
                <td>${formatDate(c.data_execucao)}</td>
                <td>${escHtml(c.colaborador_nome || '—')}</td>
                <td>${escHtml(c.modelo_nome || '—')}</td>
                <td>${estadoTag(c.estado)}</td>
                <td>
                  <div class="actions">
                    <button class="btn btn--secondary btn--sm" onclick="App.viewChecklist(${c.id})">Ver</button>
                    <button class="btn btn--secondary btn--sm" onclick="App.editChecklist(${c.id})">Editar</button>
                    <button class="btn btn--danger btn--sm" onclick="App.deleteChecklist(${c.id})">Eliminar</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

  } catch (err) {
    el.innerHTML = '<p class="empty-state">Erro ao carregar checklists.</p>';
    toast(err.message, 'error');
  }
}

async function preencherSelectsChecklist() {
  if (!modelosCache.length)
    modelosCache = await api.get('/api/modelos').catch(() => []);

  if (!colaboradoresCache.length)
    colaboradoresCache = await api.get('/api/colaboradores').catch(() => []);

  const selMod   = document.getElementById('ck-modelo_id');
  const selColab = document.getElementById('ck-colaborador_id');

  selMod.innerHTML   = '<option value="">— Sem modelo —</option>';
  selColab.innerHTML = '<option value="">— Não atribuído —</option>';

  modelosCache.filter(m => m.ativo).forEach(m =>
    selMod.appendChild(new Option(m.nome, m.id))
  );

  colaboradoresCache.filter(c => c.ativo).forEach(c =>
    selColab.appendChild(new Option(c.nome, c.id))
  );
}

async function submitChecklist(e) {
  e.preventDefault();

  const id = document.getElementById('ck-id').value;

  const body = {
    titulo:         document.getElementById('ck-titulo').value.trim(),
    modelo_id:      document.getElementById('ck-modelo_id').value || null,
    colaborador_id: document.getElementById('ck-colaborador_id').value || null,
    data_execucao:  document.getElementById('ck-data_execucao').value,
    estado:         document.getElementById('ck-estado').value,
    notas:          document.getElementById('ck-notas').value.trim(),
  };

  try {
    if (id) {
      await api.put(`/api/checklists/${id}`, body);
      toast('Checklist atualizado!', 'success');
    } else {
      await api.post('/api/checklists', body);
      toast('Checklist criado!', 'success');
    }

    closeModal('modal-checklist');
    loadChecklists();

  } catch (err) {
    toast(err.message, 'error');
  }
}

async function editChecklist(id) {
  const c = await api.get(`/api/checklists/${id}`);

  document.getElementById('modal-checklist-title').textContent = 'Editar Checklist';

  await preencherSelectsChecklist();

  document.getElementById('ck-id').value             = c.id;
  document.getElementById('ck-titulo').value         = c.titulo;
  document.getElementById('ck-modelo_id').value      = c.modelo_id || '';
  document.getElementById('ck-colaborador_id').value = c.colaborador_id || '';
  document.getElementById('ck-data_execucao').value  = c.data_execucao;
  document.getElementById('ck-estado').value         = c.estado;
  document.getElementById('ck-notas').value          = c.notas || '';

  openModal('modal-checklist');
}

async function viewChecklist(id) {
  try {
    const c = await api.get(`/api/checklists/${id}`);

    document.getElementById('ck-detail-title').textContent = c.titulo;

    const total  = c.itens?.length || 0;
    const feitos = c.itens?.filter(i => i.feito).length || 0;
    const pct    = total > 0 ? Math.round((feitos / total) * 100) : 0;

    const body = document.getElementById('ck-detail-body');

    body.innerHTML = `
      <div style="padding:16px 20px;border-bottom:1px solid var(--color-border)">
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px">
          ${estadoTag(c.estado)}
          <span class="tag tag--gray">📅 ${formatDate(c.data_execucao)}</span>
          ${c.colaborador_nome ? `<span class="tag tag--blue">👤 ${escHtml(c.colaborador_nome)}</span>` : ''}
        </div>

        ${total > 0 ? `
          <div style="display:flex;justify-content:space-between;font-size:.8rem;color:var(--color-text-muted);margin-bottom:4px">
            <span>${feitos} / ${total} itens concluídos</span>
            <span>${pct}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar__fill" style="width:${pct}%"></div>
          </div>
        ` : ''}
      </div>

      <div style="padding:16px 20px">
        ${
          !total
            ? '<p class="empty-state">Este checklist não tem itens.</p>'
            : c.itens.map(it => `
              <div class="checklist-item-row ${it.feito ? 'done' : ''}" id="ck-item-${it.id}">
                <input type="checkbox" id="cb-${it.id}" ${it.feito ? 'checked' : ''}
                  onchange="App.toggleItem(${id}, ${it.id}, this.checked)" />
                <label for="cb-${it.id}">${escHtml(it.descricao)}</label>
                ${
                  it.feito && it.concluido_em
                    ? `<span style="font-size:.75rem;color:var(--color-text-muted)">${formatDateTime(it.concluido_em)}</span>`
                    : ''
                }
              </div>
            `).join('')
        }

        ${
          c.notas
            ? `<div style="margin-top:14px;padding:10px;background:#f9fafb;border-radius:8px;font-size:.87rem">
                <strong>Notas:</strong> ${escHtml(c.notas)}
              </div>`
            : ''
        }
      </div>
    `;

    openModal('modal-checklist-detalhes');

  } catch (err) {
    toast(err.message, 'error');
  }
}

async function toggleItem(ckId, itemId, concluido) {
  try {
    const res = await api.put(`/api/checklists/${ckId}/itens/${itemId}`, { feito: concluido ? 1 : 0 });

    const row = document.getElementById(`ck-item-${itemId}`);
    if (row) row.classList.toggle('done', concluido);

    if (res.estado) {
      const estadoEl = document.querySelector(`#modal-checklist-detalhes .tag`);
      if (estadoEl) estadoEl.outerHTML = estadoTag(res.estado);
    }

  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteChecklist(id) {
  if (!confirm('Eliminar este checklist?')) return;

  try {
    await api.delete(`/api/checklists/${id}`);
    toast('Checklist eliminado.', 'success');
    loadChecklists();

  } catch (err) {
    toast(err.message, 'error');
  }
}

// ════════════════════════════════════════════════════════════
// ALERTAS
// ════════════════════════════════════════════════════════════

async function loadAlertas() {
  const el = document.getElementById('alertas-lista');
  el.innerHTML = '<p class="empty-state">A carregar…</p>';

  try {
    const alertas = await api.get('/api/alertas');

    if (!alertas.length) {
      el.innerHTML = '<p class="empty-state">Nenhum alerta registado.</p>';
      updateBadgeAlertas(0);
      return;
    }

    const naoLidos = alertas.filter(a => !a.lido).length;
    updateBadgeAlertas(naoLidos);

    el.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Título</th><th>Prioridade</th><th>Checklist</th><th>Data</th><th>Estado</th><th>Ações</th></tr>
          </thead>
          <tbody>
            ${alertas.map(a => `
              <tr style="${!a.lido ? 'font-weight:600' : ''}">
                <td>${escHtml(a.titulo)}</td>
                <td>${prioridadeTag(a.prioridade)}</td>
                <td>${escHtml(a.checklist_id ?? '—')}</td>
                <td>${formatDateTime(a.criado_em)}</td>
                <td>${a.lido ? '<span class="tag tag--gray">✓ Lido</span>' : '<span class="tag tag--orange">Novo</span>'}</td>
                <td>
                  <div class="actions">
                    ${!a.lido ? `<button class="btn btn--secondary btn--sm" onclick="App.marcarAlertaLido(${a.id})">✓</button>` : ''}
                    <button class="btn btn--danger btn--sm" onclick="App.deleteAlerta(${a.id})">🗑</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    el.innerHTML = '<p class="empty-state">Erro ao carregar alertas.</p>';
    toast(err.message, 'error');
  }
}

async function submitAlerta(e) {
  e.preventDefault();

  const body = {
    titulo:       document.getElementById('al-titulo').value.trim(),
    mensagem:     document.getElementById('al-mensagem').value.trim(),
    prioridade:   document.getElementById('al-prioridade').value,
    checklist_id: document.getElementById('al-checklist_id').value || null,
  };

  try {
    await api.post('/api/alertas', body);

    toast('Alerta criado!', 'success');
    closeModal('modal-alerta');
    loadAlertas();

  } catch (err) {
    toast(err.message, 'error');
  }
}

async function marcarAlertaLido(id) {
  try {
    await api.put(`/api/alertas/${id}`, { lido: 1 });

    toast('Alerta marcado como lido.', 'success');
    loadAlertas();

  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteAlerta(id) {
  if (!confirm('Eliminar este alerta?')) return;

  try {
    await api.delete(`/api/alertas/${id}`);

    toast('Alerta eliminado.', 'success');
    loadAlertas();

  } catch (err) {
    toast(err.message, 'error');
  }
}

async function refreshBadgeAlertas() {
  try {
    const alertas = await api.get('/api/alertas');
    const naoLidos = alertas.filter(a => !a.lido).length;
    updateBadgeAlertas(naoLidos);
  } catch (_) {}
}

function updateBadgeAlertas(n) {
  const badge = document.getElementById('badge-alertas');
  if (!badge) return;
  badge.textContent = n;
  badge.style.display = n > 0 ? 'inline-flex' : 'none';
}

async function openModal_alerta_novo() {
  document.getElementById('form-alerta').reset();
  document.getElementById('al-id').value = '';

  const sel = document.getElementById('al-checklist_id');
  sel.innerHTML = '<option value="">— Nenhum —</option>';

  try {
    const cks = await api.get('/api/checklists');
    cks.forEach(c => sel.appendChild(new Option(c.titulo, c.id)));
  } catch (_) {}

  openModal('modal-alerta');
}

// ════════════════════════════════════════════════════════════
// CONFIGURAÇÕES
// ════════════════════════════════════════════════════════════

async function loadConfiguracoes() {
  try {
    const cfg = await api.get('/api/configuracoes');

    document.getElementById('cfg-nome_remetente').value  = cfg.nome_remetente  || '';
    document.getElementById('cfg-email_remetente').value = cfg.email_remetente || '';
    document.getElementById('cfg-email_api_key').value   = cfg.email_api_key   || '';

    document.getElementById('cfg-notificacoes').checked = Number(cfg.notificacoes) === 1;
    document.getElementById('cfg-som_alertas').checked  = Number(cfg.som_alertas)  === 1;

  } catch (err) {
    toast(err.message, 'error');
  }
}

async function saveConfiguracoes(e) {
  e.preventDefault();

  const body = {
    nome_remetente:  document.getElementById('cfg-nome_remetente').value.trim(),
    email_remetente: document.getElementById('cfg-email_remetente').value.trim(),
    email_api_key:   document.getElementById('cfg-email_api_key').value.trim(),
    notificacoes: document.getElementById('cfg-notificacoes').checked ? 1 : 0,
    som_alertas:  document.getElementById('cfg-som_alertas').checked  ? 1 : 0,
  };

  try {
    await api.put('/api/configuracoes', body);
    toast('Configurações guardadas!', 'success');

  } catch (err) {
    toast(err.message, 'error');
  }
}

// ════════════════════════════════════════════════════════════
// MODAIS
// ════════════════════════════════════════════════════════════

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('is-open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('is-open');
}
function setupRelatorios() {
  console.warn("setupRelatorios() ainda não implementado");
}

function gerarRelatorio() {
  console.warn("gerarRelatorio() ainda não implementado");
}

// ════════════════════════════════════════════════════════════
// OBJETO APP (VERSÃO A)
// ════════════════════════════════════════════════════════════

const App = {
  init,
  navigateTo,
  loadDashboard,
  loadColaboradores,
  loadModelos,
  loadChecklists,
  loadAlertas,
  setupRelatorios,
  gerarRelatorio,
  loadConfiguracoes,
  editColaborador,
  deleteColaborador,
  editModelo,
  deleteModelo,
  viewChecklist,
  editChecklist,
  deleteChecklist,
  toggleItem,
  marcarAlertaLido,
  deleteAlerta,
  openModal,
  closeModal,
  submitChecklist,
  submitAlerta,
  saveConfiguracoes,
  openModal_alerta_novo,
  refreshBadgeAlertas
};

// ════════════════════════════════════════════════════════════
// INIT / BOOTSTRAP
// ════════════════════════════════════════════════════════════

function init() {
  // Navegação por data-nav
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const target = el.getAttribute('data-nav');
      if (target) navigateTo(target);
    });
  });

  // Formulários
  const formChecklist = document.getElementById('form-checklist');
  if (formChecklist) {
    formChecklist.addEventListener('submit', submitChecklist);
  }

  const formAlerta = document.getElementById('form-alerta');
  if (formAlerta) {
    formAlerta.addEventListener('submit', submitAlerta);
  }

  const formCfg = document.getElementById('form-configuracoes');
  if (formCfg) {
    formCfg.addEventListener('submit', saveConfiguracoes);
  }

  // Botão novo alerta
  const btnNovoAlerta = document.getElementById('btn-alerta-novo');
  if (btnNovoAlerta) {
    btnNovoAlerta.addEventListener('click', openModal_alerta_novo);
  }

  // Secção inicial
  navigateTo('sec-dashboard');

  // Badge alertas inicial
  refreshBadgeAlertas();
}

// Bootstrap imediato
(function bootstrap() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }
})();
