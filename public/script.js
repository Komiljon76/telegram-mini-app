// Global variables
let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || {};
let jobs = []; // Will be loaded from API
let settings = JSON.parse(localStorage.getItem('settings')) || {
    autoLogin: true,
    notifications: true,
    darkMode: false,
    twoFactor: false,
    activityTracking: true
};
let currentEditingJob = null;
let currentDeletingJob = null;

// Cache DOM elements
const domCache = {};

// Debug function
function debug(message, data = null) {
    console.log(`[DEBUG] ${message}`, data);
    // Debug messages will no longer be appended to the UI by default.
    // To show the debug panel, open console (F12) and type toggleDebugPanel()
    // const debugDiv = document.getElementById('debug') || createDebugDiv();
    // debugDiv.innerHTML += `<div>${new Date().toLocaleTimeString()}: ${message}</div>`;
    // debugDiv.scrollTop = debugDiv.scrollHeight;
}

function createDebugDiv() {
    const div = document.createElement('div');
    div.id = 'debug';
    div.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        width: 300px;
        height: 200px;
        background: rgba(0,0,0,0.8);
        color: white;
        font-size: 12px;
        padding: 10px;
        overflow-y: auto;
        z-index: 10000;
        border-radius: 5px;
        display: none;
    `;
    document.body.appendChild(div);
    return div;
}

function getElement(id) {
    if (!domCache[id]) {
        domCache[id] = document.getElementById(id);
    }
    return domCache[id];
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    debug('App initializing...');
    
    // Add debug panel
    addDebugPanel();
    
    // Make debug functions globally accessible
    window.toggleDebugPanel = toggleDebugPanel;
    window.debug = debug;
    
    // Hide loading screen after 1.5 seconds
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            debug('Loading screen hidden');
        }
    }, 1500);

    // Load settings
    loadSettings();
    
    // Check for auto-login
    if (localStorage.getItem('currentUser')) {
        try {
            currentUser = JSON.parse(localStorage.getItem('currentUser'));
            showDashboard();
        } catch (error) {
            console.error('Error loading user:', error);
            localStorage.removeItem('currentUser');
            showSection('welcomeSection');
        }
    } else {
        showSection('welcomeSection');
    }

    // Add event listeners
    addEventListeners();
    
    // Load sample jobs if none exist
    if (jobs.length === 0) {
        loadSampleJobs();
    }
    
    debug('App initialized successfully!');
});

// Add event listeners
function addEventListeners() {
    debug('Adding event listeners...');
    
    // Form submissions
    const forms = {
        loginForm: handleLogin,
        registerForm: handleRegister,
        forgotForm: handleForgotPassword,
        resetForm: handleResetPassword,
        postForm: handlePostJob
    };
    
    Object.entries(forms).forEach(([formId, handler]) => {
        const form = document.getElementById(formId);
        if (form) {
            debug(`Found form: ${formId}`);
            form.addEventListener('submit', function(event) {
                debug(`Form submitted: ${formId}`);
                handler.call(this, event);
            });
            debug(`${formId} event listener added`);
        } else {
            debug(`ERROR: ${formId} not found`);
        }
    });
    
    // Settings toggles
    const toggles = [
        'autoLoginToggle', 'notificationsToggle', 'darkModeToggle', 
        'twoFactorToggle', 'activityToggle'
    ];
    
    toggles.forEach(toggleId => {
        const toggle = document.getElementById(toggleId);
        if (toggle) {
            toggle.addEventListener('change', updateSetting);
        }
    });
    
    // Modal close buttons
    const modals = [
        'logoutModal', 'deleteAccountModal', 'changePasswordModal', 
        'loginHistoryModal', 'jobDetailModal', 'editJobModal', 'deleteJobModal'
    ];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => closeModal(modalId));
            }
        }
    });
    
    // Delete account confirmation
    const deleteConfirm = document.getElementById('deleteConfirm');
    if (deleteConfirm) {
        deleteConfirm.addEventListener('input', function() {
            const deleteBtn = document.querySelector('#deleteAccountModal .btn-danger');
            if (deleteBtn) {
                deleteBtn.disabled = this.value !== 'O\'CHIRISH';
            }
        });
    }
    
    debug('All event listeners added successfully!');
}

// Show section function - IMPROVED
function showSection(sectionId) {
    debug(`showSection called with: ${sectionId}`);
    
    // Hide all main sections
    const mainSections = ['welcomeSection', 'loginSection', 'registerSection', 'forgotSection', 'resetSection', 'dashboard'];
    mainSections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
            debug(`Hidden section: ${id}`);
        } else {
            debug(`WARNING: Section not found: ${id}`);
        }
    });
    
    // Hide all dashboard sections
    const dashboardSections = ['jobsSection', 'myJobsSection', 'postSection', 'profileSection', 'settingsSection'];
    dashboardSections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
            debug(`Hidden dashboard section: ${id}`);
        }
    });
    
    // Show target section
    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
        debug(`Found target section: ${sectionId}`);
        
        if (mainSections.includes(sectionId)) {
            // Main section
            targetElement.style.display = 'flex';
            debug(`Showing main section: ${sectionId} with display: flex`);
        } else if (dashboardSections.includes(sectionId)) {
            // Dashboard section
            const dashboard = document.getElementById('dashboard');
            if (dashboard) {
                dashboard.style.display = 'flex';
                debug('Showing dashboard');
            }
            targetElement.style.display = 'block';
            debug(`Showing dashboard section: ${sectionId} with display: block`);
            
            // Update navigation
            updateNavigation(sectionId);
            
            // Load specific content
            if (sectionId === 'jobsSection') {
                loadJobs();
            } else if (sectionId === 'myJobsSection') {
                loadMyJobs();
            } else if (sectionId === 'profileSection') {
                updateUserInfo();
            } else if (sectionId === 'settingsSection') {
                loadSettings();
            }
        }
    } else {
        debug(`ERROR: Target section not found: ${sectionId}`);
        console.error('Section not found:', sectionId);
    }
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.nextElementSibling;
    const icon = toggle.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
        toggle.classList.add('active');
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
        toggle.classList.remove('active');
    }
}

// Handle login
function handleLogin(event) {
    event.preventDefault();
    debug('Login attempt started...');
    
    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    debug(`Login attempt - Phone: ${phone}, Password length: ${password.length}`);
    
    if (!phone || !password) {
        debug('Login failed: Empty fields');
        showNotification('Barcha maydonlarni to\'ldiring', 'error');
        return;
    }
    
    debug(`Checking user: ${phone}`);
    debug(`Available users: ${Object.keys(users).length}`);
    
    const user = users[phone];
    if (!user) {
        debug(`Login failed: User not found - ${phone}`);
        showNotification('Foydalanuvchi topilmadi', 'error');
        return;
    }
    
    debug(`User found: ${user.name}`);
    
    if (user.password !== password) {
        debug('Login failed: Wrong password');
        showNotification('Noto\'g\'ri parol', 'error');
        return;
    }
    
    debug('Password verified successfully');
    
    // Login successful
    currentUser = user;
    
    // Update last login
    currentUser.lastLogin = new Date().toLocaleString('uz-UZ');
    users[phone] = currentUser;
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('users', JSON.stringify(users));
    
    debug('User data saved to localStorage');
    
    // Log activity
    if (settings.activityTracking) {
        logActivity('login', 'Muvaffaqiyatli kirish');
    }
    
    showNotification('Muvaffaqiyatli kirildi', 'success');
    debug('Showing dashboard...');
    showDashboard();
}

// Handle register
function handleRegister(event) {
    event.preventDefault();
    debug('Registration attempt started...');
    
    const name = document.getElementById('registerName').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    debug(`Registration attempt - Name: ${name}, Phone: ${phone}, Password length: ${password.length}`);
    
    if (!name || !phone || !password || !confirmPassword) {
        debug('Registration failed: Empty fields');
        showNotification('Barcha maydonlarni to\'ldiring', 'error');
        return;
    }
    
    debug(`Checking if user exists: ${phone}`);
    if (users[phone]) {
        debug(`Registration failed: User already exists - ${phone}`);
        showNotification('Bu telefon raqam allaqachon ro\'yxatdan o\'tgan', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        debug('Registration failed: Passwords do not match');
        showNotification('Parollar mos kelmadi', 'error');
        return;
    }
    
    if (password.length < 6) {
        debug('Registration failed: Password too short');
        showNotification('Parol kamida 6 ta belgidan iborat bo\'lishi kerak', 'error');
        return;
    }
    
    debug('Creating new user...');
    
    // Create new user
    const newUser = {
        name: name,
        phone: phone,
        password: password,
        createdAt: new Date().toLocaleString('uz-UZ'),
        lastLogin: new Date().toLocaleString('uz-UZ'),
        settings: { ...settings }
    };
    
    users[phone] = newUser;
    localStorage.setItem('users', JSON.stringify(users));
    
    debug(`User created successfully: ${name} (${phone})`);
    debug(`Total users now: ${Object.keys(users).length}`);
    
    showNotification('Muvaffaqiyatli ro\'yxatdan o\'tildi', 'success');
    debug('Showing login section...');
    showSection('loginSection');
}

// Handle forgot password
function handleForgotPassword(event) {
    event.preventDefault();
    
    const phone = document.getElementById('forgotPhone').value.trim();
    
    if (!phone) {
        showNotification('Telefon raqamni kiriting', 'error');
        return;
    }
    
    if (!users[phone]) {
        showNotification('Bu telefon raqam ro\'yxatdan o\'tmagan', 'error');
        return;
    }
    
    // Generate verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('verificationCode', code);
    localStorage.setItem('resetPhone', phone);
    
    showNotification(`Tasdiqlash kodi: ${code}`, 'info');
    showSection('resetSection');
}

// Handle reset password
function handleResetPassword(event) {
    event.preventDefault();
    
    const code = document.getElementById('resetCode').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    const savedCode = localStorage.getItem('verificationCode');
    const resetPhone = localStorage.getItem('resetPhone');
    
    if (!code || !newPassword || !confirmPassword) {
        showNotification('Barcha maydonlarni to\'ldiring', 'error');
        return;
    }
    
    if (code !== savedCode) {
        showNotification('Noto\'g\'ri tasdiqlash kodi', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('Parollar mos kelmadi', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Parol kamida 6 ta belgidan iborat bo\'lishi kerak', 'error');
        return;
    }
    
    // Update password
    users[resetPhone].password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));
    
    // Clear temporary data
    localStorage.removeItem('verificationCode');
    localStorage.removeItem('resetPhone');
    
    showNotification('Parol muvaffaqiyatli o\'zgartirildi', 'success');
    showSection('loginSection');
}

// Handle post job
async function handlePostJob(event) {
    event.preventDefault();
    console.log('Posting job...');
    
    const title = document.getElementById('jobTitle').value.trim();
    const company = document.getElementById('jobCompany').value.trim();
    const location = document.getElementById('jobLocation').value.trim();
    const type = document.getElementById('jobType').value;
    const salary = document.getElementById('jobSalary').value.trim();
    const workers = document.getElementById('jobWorkers').value;
    const telegram = document.getElementById('jobTelegram').value.trim();
    const phone = document.getElementById('jobPhone').value.trim();
    const requirements = document.getElementById('jobRequirements').value.trim();
    const description = document.getElementById('jobDescription').value.trim();
    
    if (!title || !company || !location || !type || !salary || !workers || !description) {
        showNotification('Majburiy maydonlarni to\'ldiring', 'error');
        return;
    }
    
    const jobData = {
        title: title,
        company: company,
        location: location,
        type: type,
        salary: salary,
        workers: parseInt(workers),
        telegram: telegram || '',
        phone: phone || '',
        requirements: requirements || '',
        description: description,
        postedBy: currentUser.phone
    };
    
    const result = await postJob(jobData);
    
    if (result.success) {
        // Refresh jobs list
        await fetchJobs();
        
        // Log activity
        if (settings.activityTracking) {
            logActivity('post_job', `Ish joylashtirildi: ${title}`);
        }
        
        showNotification('Ish muvaffaqiyatli joylashtirildi', 'success');
        
        // Reset form and show jobs
        event.target.reset();
        showSection('jobsSection');
    } else {
        showNotification(result.message || 'Ish joylashtirishda xatolik', 'error');
    }
}

// Show dashboard
async function showDashboard() {
    showSection('dashboard');
    updateUserInfo();
    await loadJobs();
    updateNavigation('jobsSection');
}

// Update user info
function updateUserInfo() {
    if (!currentUser) return;
    
    const elements = {
        userName: currentUser.name,
        userPhone: currentUser.phone,
        profileName: currentUser.name,
        profilePhone: currentUser.phone,
        profileDate: currentUser.createdAt
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
    
    // Update avatar
    const avatar = document.getElementById('userAvatar');
    if (avatar) {
        const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
        avatar.innerHTML = initials;
    }
    
    // Count user's jobs
    const userJobs = jobs.filter(job => job.postedBy === currentUser.phone);
    const profileJobs = document.getElementById('profileJobs');
    if (profileJobs) {
        profileJobs.textContent = userJobs.length + ' ta';
    }
}

// Load jobs
async function loadJobs() {
    debug('Loading jobs...');
    
    try {
        await fetchJobs();
        debug(`Loaded ${jobs.length} jobs`);
    } catch (error) {
        debug('Error loading jobs:', error.message);
        // Fallback to localStorage
        const localJobs = JSON.parse(localStorage.getItem('jobs') || '[]');
        jobs = localJobs;
        debug(`Using localStorage fallback: ${jobs.length} jobs`);
    }
    
    const jobGrid = document.getElementById('jobGrid');
    if (!jobGrid) {
        debug('Job grid not found');
        return;
    }
    
    jobGrid.innerHTML = '';
    
    if (jobs.length === 0) {
        jobGrid.innerHTML = '<p style="text-align: center; color: #ccc; grid-column: 1 / -1; padding: 2rem;">Hali ish o\'rinlari mavjud emas</p>';
        debug('No jobs to display');
        return;
    }
    
    debug(`Displaying ${jobs.length} jobs`);
    
    jobs.forEach(job => {
        const jobCard = document.createElement('div');
        jobCard.className = 'job-card';
        jobCard.onclick = () => showJobDetail(job.id);
        
        jobCard.innerHTML = `
            <div class="job-header">
                <h3>${escapeHtml(job.title)}</h3>
                <span class="job-type">${getJobTypeText(job.type)}</span>
            </div>
            <div class="job-company">
                <i class="fas fa-building"></i>
                <span>${escapeHtml(job.company)}</span>
            </div>
            <div class="job-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${escapeHtml(job.location)}</span>
            </div>
            <div class="job-salary">
                <i class="fas fa-money-bill-wave"></i>
                <span>${escapeHtml(job.salary)}</span>
            </div>
            <div class="job-workers">
                <i class="fas fa-users"></i>
                <span>${job.workers || 1} kishi kerak</span>
            </div>
            ${job.requirements ? `
            <div class="job-requirements">
                <div class="requirement-item">
                    <i class="fas fa-list"></i>
                    <span>${escapeHtml(job.requirements)}</span>
                </div>
            </div>
            ` : ''}
            <div class="job-description">
                <p>${escapeHtml(job.description.substring(0, 100))}${job.description.length > 100 ? '...' : ''}</p>
            </div>
            <div class="job-actions">
                <button class="btn btn-secondary" onclick="event.stopPropagation(); showJobDetail(${job.id})">
                    <i class="fas fa-eye"></i>
                    Ko'rish
                </button>
                <button class="btn" onclick="event.stopPropagation(); applyForJob(${job.id})">
                    <i class="fas fa-paper-plane"></i>
                    Ariza
                </button>
            </div>
        `;
        
        jobGrid.appendChild(jobCard);
    });
    
    debug('Jobs displayed successfully');
}

// Load my jobs
function loadMyJobs() {
    if (!currentUser) return;
    
    const myJobs = jobs.filter(job => job.postedBy === currentUser.phone);
    const myJobGrid = document.getElementById('myJobGrid');
    if (!myJobGrid) return;
    
    myJobGrid.innerHTML = '';
    
    if (myJobs.length === 0) {
        myJobGrid.innerHTML = '<p style="text-align: center; color: #ccc; grid-column: 1 / -1; padding: 2rem;">Siz hali ish joylashtirmagansiz</p>';
        return;
    }
    
    myJobs.forEach(job => {
        const jobCard = document.createElement('div');
        jobCard.className = 'job-card';
        
        jobCard.innerHTML = `
            <div class="job-header">
                <h3>${escapeHtml(job.title)}</h3>
                <span class="job-type">${getJobTypeText(job.type)}</span>
            </div>
            <div class="job-company">
                <i class="fas fa-building"></i>
                <span>${escapeHtml(job.company)}</span>
            </div>
            <div class="job-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${escapeHtml(job.location)}</span>
            </div>
            <div class="job-salary">
                <i class="fas fa-money-bill-wave"></i>
                <span>${escapeHtml(job.salary)}</span>
            </div>
            <div class="job-workers">
                <i class="fas fa-users"></i>
                <span>${job.workers || 1} kishi kerak</span>
            </div>
            <div class="job-actions">
                <button class="btn btn-secondary" onclick="editJob(${job.id})">
                    <i class="fas fa-edit"></i>
                    Tahrirlash
                </button>
                <button class="btn btn-danger" onclick="deleteJob(${job.id})">
                    <i class="fas fa-trash"></i>
                    O'chirish
                </button>
            </div>
        `;
        
        myJobGrid.appendChild(jobCard);
    });
}

// Edit job
function editJob(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    currentEditingJob = job;
    
    // Fill form
    document.getElementById('editJobTitle').value = job.title;
    document.getElementById('editJobCompany').value = job.company;
    document.getElementById('editJobLocation').value = job.location;
    document.getElementById('editJobType').value = job.type;
    document.getElementById('editJobSalary').value = job.salary;
    document.getElementById('editJobWorkers').value = job.workers;
    document.getElementById('editJobTelegram').value = job.telegram || '';
    document.getElementById('editJobPhone').value = job.phone || '';
    document.getElementById('editJobRequirements').value = job.requirements || '';
    document.getElementById('editJobDescription').value = job.description;
    
    document.getElementById('editJobModal').classList.add('active');
}

// Save job edit
async function saveJobEdit() {
    if (!currentEditingJob) return;
    
    const title = document.getElementById('editJobTitle').value.trim();
    const company = document.getElementById('editJobCompany').value.trim();
    const location = document.getElementById('editJobLocation').value.trim();
    const type = document.getElementById('editJobType').value;
    const salary = document.getElementById('editJobSalary').value.trim();
    const workers = document.getElementById('editJobWorkers').value;
    const telegram = document.getElementById('editJobTelegram').value.trim();
    const phone = document.getElementById('editJobPhone').value.trim();
    const requirements = document.getElementById('editJobRequirements').value.trim();
    const description = document.getElementById('editJobDescription').value.trim();
    
    if (!title || !company || !location || !type || !salary || !workers || !description) {
        showNotification('Majburiy maydonlarni to\'ldiring', 'error');
        return;
    }
    
    const jobData = {
        title, company, location, type, salary,
        workers: parseInt(workers), telegram, phone, requirements, description
    };
    
    const result = await updateJob(currentEditingJob.id, jobData);
    
    if (result.success) {
        // Refresh jobs list
        await fetchJobs();
        
        showNotification('Ish muvaffaqiyatli tahrirlandi', 'success');
        closeModal('editJobModal');
        loadMyJobs();
    } else {
        showNotification(result.message || 'Ish tahrirlashda xatolik', 'error');
    }
}

// Delete job
function deleteJob(jobId) {
    currentDeletingJob = jobId;
    document.getElementById('deleteJobModal').classList.add('active');
}

// Confirm delete job
async function confirmDeleteJob() {
    if (!currentDeletingJob) return;
    
    const result = await deleteJobFromServer(currentDeletingJob);
    
    if (result.success) {
        // Refresh jobs list
        await fetchJobs();
        
        showNotification('Ish muvaffaqiyatli o\'chirildi', 'success');
        closeModal('deleteJobModal');
        loadMyJobs();
    } else {
        showNotification(result.message || 'Ish o\'chirishda xatolik', 'error');
    }
}

// Apply for job - Renamed to contactJobPoster
function contactJobPoster(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
        debug(`ERROR: Job not found for contact: ${jobId}`);
        showNotification('Ish topilmadi', 'error');
        return;
    }
    
    if (job.telegram) {
        const telegramUrl = `https://t.me/${job.telegram.replace(/^@/, '')}`;
        debug(`Opening Telegram URL: ${telegramUrl}`);
        window.open(telegramUrl, '_blank');
        showNotification('Elonchi bilan bog\'lanilmoqda...', 'info');
    } else if (job.phone) {
        // Fallback to phone if Telegram is not available
        debug(`Opening Phone number: ${job.phone}`);
        showNotification(`Elonchi bilan bog\'lanish uchun telefon: ${job.phone}`, 'info');
        window.open(`tel:${job.phone}`);
    } else {
        debug('Contact info not available for this job.');
        showNotification('Elonchi bilan bog\'lanish ma\'lumotlari topilmadi', 'error');
    }
    closeModal('jobDetailModal');
}

