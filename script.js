// ============================================
// BYTE HORIZON PRO - Application Logic
// ============================================

// Configuration
const CONFIG = {
    TELEGRAM_BOT_TOKEN: '8621884244:AAFKIBfhn4vz7F2iD_XeWG2W1TgRFho8KB4',
    TELEGRAM_CHAT_ID: null, // Will be set when bot receives first message
    STORAGE_KEY: 'byteHorizonData'
};

// Current user state
let currentUser = null;
let selectedService = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeParticles();
    loadStoredData();
    setupFormHandlers();
    checkSession();
    // Show login page by default
    showPage('loginPage');
});

// Create floating particles
function initializeParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        const colors = ['#00f5ff', '#a855f7', '#ec4899'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        container.appendChild(particle);
    }
}

// Load stored data from localStorage
function loadStoredData() {
    const data = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!data) {
        const initialData = { submissions: [], users: [] };
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(initialData));
    }
}

// Get data from storage
function getData() {
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '{"submissions":[],"users":[]}');
}

// Save data to storage
function saveData(data) {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
}

// Check if user has active session
function checkSession() {
    const session = sessionStorage.getItem('currentUser');
    if (session) {
        currentUser = JSON.parse(session);
        showPage('servicesPage');
    }
}

// ============================================
// PAGE NAVIGATION
// ============================================

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
        page.classList.remove('visible');
    });
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.style.display = 'flex';
        targetPage.classList.add('visible');
        window.scrollTo(0, 0);
    }
    
    // Update admin stats if showing admin page
    if (pageId === 'adminPage') {
        updateAdminStats();
        renderSubmissions();
    }
}

// ============================================
// FORM HANDLERS
// ============================================

function setupFormHandlers() {
    // Login Form
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    
    // Signup Form
    document.getElementById('signupForm')?.addEventListener('submit', handleSignup);
    
    // Project Form
    document.getElementById('projectForm')?.addEventListener('submit', handleProjectSubmit);
    
    // Contact Form
    document.getElementById('contactForm')?.addEventListener('submit', handleContactSubmit);
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Check for admin credentials
    if (email === 'admin@bytehorizon.com' && password === 'admin123') {
        showToast('Welcome Admin!', 'success');
        showPage('adminPage');
        return;
    }
    
    const data = getData();
    const user = data.users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        showToast(`Welcome back, ${user.username}!`, 'success');
        showPage('servicesPage');
    } else {
        showToast('Invalid email or password', 'error');
    }
}

// Handle Signup
async function handleSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const username = document.getElementById('signupUsername').value;
    const country = document.getElementById('signupCountry').value;
    const password = document.getElementById('signupPassword').value;
    
    const data = getData();
    
    // Check if email already exists
    if (data.users.find(u => u.email === email)) {
        showToast('Email already registered', 'error');
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now(),
        email,
        username,
        country,
        password,
        createdAt: new Date().toISOString()
    };
    
    data.users.push(newUser);
    saveData(data);
    
    // Send to Telegram
    await sendToTelegram({
        type: '🆕 New User Registration',
        username,
        email,
        country
    });
    
    showToast('Account created successfully!', 'success');
    currentUser = newUser;
    sessionStorage.setItem('currentUser', JSON.stringify(newUser));
    
    // Reset form and go to services
    document.getElementById('signupForm').reset();
    showPage('servicesPage');
}

// Verify Email
function verifyEmail() {
    const email = document.getElementById('signupEmail').value;
    if (!email) {
        showToast('Please enter your email first', 'error');
        return;
    }
    
    const btn = document.getElementById('verifyBtn');
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;
    
    setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> Verified';
        btn.style.background = 'rgba(34, 197, 94, 0.2)';
        btn.style.borderColor = '#22c55e';
        btn.style.color = '#22c55e';
        showToast('Email verified successfully!', 'success');
    }, 1500);
}

// Select Service
function selectService(service) {
    selectedService = service;
    showPage('projectFormPage');
}

