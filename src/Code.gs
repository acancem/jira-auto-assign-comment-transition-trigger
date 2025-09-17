/************* Lee las propiedades del proyecto (Script properties) *************/
function getProp_(k, def){
  const v = PropertiesService.getScriptProperties().getProperty(k);
  return (v === null || v === undefined || v === '') ? def : v;
}

/************* Extrae la clave tipo ABC-123 desde subject/cuerpo/HTML y URLs /browse/ABC-123 *************/
function extractIssueKeys_(text){
  const keys = new Set(); if (!text) return [];
  let m;
  const reKey = /([A-Z][A-Z0-9]+[-–—]\d+)/gi;
  while ((m = reKey.exec(text)) !== null) keys.add(m[1].replace(/[–—]/g, '-').toUpperCase());
  const reUrl = /\/browse\/([A-Z][A-Z0-9]+-\d+)/gi;
  while ((m = reUrl.exec(text)) !== null) keys.add(m[1].toUpperCase());
  const reBracket = /\[([A-Z][A-Z0-9]+-\d+)\]/gi;
  while ((m = reBracket.exec(text)) !== null) keys.add(m[1].toUpperCase());
  return [...keys];
}

/************* Limpia el nombre y devuelve solo el primer string (nombre) *************/
function cleanDisplayName_(reporter){
  if (!reporter || !reporter.displayName) return '';
  return String(reporter.displayName).trim().split(/\s+/)[0]; // primer token antes del espacio
}

/************* HTTP genérica (Jira Cloud v3) *************/
// Encapsula fetch con Basic Auth
function call(url, method, auth, payload){
  const opts = { method, muteHttpExceptions: true, headers: { Authorization: auth, Accept: 'application/json' } };
  if (payload !== undefined){ opts.contentType = 'application/json'; opts.payload = JSON.stringify(payload); }
  const res = UrlFetchApp.fetch(url, opts);
  if (res.getResponseCode() >= 300) throw new Error(res.getResponseCode() + ' ' + res.getContentText());
  return res;
}

