let currentUser = null;
let currentStep = 1;
let users = JSON.parse(localStorage.getItem('portfolioUsers')) || [];
let emailVerified = false;

// Initialize Lucide Icons
lucide.createIcons();

function showPhase(idx) {
    document.querySelectorAll('.phase').forEach((p, i) => p.classList.toggle('active', i === idx));
    if (idx === 2) {
        document.getElementById('navbar').style.display = 'flex';
        // Refresh icons when navbar appears
        lucide.createIcons();
    }
}

function toggleAuth() {
    const login = document.getElementById('loginForm');
    const signup = document.getElementById('signupForm');
    const isLogin = login.style.display !== 'none';
    login.style.display = isLogin ? 'none' : 'block';
    signup.style.display = isLogin ? 'block' : 'none';
    document.getElementById('authTitle').textContent = isLogin ? 'Create Account' : 'Welcome';
}

function verifyEmail() {
    const btn = event.target;
    btn.textContent = '...';
    setTimeout(() => {
        btn.textContent = 'Verified';
        btn.style.background = '#22c55e';
        emailVerified = true;
        document.getElementById('verifyStatus').style.display = 'block';
    }, 1500);
}

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = users.find(u => u.email === document.getElementById('loginEmail').value && u.password === btoa(document.getElementById('loginPassword').value));
    if (user) { 
        currentUser = user; 
        document.getElementById('welcomeMessage').textContent = `Hello, ${user.username}`;
        showPhase(1); 
    } else alert('Invalid Credentials');
});

document.getElementById('signupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!emailVerified) return alert('Please verify your email');
    currentUser = { id: Date.now(), username: document.getElementById('signupUsername').value, email: document.getElementById('signupEmail').value, password: btoa(document.getElementById('signupPassword').value), leadData: null };
    users.push(currentUser);
    localStorage.setItem('portfolioUsers', JSON.stringify(users));
    document.getElementById('welcomeMessage').textContent = `Hello, ${currentUser.username}`;
    showPhase(1);
});

function updateStepIndicator() {
    document.querySelectorAll('.step-content').forEach((s, i) => s.style.display = (i+1) === currentStep ? 'block' : 'none');
    const indicator = document.getElementById('stepIndicator');
    indicator.innerHTML = '';
    for(let i=1; i<=4; i++) {
        const d = document.createElement('div');
        d.className = `step ${currentStep >= i ? 'active' : ''}`;
        d.textContent = i;
        indicator.appendChild(d);
    }
}

function nextStep() { if (currentStep < 4) { currentStep++; updateStepIndicator(); } }
function prevStep(s) { currentStep = s; updateStepIndicator(); }

document.getElementById('leadForm').addEventListener('submit', (e) => {
    e.preventDefault();
    currentUser.leadData = { name: document.getElementById('fullName').value, service: document.getElementById('service').value, budget: document.getElementById('budget').value, contact: document.getElementById('contact').value };
    const idx = users.findIndex(u => u.id === currentUser.id);
    users[idx] = currentUser;
    localStorage.setItem('portfolioUsers', JSON.stringify(users));
    showPhase(2);
});

// Admin Access (Double Click Logo)
document.getElementById('logoText').addEventListener('dblclick', () => {
    const pass = prompt('Admin Password:');
    if(pass === 'admin123') {
        document.getElementById('adminPanel').classList.add('active');
        document.getElementById('usersTableBody').innerHTML = users.map(u => `<div style="padding:10px; border-bottom:1px solid #333">${u.username} (${u.email}) - Service: ${u.leadData?.service || 'None'}</div>`).join('');
    }
});

function closeAdmin() { document.getElementById('adminPanel').classList.remove('active'); }

window.onload = () => { 
    updateStepIndicator();
    setTimeout(() => {
        document.getElementById('loadingOverlay').classList.remove('active');
    }, 1000);
};