// Show job detail
function showJobDetail(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    document.getElementById('jobDetailTitle').textContent = job.title;
    
    const content = document.getElementById('jobDetailContent');
    content.innerHTML = `
        <div class="job-detail-section">
            <h4>Asosiy ma'lumotlar</h4>
            <div class="detail-item">
                <span class="detail-label">Kompaniya:</span>
                <span class="detail-value">${escapeHtml(job.company)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Manzil:</span>
                <span class="detail-value">${escapeHtml(job.location)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Ish turi:</span>
                <span class="detail-value">${getJobTypeText(job.type)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Maosh:</span>
                <span class="detail-value">${escapeHtml(job.salary)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Ishchilar soni:</span>
                <span class="detail-value">${job.workers} kishi</span>
            </div>
        </div>
        
        ${job.requirements ? `
        <div class="job-detail-section">
            <h4>Talablar</h4>
            <div class="detail-description">${escapeHtml(job.requirements)}</div>
        </div>
        ` : ''}
        
        <div class="job-detail-section">
            <h4>Ish tavsifi</h4>
            <div class="detail-description">${escapeHtml(job.description)}</div>
        </div>
        
        <div class="job-detail-section">
            <h4>Aloqa ma'lumotlari</h4>
            ${job.telegram ? `
            <div class="detail-item">
                <span class="detail-label">Telegram:</span>
                <span class="detail-value">${escapeHtml(job.telegram)}</span>
            </div>
            ` : ''}
            ${job.phone ? `
            <div class="detail-item">
                <span class="detail-label">Telefon:</span>
                <span class="detail-value">${escapeHtml(job.phone)}</span>
            </div>
            ` : ''}
            <div class="detail-item">
                <span class="detail-label">E'lon sanasi:</span>
                <span class="detail-value">${escapeHtml(job.postedAt)}</span>
            </div>
        </div>
    `;
    
    document.getElementById('jobDetailModal').classList.add('active');

    const contactBtn = document.getElementById('jobDetailContactBtn');
    if (contactBtn) {
        contactBtn.onclick = () => contactJobPoster(job.id);
    }
}

