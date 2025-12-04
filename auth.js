// auth.js - funções de autenticação e utilitários compartilhados

// Default toast duration (ms) used across redirects
const TOAST_DURATION_MS = 3200;

// Small in-page toast notification helper
function showToast(message, type = 'info', duration = TOAST_DURATION_MS){
  try{
    const container = document.getElementById('toast-container');
    if(!container){
      // fallback to alert if no container found
      alert(message);
      return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role','status');
    toast.innerHTML = `<div class="icon">${type==='success'? '✓' : type==='error'? '⚠' : 'i'}</div><div class="msg">${message}</div>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(10px)';
      setTimeout(() => { try{ container.removeChild(toast); }catch(e){} }, 260);
    }, duration);
  } catch(e){
    alert(message);
  }
}

function criarConta(){
  // Try to read fields used in different templates (single-page or separate pages)
  const nome = (document.getElementById('registerName') && document.getElementById('registerName').value.trim()) ||
               (document.getElementById('cadNome') && document.getElementById('cadNome').value.trim()) || null;
  const email = (document.getElementById('registerEmail') && document.getElementById('registerEmail').value.trim()) ||
                (document.getElementById('cadEmail') && document.getElementById('cadEmail').value.trim()) || null;
  const senha = (document.getElementById('registerPassword') && document.getElementById('registerPassword').value) ||
                (document.getElementById('cadSenha') && document.getElementById('cadSenha').value) || null;

  if(!nome || !email || !senha){
    showToast('Preencha todos os campos!', 'error');
    return;
  }

  let users = JSON.parse(localStorage.getItem('usuarios')) || [];

  if(users.some(u => u.email === email)){
    showToast('Este e-mail já está cadastrado!', 'error');
    // se estiver em SPA, mostre login
    if(typeof showPage === 'function') showPage('login');
    return;
  }

  users.push({ nome, email, senha });
  localStorage.setItem('usuarios', JSON.stringify(users));

  showToast('Conta criada com sucesso! Você será redirecionado para o login.', 'success', TOAST_DURATION_MS);
  // Se for SPA, espere o toast sumir antes de mostrar o login e preencher o e-mail
  if(typeof showPage === 'function'){
    setTimeout(() => {
      showPage('login');
      const loginEmail = document.getElementById('loginEmail');
      if(loginEmail) loginEmail.value = email;
      const loginPassword = document.getElementById('loginPassword');
      if(loginPassword) loginPassword.focus();
    }, TOAST_DURATION_MS + 160);
  } else {
    setTimeout(() => { window.location.href = 'login.html'; }, TOAST_DURATION_MS + 160);
  }
}

function fazerLogin(){
  // support multiple form field names used across templates
  const emailInput = document.getElementById("loginEmail") || document.getElementById("loginEmailInput") || document.querySelector('input[name="email"]');
  const senhaInput = document.getElementById("loginPassword") || document.getElementById("loginSenha") || document.querySelector('input[name="password"]');
  const email = emailInput ? (emailInput.value || '').trim() : null;
  const senha = senhaInput ? (senhaInput.value || '') : null;

  let users = JSON.parse(localStorage.getItem("usuarios")) || [];

  if(!users.length){
    showToast('Nenhum cadastro encontrado. Você será redirecionado para a página de cadastro.', 'info', TOAST_DURATION_MS);
    // if suposto.html single-page, use showPage if available (delay so toast can disappear)
    if(typeof showPage === 'function'){
      setTimeout(()=> showPage('register'), TOAST_DURATION_MS + 160);
    } else {
      setTimeout(()=> window.location.href = 'cadastro.html', TOAST_DURATION_MS + 160);
    }
    return;
  }

  const userFound = users.find(u => u.email === email);

  if(!userFound){
    showToast('E-mail não cadastrado. Você será redirecionado para criar uma conta.', 'info', TOAST_DURATION_MS);
    if(typeof showPage === 'function'){
      setTimeout(()=> showPage('register'), TOAST_DURATION_MS + 160);
    } else {
      setTimeout(()=> window.location.href = 'cadastro.html', TOAST_DURATION_MS + 160);
    }
    return;
  }

  if(userFound.senha !== senha){
    showToast('Senha incorreta. Tente novamente.', 'error', TOAST_DURATION_MS);
    return;
  }

  localStorage.setItem("usuarioLogado", JSON.stringify(userFound));
  // show success toast then redirect to app after it disappears
  showToast('Login realizado! Acessando a plataforma...', 'success', TOAST_DURATION_MS);
  if(typeof showPage === 'function'){
    setTimeout(()=> { showPage('app'); populateUserDisplay(); }, TOAST_DURATION_MS + 160);
  } else {
    setTimeout(()=> { window.location.href = 'paginagame.html'; }, TOAST_DURATION_MS + 160);
  }
}

function abrirLogin(){ if(typeof showPage === 'function') showPage('login'); else window.location.href = 'login.html'; }
function abrirCadastro(){ if(typeof showPage === 'function') showPage('register'); else window.location.href = 'cadastro.html'; }

function enviarFeedback(tipo){
  const msg = document.getElementById("feedback-msg");
  if(!msg) return;
  msg.innerText = `Obrigado! Seu feedback "${tipo}" foi registrado.`;
  msg.style.opacity = "1";

  setTimeout(() => {
    msg.style.opacity = "0";
  }, 3000);
}

function checkAuth(){
  const user = JSON.parse(localStorage.getItem('usuarioLogado'));
  return !!user;
}

function logout(){
  localStorage.removeItem('usuarioLogado');
  // after logout go back to login (support single-page showPage)
  if(typeof showPage === 'function') showPage('login');
  else window.location.href = 'login.html';
}

// Reset password modal (demo only)
function openResetModal(){
  // if modal exists, just show
  let modal = document.getElementById('reset-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'reset-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card">
        <button class="modal-close" aria-label="Fechar">×</button>
        <h3>Recuperar Senha</h3>
        <p>Informe seu e-mail cadastrado e enviaremos um link de recuperação (simulado).</p>
        <div class="form-group">
          <label for="resetEmail">E-mail</label>
          <input id="resetEmail" type="email" placeholder="seu@email.com">
        </div>
        <div style="display:flex; gap:8px; margin-top:12px;">
          <button class="btn primary" id="resetSend">Enviar link</button>
          <button class="btn secondary" id="resetCancel">Cancelar</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    // attach handlers
    modal.querySelector('.modal-close').addEventListener('click', closeResetModal);
    modal.querySelector('#resetCancel').addEventListener('click', closeResetModal);
    modal.querySelector('#resetSend').addEventListener('click', function(){
      const email = document.getElementById('resetEmail').value.trim();
      if(!email){ showToast('Por favor, informe seu e-mail.', 'error'); return; }
      // pretend to send
      showToast('Link de recuperação enviado para ' + email, 'success', TOAST_DURATION_MS);
      // close after toast
      setTimeout(closeResetModal, TOAST_DURATION_MS + 80);
    });
    // close on overlay click
    modal.addEventListener('click', function(e){ if(e.target === modal) closeResetModal(); });
  }
  modal.classList.add('open');
  // focus input
  setTimeout(()=>{ const i = document.getElementById('resetEmail'); if(i) i.focus(); }, 80);
}

function closeResetModal(){
  const modal = document.getElementById('reset-modal');
  if(modal){ modal.classList.remove('open'); }
}

function renderAuthHeader(){
  const container = document.getElementById('headerAuth');
  if(!container) return;
  const user = JSON.parse(localStorage.getItem('usuarioLogado'));
  if(user){
    // show user name and logout
    container.innerHTML = `
      <span id="userName">${user.nome ? escapeHtml(user.nome) : escapeHtml(user.email)}</span>
      <button class="btn small" onclick="logout()">Sair</button>
    `;
  } else {
    // show Entrar / Criar conta links
    container.innerHTML = `
      <a class="btn small-link" href="#" onclick="(typeof showPage === 'function' ? showPage('login') : window.location.href='login.html')">Entrar</a>
      <button class="btn small" onclick="abrirCadastro()">Criar conta</button>
    `;
  }
}

// Populate elements inside the app with logged user info (if present)
function populateUserDisplay(){
  const user = JSON.parse(localStorage.getItem('usuarioLogado'));
  if(!user) return;

  // avatar (initials)
  const avatar = document.querySelector('.user-avatar');
  if(avatar){
    const parts = (user.nome || user.email).split(' ');
    const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
    avatar.textContent = initials.toUpperCase();
  }

  // user name in header inside .user-info
  const nameNode = document.querySelector('.user-info > div > div');
  if(nameNode){
    nameNode.textContent = user.nome || user.email;
  }

  // welcome heading inside dashboard
  const welcomeH1 = document.querySelector('.dashboard h1') || document.querySelector('.dashboard-header h1');
  if(welcomeH1){
    welcomeH1.textContent = `Bem-vindo de volta, ${user.nome || user.email.split('@')[0]}!`;
  }
}

// small utility to avoid injecting raw strings
function escapeHtml(str){
  return String(str).replace(/[&<>"'`]/g, function(ch){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;', '`':'&#96;'}[ch];
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderAuthHeader();
  populateUserDisplay();
});

// Attach to forms in suposto.html (single-page) if present
document.addEventListener('DOMContentLoaded', function(){
  const loginForm = document.getElementById('loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', function(e){
      e.preventDefault();
      fazerLogin();
    });
  }

  const registerForm = document.getElementById('registerForm');
  if(registerForm){
    registerForm.addEventListener('submit', function(e){
      e.preventDefault();
      // collect fields used in suposto.html
      const name = document.getElementById('registerName') ? document.getElementById('registerName').value.trim() : null;
      const email = document.getElementById('registerEmail') ? document.getElementById('registerEmail').value.trim() : null;
      const company = document.getElementById('registerCompany') ? document.getElementById('registerCompany').value.trim() : '';
      const role = document.getElementById('registerRole') ? document.getElementById('registerRole').value : '';
      const password = document.getElementById('registerPassword') ? document.getElementById('registerPassword').value : null;
      const confirm = document.getElementById('registerConfirmPassword') ? document.getElementById('registerConfirmPassword').value : null;

      if(!name || !email || !password || !confirm){
        showToast('Por favor, preencha todos os campos.', 'error');
        return;
      }

      if(password !== confirm){
        showToast('As senhas não coincidem.', 'error');
        return;
      }

      let users = JSON.parse(localStorage.getItem('usuarios')) || [];
      if(users.some(u => u.email === email)){
        showToast('Este e-mail já está cadastrado. Faça login.', 'info', TOAST_DURATION_MS);
        if(typeof showPage === 'function'){
          setTimeout(()=> showPage('login'), TOAST_DURATION_MS + 160);
        } else {
          setTimeout(()=> window.location.href = 'login.html', TOAST_DURATION_MS + 160);
        }
        return;
      }

      const newUser = { nome: name, email, senha: password, company, role };
      users.push(newUser);
      localStorage.setItem('usuarios', JSON.stringify(users));

      showToast(`Conta criada com sucesso para ${name}! Agora você será redirecionado para o login.`, 'success', TOAST_DURATION_MS);
      if(typeof showPage === 'function'){
        setTimeout(()=> showPage('login'), TOAST_DURATION_MS + 160);
      } else {
        setTimeout(()=> window.location.href = 'login.html', TOAST_DURATION_MS + 160);
      }
    });
  }

  // Protect app-page access: if #app-page present and visible, ensure user logged
  const appPage = document.getElementById('app-page');
  if(appPage){
    // if page initially displayed and user not logged, redirect to login
    const visible = appPage.style.display !== 'none';
    const logged = !!localStorage.getItem('usuarioLogado');
    if(visible && !logged){
      showToast('Você precisa estar logado para acessar a plataforma.', 'info', TOAST_DURATION_MS);
      if(typeof showPage === 'function'){
        setTimeout(()=> showPage('login'), TOAST_DURATION_MS + 160);
      } else {
        setTimeout(()=> window.location.href = 'login.html', TOAST_DURATION_MS + 160);
      }
    }
  }
});

// receive notifications when a page is shown (hooked from suposto.html showPage)
window.onPageShown = function(pageId){
  try{
    if(pageId === 'login'){
      setTimeout(()=>{ const e = document.getElementById('loginEmail'); if(e) e.focus(); }, 80);
    }
    if(pageId === 'register'){
      setTimeout(()=>{ const r = document.getElementById('registerName'); if(r) r.focus(); }, 80);
    }
  }catch(e){}
};