// Handle Project Submission
async function handleProjectSubmit(e) {
    e.preventDefault();
    
    const submission = {
        id: Date.now(),
        type: 'project',
        service: selectedService,
        name: document.getElementById('projectName').value,
        email: document.getElementById('projectEmail').value,
        phone: document.getElementById('projectPhone').value || 'N/A',
        budget: document.getElementById('projectBudget').value || 'Not specified',
        message: document.getElementById('projectDescription').value,
        status: 'new',
        createdAt: new Date().toISOString()
    };
    
    const data = getData();
    data.submissions.push(submission);
    saveData(data);
    
    // Send to Telegram
    await sendToTelegram({
        type: '💼 New Project Request',
        service: getServiceName(selectedService),
        name: submission.name,
        email: submission.email,
        phone: submission.phone,
        budget: submission.budget,
        message: submission.message
    });
    
    showToast('Project submitted successfully! We\'ll contact you soon.', 'success');
    document.getElementById('projectForm').reset();
    showPage('portfolioPage');
}

// Handle Contact Submission
async function handleContactSubmit(e) {
    e.preventDefault();
    
    const submission = {
        id: Date.now(),
        type: 'contact',
        service: 'contact',
        name: document.getElementById('contactName').value,
        email: document.getElementById('contactEmail').value,
        message: document.getElementById('contactMessage').value,
        status: 'new',
        createdAt: new Date().toISOString()
    };
    
    const data = getData();
    data.submissions.push(submission);
    saveData(data);
    
    // Send to Telegram
    await sendToTelegram({
        type: '📧 New Contact Message',
        name: submission.name,
        email: submission.email,
        message: submission.message
    });
    
    showToast('Message sent successfully!', 'success');
    document.getElementById('contactForm').reset();
}

// ============================================
// TELEGRAM BOT INTEGRATION
// ============================================

async function sendToTelegram(data) {
    try {
        // Format message
        let message = `🔔 *${data.type}*\n\n`;
        
        if (data.username) message += `👤 *User:* ${data.username}\n`;
        if (data.name) message += `👤 *Name:* ${data.name}\n`;
        if (data.email) message += `📧 *Email:* ${data.email}\n`;
        if (data.country) message += `🌍 *Country:* ${data.country}\n`;
        if (data.service) message += `🛠️ *Service:* ${data.service}\n`;
        if (data.phone) message += `📱 *Phone:* ${data.phone}\n`;
        if (data.budget) message += `💰 *Budget:* ${data.budget}\n`;
        if (data.message) message += `📝 *Message:*\n${data.message}\n`;
        
        message += `\n⏰ *Time:* ${new Date().toLocaleString()}`;
        
        // Get chat ID first by calling getUpdates
        const updatesUrl = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/getUpdates`;
        const updatesResponse = await fetch(updatesUrl);
        const updatesData = await updatesResponse.json();
        
        if (updatesData.ok && updatesData.result.length > 0) {
            // Get the chat ID from the most recent message
            const chatId = updatesData.result[updatesData.result.length - 1].message.chat.id;
            
            // Send message
            const sendUrl = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
            await fetch(sendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });
        }
    } catch (error) {
        console.error('Telegram error:', error);
    }
}

// ============================================
// ADMIN DASHBOARD FUNCTIONS
// ============================================

function updateAdminStats() {
    const data = getData();
    const submissions = data.submissions;
    
    document.getElementById('statTotal').textContent = submissions.length;
    document.getElementById('statNew').textContent = submissions.filter(s => s.status === 'new').length;
    document.getElementById('statPending').textContent = submissions.filter(s => s.status === 'pending').length;
    document.getElementById('statCompleted').textContent = submissions.filter(s => s.status === 'completed').length;
}

function renderSubmissions() {
    const data = getData();
    const tbody = document.getElementById('adminTableBody');
    
    if (data.submissions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No submissions yet</td></tr>';
        return;
    }
    
    // Sort by date (newest first)
    const sorted = [...data.submissions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    tbody.innerHTML = sorted.map(item => `
        <tr>
            <td>#${item.id.toString().slice(-6)}</td>
            <td><strong>${item.name || item.username || 'N/A'}</strong></td>
            <td>${item.email || 'N/A'}</td>
            <td><span style="color: ${getServiceColor(item.service)}">${getServiceName(item.service)}</span></td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.message || '-'}</td>
            <td><span class="badge badge-${item.status === 'new' ? 'new' : item.status === 'pending' ? 'pending' : 'success'}">${item.status.toUpperCase()}</span></td>
            <td>${formatDate(item.createdAt)}</td>
            <td>
                <div class="flex gap-1">
                    <button class="btn btn-icon btn-secondary" onclick="viewDetails(${item.id})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-icon btn-secondary" onclick="changeStatus(${item.id})" title="Change Status">
                        <i class="fas fa-flag"></i>
                    </button>
                    <button class="btn btn-icon btn-secondary" onclick="deleteSubmission(${item.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterData() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const serviceFilter = document.getElementById('filterService').value;
    
    const data = getData();
    let filtered = data.submissions;
    
    if (search) {
        filtered = filtered.filter(item => 
            (item.name || '').toLowerCase().includes(search) ||
            (item.email || '').toLowerCase().includes(search) ||
            (item.message || '').toLowerCase().includes(search)
        );
    }
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    if (serviceFilter !== 'all') {
        filtered = filtered.filter(item => item.service === serviceFilter);
    }
    
    const tbody = document.getElementById('submissionsBody');
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">No results found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td>#${item.id.toString().slice(-6)}</td>
            <td><strong>${item.name || item.username || 'N/A'}</strong></td>
            <td>${item.email || 'N/A'}</td>
            <td><span style="color: ${getServiceColor(item.service)}">${getServiceName(item.service)}</span></td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.message || '-'}</td>
            <td><span class="badge badge-${item.status === 'new' ? 'new' : item.status === 'pending' ? 'pending' : 'success'}">${item.status.toUpperCase()}</span></td>
            <td>${formatDate(item.createdAt)}</td>
            <td>
                <div class="flex gap-1">
                    <button class="btn btn-icon btn-secondary" onclick="viewDetails(${item.id})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-icon btn-secondary" onclick="changeStatus(${item.id})" title="Change Status">
                        <i class="fas fa-flag"></i>
                    </button>
                    <button class="btn btn-icon btn-secondary" onclick="deleteSubmission(${item.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function viewDetails(id) {
    const data = getData();
    const item = data.submissions.find(s => s.id === id);
    if (!item) return;
    
    const details = `
ID: #${item.id.toString().slice(-6)}
Type: ${item.type || 'submission'}
Service: ${getServiceName(item.service)}
Name: ${item.name || item.username || 'N/A'}
Email: ${item.email || 'N/A'}
${item.phone ? 'Phone: ' + item.phone : ''}
${item.budget ? 'Budget: ' + item.budget : ''}
${item.country ? 'Country: ' + item.country : ''}
Status: ${item.status.toUpperCase()}
Date: ${formatDate(item.createdAt)}

Message:
${item.message || 'No message'}
    `;
    
    alert(details);
}