// Update navigation
function updateNavigation(activeTab) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    const tabMap = {
        'jobsSection': 0,
        'myJobsSection': 1,
        'postSection': 2,
        'profileSection': 3
    };
    
    if (tabMap[activeTab] !== undefined) {
        navItems[tabMap[activeTab]].classList.add('active');
    }
}

// Load settings
function loadSettings() {
    // Auto-login is always enabled
    settings.autoLogin = true;
    
    const toggles = {
        autoLoginToggle: { checked: true, disabled: true },
        notificationsToggle: { checked: settings.notifications },
        darkModeToggle: { checked: settings.darkMode },
        twoFactorToggle: { checked: settings.twoFactor },
        activityToggle: { checked: settings.activityTracking }
    };
    
    Object.entries(toggles).forEach(([id, config]) => {
        const toggle = document.getElementById(id);
        if (toggle) {
            toggle.checked = config.checked;
            if (config.disabled) {
                toggle.disabled = true;
            }
        }
    });
    
    // Apply dark mode
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// Update setting
function updateSetting(event) {
    const setting = event.target.id.replace('Toggle', '');
    
    // Auto-login cannot be disabled
    if (setting === 'autoLogin' && !event.target.checked) {
        event.target.checked = true;
        showNotification('Avtomatik kirish doimiy yoniq bo\'ladi', 'info');
        return;
    }
    
    settings[setting] = event.target.checked;
    localStorage.setItem('settings', JSON.stringify(settings));
    
    // Apply dark mode immediately
    if (setting === 'darkMode') {
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
    
    // Update user settings if logged in
    if (currentUser) {
        currentUser.settings = { ...settings };
        users[currentUser.phone] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
}

// Show logout modal
function showLogoutModal() {
    document.getElementById('logoutModal').classList.add('active');
}

// Logout
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    
    // Log activity
    if (settings.activityTracking) {
        logActivity('logout', 'Tizimdan chiqildi');
    }
    
    showNotification('Muvaffaqiyatli chiqildi', 'success');
    closeModal('logoutModal');
    showSection('welcomeSection');
}

// Show change password modal
function showChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.add('active');
}

// Change password
function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPasswordChange').value;
    const confirmPassword = document.getElementById('confirmPasswordChange').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Barcha maydonlarni to\'ldiring', 'error');
        return;
    }
    
    if (currentPassword !== currentUser.password) {
        showNotification('Joriy parol noto\'g\'ri', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('Parollar mos kelmadi', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Parol kamida 6 ta belgidan iborat bo\'lishi kerak', 'error');
        return;
    }
    
    // Update password
    currentUser.password = newPassword;
    users[currentUser.phone] = currentUser;
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Log activity
    if (settings.activityTracking) {
        logActivity('change_password', 'Parol o\'zgartirildi');
    }
    
    showNotification('Parol muvaffaqiyatli o\'zgartirildi', 'success');
    closeModal('changePasswordModal');
    
    // Clear form
    document.getElementById('changePasswordForm').reset();
}