/************* Comentario publico *************/
function addPublicCommentJSM_(issueIdOrKey, text, BASE, auth){
  const url = `${BASE}/rest/servicedeskapi/request/${issueIdOrKey}/comment`;
  const payload = { body: text, public: true };
  const res = UrlFetchApp.fetch(url, {
    method: 'POST',
    headers: { Authorization: auth, Accept: 'application/json' },
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  if (code >= 300) throw new Error(code + ' ' + res.getContentText());
  return res;
}

/************* Prevenir comentarios duplicados *************/
function hasRecentSameComment_(key, text, BASE, auth){
  try{
    const r = call(`${BASE}/rest/api/3/issue/${String(key).trim().toUpperCase()}/comment?maxResults=10`, 'GET', auth);
    const comments = (JSON.parse(r.getContentText()).comments || []);
    return comments.some(c => JSON.stringify(c.body || {}).includes(text));
  }catch(_){ return false; }
}

/************* Prevenir comentarios duplicados - cache de 4 horas *************/
function wasProcessed_(key){ return !!CacheService.getUserCache().get('proc_'+key); }
function markProcessed_(key, ttlSec){ CacheService.getUserCache().put('proc_'+key, '1', ttlSec || 14400); }

/************* Busca transicion por nombre *************/
function findTransitionId_(list, targetsCsv){
  const targets = String(targetsCsv || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!targets.length) return null;
  const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  for (const t of list){
    const name = norm(t.name || '');
    if (targets.some(x => name.includes(norm(x)))) return t.id;
  }
  return null;
}

/************* ASIGNAR → TRANSICIONAR → COMENTAR  *************/
function processIssueCore_(key, BASE, auth, ASSIGNEE_ID){
  const TARGETS_PROP = getProp_('TARGET_TRANSITION_NAMES', 'working,soporte,support'); //puedes ver tu transicion viendo el estado del ticket desde https://tuorg.atlassian.net/issues/
  const TARGET_ID_PROP = String(getProp_('TARGET_TRANSITION_ID', '')).trim();

  // leer datos del issue
  const issueRes = call(`${BASE}/rest/api/3/issue/${key}?fields=assignee,status,reporter`, 'GET', auth);
  const issueObj = JSON.parse(issueRes.getContentText());           // lo reutilizamos para sacar issueId
  const fields   = issueObj.fields || {};
  const assignee = fields.assignee || null;
  const reporter = fields.reporter || null;
  const statusCat = ((((fields.status||{}).statusCategory)||{}).key||'').toLowerCase();
  if (statusCat === 'done') return false;

  // asignar si corresponde
  if (!assignee || assignee.accountId !== ASSIGNEE_ID){
    call(`${BASE}/rest/api/3/issue/${key}/assignee`, 'PUT', auth, { accountId: ASSIGNEE_ID });
  }

  // cambia estado por nombre o por id
  try{
    const tr = call(`${BASE}/rest/api/3/issue/${key}/transitions`, 'GET', auth);
    const transitions = (JSON.parse(tr.getContentText()).transitions || []);
    const targetId = TARGET_ID_PROP || findTransitionId_(transitions, TARGETS_PROP);
    if (targetId){
      call(`${BASE}/rest/api/3/issue/${key}/transitions`, 'POST', auth, { transition: { id: String(targetId) } });
    }
  } catch(_){ /* si falla, seguimos igual */ }

  // comentario publico (evitando duplicados)
  const DEDUP_PHRASE = 'He recibido tu ticket y lo estaré revisando.'; 
  if (!hasRecentSameComment_(key, DEDUP_PHRASE, BASE, auth)) {
    const issueId = issueObj.id;                                      
    const nombre  = cleanDisplayName_(reporter) || 'cliente';
    const bodyPub =
      `Hola ${nombre}, buen día.\n\n` +
      `He recibido tu ticket y lo estaré revisando.\n` +
      `Te voy comentando apenas tenga novedades.`;
    try {
      addPublicCommentJSM_(issueId, bodyPub, BASE, auth);
    } catch(_) {
      // si falla, no comentamos
    }
  }

  return true;
}

/************* Entrada (GMAIL trigger) *************/
function checkJiraEmails(){
  const BASE = getProp_('JIRA_BASE');
  const USER = getProp_('JIRA_USER_EMAIL');
  const TOKEN = getProp_('JIRA_API_TOKEN');
  const ASSIGNEE_ID = getProp_('JIRA_ASSIGNEE_ACCOUNT_ID');
  const auth = 'Basic ' + Utilities.base64Encode(USER + ':' + TOKEN);

  const DEFAULT_SEARCH = 'label:jira-auto newer_than:30m -label:auto-jira-ok -label:auto-jira-error';
  const GMAIL_SEARCH = getProp_('GMAIL_SEARCH', DEFAULT_SEARCH);

  //etiqueta correo procesado
  const LABEL_OK  = GmailApp.getUserLabelByName('auto-jira-ok')    || GmailApp.createLabel('auto-jira-ok');
  const LABEL_ERR = GmailApp.getUserLabelByName('auto-jira-error') || GmailApp.createLabel('auto-jira-error');

  const threads = GmailApp.search(GMAIL_SEARCH);
  if (!threads.length) return;

  threads.forEach(t=>{
    let anyOk = false;
    try{
      t.getMessages().forEach(m=>{
        const dump = (m.getSubject()||'')+'\n'+(m.getPlainBody()||'')+'\n'+(m.getBody()||'');
        const keys = [...new Set(extractIssueKeys_(dump))];
        keys.forEach(key=>{
          try{
            const K = String(key||'').trim().toUpperCase();
            if (!K || wasProcessed_(K)) return;
            if (processIssueCore_(K, BASE, auth, ASSIGNEE_ID)) anyOk = true;
            markProcessed_(K); // evita reprocesar ~4h
          }catch(_){ /* si falla, seguimos igual */ }
        });
      });
      t.addLabel(anyOk ? LABEL_OK : LABEL_ERR);
    }catch(_){
      t.addLabel(LABEL_ERR);
    }
  });
}
