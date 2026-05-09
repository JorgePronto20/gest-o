// ============================================================
//  CONFIGURAÇÃO
// ============================================================

const API_BASE = "https://smsworkers.jorgepronto20.workers.dev/api";
const API_KEY = "Benfica_2026_1904_slb";

function apiHeaders(json = true) {
  return {
    "Authorization": `Bearer ${API_KEY}`,
    ...(json ? { "Content-Type": "application/json" } : {})
  };
}

// ============================================================
//  LOGIN
// ============================================================

async function login(pin) {
  const resposta = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ pin })
  });

  return await resposta.json();
}

// ============================================================
//  COLABORADORES
// ============================================================

async function carregarColaboradores() {
  const resposta = await fetch(`${API_BASE}/colaboradores`, {
    headers: apiHeaders(false)
  });

  return await resposta.json();
}

// ============================================================
//  MODELOS DE CHECKLIST
// ============================================================

async function carregarModelos() {
  const resposta = await fetch(`${API_BASE}/modelos`, {
    headers: apiHeaders(false)
  });

  return await resposta.json();
}

// ============================================================
//  CHECKLIST — SUBMISSÃO (FORMATO NOVO)
// ============================================================

async function submeter(tipo) {
  const itensMarcados = [...document.querySelectorAll(".item")];

  const itens = itensMarcados.map((i, idx) => ({
    descricao: `Item ${idx + 1}`,
    feito: i.checked ? 1 : 0
  }));

  const colaborador_id = localStorage.getItem("colaborador_id");

  if (!colaborador_id) {
    document.getElementById("msg").textContent = "Sessão expirada.";
    location.href = "login.html";
    return;
  }

  const agora = new Date();
  const data_execucao = agora.toISOString().split("T")[0];

  const resposta = await fetch(`${API_BASE}/checklists`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({
      titulo: `Checklist ${tipo} - ${data_execucao}`,
      modelo_id: null,
      colaborador_id,
      data_execucao,
      estado: "pendente",
      notas: "",
      itens
    })
  });

  const dados = await resposta.json();

  if (dados.id) {
    document.getElementById("msg").textContent = "Checklist enviada!";
  } else {
    document.getElementById("msg").textContent = "Erro ao enviar.";
  }
}

// ============================================================
//  ALERTAS
// ============================================================

async function criarAlerta(texto) {
  const resposta = await fetch(`${API_BASE}/alertas`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ texto })
  });

  return await resposta.json();
}

async function listarAlertas() {
  const resposta = await fetch(`${API_BASE}/alertas`, {
    headers: apiHeaders(false)
  });

  return await resposta.json();
}

// ============================================================
//  DASHBOARD
// ============================================================

async function carregarDashboard() {
  const resposta = await fetch(`${API_BASE}/dashboard`, {
    headers: apiHeaders(false)
  });

  return await resposta.json();
}