// Show login history modal
function showLoginHistoryModal() {
    document.getElementById('loginHistoryModal').classList.add('active');
    
    // Load login history
    const historyList = document.getElementById('loginHistoryList');
    historyList.innerHTML = '';
    
    const history = [
        {
            date: currentUser.lastLogin,
            device: 'Bu qurilma',
            status: 'current'
        },
        {
            date: '2024-01-15 14:30',
            device: 'iPhone 12',
            status: 'closed'
        },
        {
            date: '2024-01-10 09:15',
            device: 'Samsung Galaxy',
            status: 'closed'
        }
    ];
    
    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div>
                <div class="history-date">${item.date}</div>
                <div class="history-device">${item.device}</div>
            </div>
            <span class="history-status ${item.status}">
                ${item.status === 'current' ? 'Joriy' : 'Yopilgan'}
            </span>
        `;
        historyList.appendChild(historyItem);
    });
}

// Export user data
function exportUserData() {
    const data = {
        user: currentUser,
        jobs: jobs.filter(job => job.postedBy === currentUser.phone),
        settings: settings
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user_data_${currentUser.phone}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Ma\'lumotlar yuklab olindi', 'success');
}

// Show delete account modal
function showDeleteAccountModal() {
    document.getElementById('deleteAccountModal').classList.add('active');
}

// Delete account
function deleteAccount() {
    const confirmText = document.getElementById('deleteConfirm').value;
    
    if (confirmText !== 'O\'CHIRISH') {
        showNotification('Tasdiqlash uchun "O\'CHIRISH" deb yozing', 'error');
        return;
    }
    
    // Delete user's jobs
    jobs = jobs.filter(job => job.postedBy !== currentUser.phone);
    localStorage.setItem('jobs', JSON.stringify(jobs));
    
    // Delete user
    delete users[currentUser.phone];
    localStorage.setItem('users', JSON.stringify(users));
    
    // Clear current user
    localStorage.removeItem('currentUser');
    currentUser = null;
    
    showNotification('Akkaunt muvaffaqiyatli o\'chirildi', 'success');
    closeModal('deleteAccountModal');
    showSection('welcomeSection');
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const text = document.getElementById('notificationText');
    
    if (notification && text) {
        text.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Log activity
function logActivity(type, description) {
    if (!currentUser) return;
    
    const activity = {
        type: type,
        description: description,
        timestamp: new Date().toLocaleString('uz-UZ'),
        user: currentUser.phone
    };
    
    const activities = JSON.parse(localStorage.getItem('activities') || '[]');
    activities.unshift(activity);
    
    // Keep only last 100 activities
    if (activities.length > 100) {
        activities.splice(100);
    }
    
    localStorage.setItem('activities', JSON.stringify(activities));
}

// Load sample jobs
function loadSampleJobs() {
    const sampleJobs = [
        {
            id: 1,
            title: 'Sotuvchi',
            company: 'O\'zbekiston Savdo Markazi',
            location: 'Toshkent, Chorsu',
            type: 'full-time',
            salary: '2,000,000 so\'m',
            workers: 3,
            telegram: '@hr_osm',
            phone: '+998 71 123 45 67',
            requirements: 'O\'rta ma\'lumot, tajriba 1 yil',
            description: 'Savdo markazida mahsulotlarni sotish, mijozlar bilan ishlash, hisobot tayyorlash.',
            postedBy: 'system',
            postedAt: '2024-01-20 10:00'
        },
        {
            id: 2,
            title: 'Haydovchi',
            company: 'Express Taxi',
            location: 'Toshkent shahri',
            type: 'full-time',
            salary: '3,500,000 so\'m',
            workers: 5,
            telegram: '@express_taxi',
            phone: '+998 71 234 56 78',
            requirements: 'Haydovchilik guvohnomasi, tajriba 2 yil',
            description: 'Taksi haydovchisi, mijozlarni tashish, avtomobilni tozalash va texnik xizmat ko\'rsatish.',
            postedBy: 'system',
            postedAt: '2024-01-19 15:30'
        },
        {
            id: 3,
            title: 'Oshpaz',
            company: 'Milliy Taomlar Restorani',
            location: 'Toshkent, Yunusobod',
            type: 'full-time',
            salary: '4,000,000 so\'m',
            workers: 2,
            telegram: '@milliy_taomlar',
            phone: '+998 71 345 67 89',
            requirements: 'Oshpazlik tajribasi 3 yil, milliy taomlar',
            description: 'Milliy taomlar tayyorlash, menyu yaratish, oshxonani boshqarish.',
            postedBy: 'system',
            postedAt: '2024-01-18 12:00'
        }
    ];
    
    jobs = sampleJobs;
    localStorage.setItem('jobs', JSON.stringify(jobs));
}

// Utility functions
function getJobTypeText(type) {
    const types = {
        'full-time': 'To\'liq kunlik',
        'part-time': 'Yarim kunlik',
        'remote': 'Uzoqdan',
        'contract': 'Shartnoma asosida'
    };
    return types[type] || type;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// New function to toggle debug panel visibility
function toggleDebugPanel() {
    const debugDiv = document.getElementById('debug');
    if (debugDiv) {
        if (debugDiv.style.display === 'none' || !debugDiv.style.display) {
            debugDiv.style.display = 'block';
            debug('Debug panel shown.');
        } else {
            debugDiv.style.display = 'none';
            console.log('[DEBUG] Debug panel hidden.');
        }
    } else {
        // Create debug panel if it doesn't exist
        const newDebugDiv = createDebugDiv();
        newDebugDiv.style.display = 'block';
        debug('Debug panel created and shown.');
    }
}

// Add debug panel to page
function addDebugPanel() {
    if (!document.getElementById('debug')) {
        const debugDiv = createDebugDiv();
        debugDiv.style.display = 'none'; // Hidden by default
        document.body.appendChild(debugDiv);
        debug('Debug panel added to page');
    }
}

// API functions
async function fetchJobs() {
    try {
        debug('Fetching jobs from API...');
        const response = await fetch('/api/jobs', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors'
        });
        
        debug('API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        debug('API response:', result);
        
        if (result.success) {
            jobs = result.data;
            debug(`Loaded ${jobs.length} jobs from server`);
            return jobs;
        } else {
            console.error('Failed to fetch jobs:', result.message);
            debug('Failed to fetch jobs:', result.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching jobs:', error);
        debug('Error fetching jobs:', error.message);
        
        // Fallback to localStorage if API fails
        const localJobs = JSON.parse(localStorage.getItem('jobs') || '[]');
        debug(`Falling back to localStorage: ${localJobs.length} jobs`);
        jobs = localJobs;
        return localJobs;
    }
}

async function postJob(jobData) {
    try {
        debug('Posting job to API:', jobData);
        const response = await fetch('/api/jobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            body: JSON.stringify(jobData)
        });
        
        debug('Post job response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        debug('Post job response:', result);
        return result;
    } catch (error) {
        console.error('Error posting job:', error);
        debug('Error posting job:', error.message);
        
        // Fallback: save to localStorage if API fails
        const localJobs = JSON.parse(localStorage.getItem('jobs') || '[]');
        const newJob = {
            ...jobData,
            id: Date.now(),
            postedAt: new Date().toLocaleString('uz-UZ')
        };
        localJobs.unshift(newJob);
        localStorage.setItem('jobs', JSON.stringify(localJobs));
        
        debug('Saved job to localStorage as fallback');
        return { success: true, message: 'Ish saqlandi (offline rejim)', data: newJob };
    }
}

async function updateJob(jobId, jobData) {
    try {
        const response = await fetch(`/api/jobs/${jobId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jobData)
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating job:', error);
        return { success: false, message: 'Server xatoligi' };
    }
}

async function deleteJobFromServer(jobId) {
    try {
        const response = await fetch(`/api/jobs/${jobId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting job:', error);
        return { success: false, message: 'Server xatoligi' };
    }
}