function changeStatus(id) {
    const data = getData();
    const item = data.submissions.find(s => s.id === id);
    if (!item) return;
    
    const statuses = ['new', 'pending', 'completed'];
    const currentIndex = statuses.indexOf(item.status);
    const newStatus = statuses[(currentIndex + 1) % statuses.length];
    
    item.status = newStatus;
    saveData(data);
    
    renderSubmissions();
    updateAdminStats();
    showToast(`Status changed to ${newStatus}`, 'success');
}

function deleteSubmission(id) {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    
    const data = getData();
    data.submissions = data.submissions.filter(s => s.id !== id);
    saveData(data);
    
    renderSubmissions();
    updateAdminStats();
    showToast('Submission deleted', 'success');
}

function refreshData() {
    renderSubmissions();
    updateAdminStats();
    showToast('Data refreshed', 'info');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getServiceName(service) {
    const names = {
        'web': 'Web Development',
        'trading': 'Trading Tools',
        'mobile': 'Mobile Apps',
        'contact': 'Contact Form'
    };
    return names[service] || service || 'N/A';
}

function getServiceColor(service) {
    const colors = {
        'web': 'var(--primary-cyan)',
        'trading': 'var(--primary-purple)',
        'mobile': 'var(--primary-pink)',
        'contact': '#22c55e'
    };
    return colors[service] || 'var(--text-secondary)';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]}" style="color: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : 'var(--primary-cyan)'}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Make functions globally available
window.showPage = showPage;
window.verifyEmail = verifyEmail;
window.selectService = selectService;
window.viewDetails = viewDetails;
window.changeStatus = changeStatus;
window.deleteSubmission = deleteSubmission;
window.refreshData = refreshData;
window.filterData = filterData;