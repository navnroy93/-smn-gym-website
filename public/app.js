/**
 * SMN GYM - Interactive Frontend Logic
 * Features:
 * 1. Custom WhatsApp Modal & Dynamic Routing to Owner (8892152766)
 * 2. User Lead Registration with Backend Excel Sync
 * 3. Interactive Gym Information Bot (SMN Fitness Assistant)
 * 4. Responsive UI & Mobile Navigation
 */

// Owner WhatsApp Number
const OWNER_PHONE = '918892152766';

// ============================================================
// THEME SWITCHER (Light Default + Dark Mode Support)
// ============================================================
function initTheme() {
  const savedTheme = localStorage.getItem('smn_gym_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('smn_gym_theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;
  const icon = btn.querySelector('i');
  if (icon) {
    if (theme === 'dark') {
      icon.className = 'fa-solid fa-sun';
      btn.title = 'Switch to Light Mode';
    } else {
      icon.className = 'fa-solid fa-moon';
      btn.title = 'Switch to Dark Mode';
    }
  }
}

initTheme();

// ============================================================
// 1. MOBILE NAVIGATION
// ============================================================
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');

if (mobileMenuBtn && navLinks) {
  mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const icon = mobileMenuBtn.querySelector('i');
    if (navLinks.classList.contains('active')) {
      icon.classList.remove('fa-bars');
      icon.classList.add('fa-xmark');
    } else {
      icon.classList.remove('fa-xmark');
      icon.classList.add('fa-bars');
    }
  });

  // Close mobile nav when clicking any link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars');
      }
    });
  });
}

// ============================================================
// 2. WHATSAPP CHAT MODAL (EXACT REQUIREMENT)
// ============================================================
const waModal = document.getElementById('waModal');
const waMessageText = document.getElementById('waMessageText');
const waCharCount = document.getElementById('waCharCount');

function openWhatsAppModal(presetMessage = '') {
  if (!waModal) return;
  waModal.style.display = 'flex';
  
  if (presetMessage) {
    waMessageText.value = presetMessage;
  } else if (!waMessageText.value.trim()) {
    waMessageText.value = 'Hello! I am interested in joining SMN GYM. Please share membership details.';
  }

  handleWAMessageInput(waMessageText);
  waMessageText.focus();
}

function closeWhatsAppModal() {
  if (waModal) {
    waModal.style.display = 'none';
  }
}

// Close modal when clicking outside dialog
if (waModal) {
  waModal.addEventListener('click', (e) => {
    if (e.target === waModal) {
      closeWhatsAppModal();
    }
  });
}

function handleWAMessageInput(textarea) {
  if (!textarea) return;
  let text = textarea.value;
  if (text.length > 1000) {
    textarea.value = text.substring(0, 1000);
    text = textarea.value;
  }
  if (waCharCount) {
    waCharCount.textContent = `${text.length} / 1000`;
  }
}

function setWAMessage(message) {
  if (!waMessageText) return;
  waMessageText.value = message;
  handleWAMessageInput(waMessageText);
  waMessageText.focus();
}

function sendWhatsAppMessage() {
  const message = waMessageText.value.trim();
  if (!message) {
    alert('Please enter a message before sending.');
    waMessageText.focus();
    return;
  }

  const encodedMsg = encodeURIComponent(message);
  
  // Detect if user is on mobile or desktop
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  let targetUrl = '';
  if (isMobile) {
    // Directly launch WhatsApp Mobile App
    targetUrl = `https://api.whatsapp.com/send?phone=${OWNER_PHONE}&text=${encodedMsg}`;
  } else {
    // Open WhatsApp Web on Desktop / Laptop
    targetUrl = `https://web.whatsapp.com/send?phone=${OWNER_PHONE}&text=${encodedMsg}`;
  }

  // Open in new window/tab
  window.open(targetUrl, '_blank');
  closeWhatsAppModal();
}

// Plan Selection helper from cards
function selectPlan(planName) {
  const planSelect = document.getElementById('preferredPlan');
  const registerSection = document.getElementById('register');
  
  if (planSelect) {
    planSelect.value = planName;
  }
  
  if (registerSection) {
    registerSection.scrollIntoView({ behavior: 'smooth' });
    const nameInput = document.getElementById('fullName');
    if (nameInput) {
      setTimeout(() => nameInput.focus(), 600);
    }
  }
}

// ============================================================
// 3. USER REGISTRATION & BACKEND EXCEL SYNC
// ============================================================
async function handleRegistration(event) {
  event.preventDefault();

  const nameInput = document.getElementById('fullName');
  const phoneInput = document.getElementById('mobileNo');
  const emailInput = document.getElementById('emailAddr');
  const goalSelect = document.getElementById('fitnessGoal');
  const planSelect = document.getElementById('preferredPlan');
  
  const submitBtn = document.getElementById('registerSubmitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const spinner = submitBtn.querySelector('.spinner');
  const statusDiv = document.getElementById('formStatus');

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const email = emailInput.value.trim();
  const goal = goalSelect.value;
  const plan = planSelect.value;

  // Validation
  if (!name) {
    showFormStatus('Please enter your full name.', 'error');
    nameInput.focus();
    return;
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length < 10) {
    showFormStatus('Please enter a valid 10-digit mobile number.', 'error');
    phoneInput.focus();
    return;
  }

  // Show loading state
  submitBtn.disabled = true;
  btnText.style.display = 'none';
  spinner.style.display = 'inline-block';
  statusDiv.style.display = 'none';

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        phone: cleanPhone,
        email,
        goal,
        plan
      })
    });

    const result = await response.json();

    if (result.success) {
      showFormStatus(`
        <strong>🎉 Registration Received!</strong><br>
        Thank you <strong>${name}</strong>. Your membership request has been submitted successfully!<br>
        Our gym desk will contact you at <strong>${cleanPhone}</strong> for your free trial session.<br>
        <div style="margin-top:10px;">
          <button type="button" class="btn btn-sm btn-whatsapp" onclick="openWhatsAppModal('Hi, I just registered on your website! Name: ${name}, Phone: ${cleanPhone}, Plan: ${plan}')">
            <i class="fa-brands fa-whatsapp"></i> Chat with Owner on WhatsApp Now
          </button>
        </div>
      `, 'success');

      // Reset form fields
      nameInput.value = '';
      phoneInput.value = '';
      emailInput.value = '';
    } else {
      showFormStatus(`Registration error: ${result.message || 'Please try again.'}`, 'error');
    }
  } catch (error) {
    console.error('Registration fetch error:', error);
    showFormStatus(`
      Unable to reach server. You can directly WhatsApp your registration to the owner: 
      <a href="javascript:void(0)" onclick="openWhatsAppModal('Hi, I want to register at SMN Gym. Name: ${name}, Phone: ${cleanPhone}')" style="color:#25d366; text-decoration:underline; font-weight:bold;">
        Click here to Send via WhatsApp
      </a>
    `, 'error');
  } finally {
    submitBtn.disabled = false;
    btnText.style.display = 'inline-block';
    spinner.style.display = 'none';
  }
}

function showFormStatus(htmlMessage, type = 'success') {
  const statusDiv = document.getElementById('formStatus');
  if (!statusDiv) return;
  statusDiv.className = `form-status ${type}`;
  statusDiv.innerHTML = htmlMessage;
  statusDiv.style.display = 'block';
  statusDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================================
// 4. SMART GYM INFORMATION BOT (SMN GYM ASSISTANT)
// ============================================================
const botWindow = document.getElementById('botWindow');
const botMessages = document.getElementById('botMessages');
const botInput = document.getElementById('botInput');

function toggleGymBot() {
  if (!botWindow) return;
  const isHidden = botWindow.style.display === 'none' || botWindow.style.display === '';
  botWindow.style.display = isHidden ? 'flex' : 'none';
  if (isHidden && botInput) {
    setTimeout(() => botInput.focus(), 200);
  }
}

function openGymBot() {
  if (!botWindow) return;
  botWindow.style.display = 'flex';
  if (botInput) {
    setTimeout(() => botInput.focus(), 200);
  }
}

function askBotQuestion(question) {
  if (!botWindow || botWindow.style.display === 'none') {
    openGymBot();
  }
  addBotMessage(question, 'outgoing');
  processBotReply(question);
}

function handleBotSubmit(event) {
  event.preventDefault();
  if (!botInput) return;
  const question = botInput.value.trim();
  if (!question) return;

  addBotMessage(question, 'outgoing');
  botInput.value = '';
  processBotReply(question);
}

function addBotMessage(text, direction = 'incoming') {
  if (!botMessages) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `bot-msg ${direction}`;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  msgDiv.innerHTML = `
    <div class="bot-bubble">${text}</div>
    <span class="msg-time">${timeStr}</span>
  `;

  botMessages.appendChild(msgDiv);
  botMessages.scrollTop = botMessages.scrollHeight;
}

// Knowledge Base Engine for SMN GYM
function processBotReply(userQuery) {
  const q = userQuery.toLowerCase();
  let reply = '';

  // Show brief typing simulation
  const typingDiv = document.createElement('div');
  typingDiv.className = 'bot-msg incoming';
  typingDiv.id = 'botTyping';
  typingDiv.innerHTML = `
    <div class="bot-bubble" style="color: #94a3b8; font-style: italic;">
      <i class="fa-solid fa-spinner fa-spin"></i> SMN Gym Bot is typing...
    </div>
  `;
  botMessages.appendChild(typingDiv);
  botMessages.scrollTop = botMessages.scrollHeight;

  setTimeout(() => {
    // Remove typing bubble
    const typingElem = document.getElementById('botTyping');
    if (typingElem) typingElem.remove();

    // 1. Timings & Hours
    if (q.includes('time') || q.includes('timing') || q.includes('hour') || q.includes('open') || q.includes('sunday') || q.includes('batch')) {
      reply = `
        <strong>⏰ SMN GYM Timings:</strong><br><br>
        • <strong>Mon – Sat (Morning):</strong> 05:30 AM – 10:30 AM<br>
        • <strong>Mon – Sat (Evening):</strong> 04:30 PM – 10:00 PM<br>
        • <strong>Sunday Session:</strong> 06:00 AM – 12:00 PM<br><br>
        You can work out during either batch as per your convenience!
      `;
    }
    // 2. Fees, Pricing & Membership
    else if (q.includes('fee') || q.includes('cost') || q.includes('price') || q.includes('plan') || q.includes('charge') || q.includes('rate') || q.includes('month')) {
      reply = `
        <strong>💳 Membership Packages at SMN GYM:</strong><br><br>
        • <strong>1 Month Standard:</strong> ₹1,000<br>
        • <strong>3 Months Transformation:</strong> ₹2,500 <em>(Most Popular! Save ₹500)</em><br>
        • <strong>12 Months Annual VIP:</strong> ₹8,000<br>
        • <strong>Personal Coaching (1-on-1):</strong> Custom packages available.<br><br>
        All packages include full cardio & strength floor access!<br>
        <button class="btn btn-sm btn-whatsapp" style="margin-top:6px;" onclick="openWhatsAppModal('Hi! I want to confirm membership fees and discounts at SMN Gym.')">
          <i class="fa-brands fa-whatsapp"></i> Chat with Owner for Offers
        </button>
      `;
    }
    // 3. Equipment & Machines
    else if (q.includes('equipment') || q.includes('machine') || q.includes('cardio') || q.includes('treadmill') || q.includes('weight') || q.includes('dumbbell') || q.includes('squat')) {
      reply = `
        <strong>🏋️ State-of-the-Art Equipment at SMN GYM:</strong><br><br>
        • <strong>Cardio Decks:</strong> Commercial treadmills, spin cycles, ellipticals.<br>
        • <strong>Heavy Strength:</strong> 45° Leg press, hack squat, power squat racks, chest press.<br>
        • <strong>Cable Stations:</strong> Multi-functional dual cable crossover, lat pulldown, seated rows.<br>
        • <strong>Free Weights:</strong> Olympic barbells, flat/incline benches, dumbbell pairs from 2.5kg to 40kg+.<br>
        • <strong>Flooring:</strong> Clean wooden finish with rubberized shock zones.
      `;
    }
    // 4. Personal Training
    else if (q.includes('personal') || q.includes('trainer') || q.includes('coach') || q.includes('pt') || q.includes('guidance')) {
      reply = `
        <strong>💪 Personal Coaching (PT) at SMN GYM:</strong><br><br>
        Yes! We offer 1-on-1 certified personal training for:<br>
        • Accelerated fat loss & belly reduction<br>
        • Muscle building & strength hypertrophy<br>
        • Injury-safe posture and form correction<br>
        • Customized weekly nutrition and macro plans.<br><br>
        <button class="btn btn-sm btn-whatsapp" onclick="openWhatsAppModal('Hi, I am interested in personal training packages at SMN Gym.')">
          <i class="fa-brands fa-whatsapp"></i> Inquire about PT with Owner
        </button>
      `;
    }
    // 5. Free Trial & Visit
    else if (q.includes('trial') || q.includes('free') || q.includes('visit') || q.includes('see') || q.includes('demo')) {
      reply = `
        <strong>🎟️ Free 1-Day Trial Pass:</strong><br><br>
        You are warmly invited to visit SMN GYM! You can check our facilities, try the equipment, and consult with our trainer with zero obligation.<br><br>
        Fill out the <a href="#register" style="color:#ffb703; text-decoration:underline;">Registration Form</a> on this page or WhatsApp owner directly at <strong>+91 8892152766</strong>!
      `;
    }
    // 6. Contact & Owner & Phone & WhatsApp
    else if (q.includes('contact') || q.includes('number') || q.includes('phone') || q.includes('whatsapp') || q.includes('owner') || q.includes('call')) {
      reply = `
        <strong>📞 Contact SMN GYM:</strong><br><br>
        • <strong>Owner Direct Phone:</strong> <a href="tel:8892152766" style="color:#ffb703;">+91 8892152766</a><br>
        • <strong>WhatsApp:</strong> Direct 1-click messaging available on the screen.<br><br>
        <button class="btn btn-sm btn-whatsapp" onclick="openWhatsAppModal()">
          <i class="fa-brands fa-whatsapp"></i> Send WhatsApp Message Now
        </button>
      `;
    }
    // 7. Diet & Nutrition & Weight loss tips
    else if (q.includes('diet') || q.includes('food') || q.includes('nutrition') || q.includes('weight loss') || q.includes('belly') || q.includes('protein')) {
      reply = `
        <strong>🥗 Nutrition & Transformation Guidance:</strong><br><br>
        At SMN GYM, we help you master the fundamentals:<br>
        1. <strong>Protein Intake:</strong> 1.5g - 2g of protein per kg bodyweight (eggs, chicken, paneer, whey).<br>
        2. <strong>Calorie Balance:</strong> Mild deficit for fat loss, surplus for muscle growth.<br>
        3. <strong>Hydration:</strong> 3–4 liters of water daily.<br><br>
        Our trainers provide specific customized meal templates with every membership!
      `;
    }
    // 8. General Greetings
    else if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q.includes('namaste')) {
      reply = `
        Hello there! 💪 Welcome to <strong>SMN GYM</strong>.<br><br>
        How can I help you today? You can ask about our <strong>timings, membership prices, cardio/weight equipment, or personal training</strong>!
      `;
    }
    // Fallback Default
    else {
      reply = `
        Thank you for asking! For specific details on <em>"${userQuery}"</em>, our owner is available directly on WhatsApp at <strong>+91 8892152766</strong>.<br><br>
        <button class="btn btn-sm btn-whatsapp" onclick="openWhatsAppModal('Hi! I have a question regarding SMN Gym: ${userQuery.replace(/'/g, "\\'")}')">
          <i class="fa-brands fa-whatsapp"></i> Chat with Owner on WhatsApp
        </button>
      `;
    }

    addBotMessage(reply, 'incoming');
  }, 350);
}

// Initial console log
console.log('SMN GYM Web App Initialized. Owner WhatsApp connected to 8892152766.');

// ============================================================
// 5. WORKOUT VIDEOS & SEQUENTIAL PLAYLIST SYSTEM
// ============================================================
let gymVideos = [];
let currentVideoIdx = 0;

const gymVideoPlayer = document.getElementById('gymVideoPlayer');
const videoWrapper = document.querySelector('.video-screen-card');
const playPauseBtn = document.getElementById('playPauseBtn');
const centerPlayBtn = document.getElementById('centerPlayBtn');
const videoProgressBar = document.getElementById('videoProgressBar');
const videoTimeDisplay = document.getElementById('videoTimeDisplay');
const currentVideoTitle = document.getElementById('currentVideoTitle');
const currentVideoDesc = document.getElementById('currentVideoDesc');
const videoCategoryBadge = document.getElementById('videoCategoryBadge');
const sequenceBadge = document.getElementById('sequenceBadge');
const currentVideoDate = document.getElementById('currentVideoDate');
const playlistItemsList = document.getElementById('playlistItemsList');
const playlistCount = document.getElementById('playlistCount');
const volumeMuteBtn = document.getElementById('volumeMuteBtn');
const volumeSlider = document.getElementById('volumeSlider');

// Fetch Playlist on page load
async function fetchGymVideos() {
  try {
    const res = await fetch('/api/videos');
    const data = await res.json();
    if (data.success && data.videos && data.videos.length > 0) {
      gymVideos = data.videos;
      renderPlaylist();
      loadVideo(0, false);
    }
  } catch (err) {
    console.error('Failed to load videos:', err);
  }
}

// Render playlist drawer
function renderPlaylist() {
  if (!playlistItemsList) return;
  playlistItemsList.innerHTML = '';
  if (playlistCount) {
    playlistCount.textContent = `${gymVideos.length} Video${gymVideos.length > 1 ? 's' : ''}`;
  }

  gymVideos.forEach((vid, index) => {
    const item = document.createElement('div');
    item.className = `playlist-item ${index === currentVideoIdx ? 'active' : ''}`;
    item.onclick = (e) => {
      // Ignore click if clicking delete
      if (e.target.closest('.playlist-delete-btn')) return;
      currentVideoIdx = index;
      loadVideo(currentVideoIdx, true);
    };

    const isUploaded = !vid.isDefault;

    item.innerHTML = `
      <div class="playlist-thumb-wrap">
        <img src="${vid.thumbnail || 'assets/gym_interior_1.jpg'}" alt="${vid.title}" class="playlist-thumb">
        <div class="playlist-play-icon">
          <i class="fa-solid ${index === currentVideoIdx ? 'fa-chart-simple' : 'fa-play'}"></i>
        </div>
      </div>
      <div class="playlist-info">
        <h5>${vid.title}</h5>
        <span>${vid.category || 'Workout'} • ${vid.uploadedAt || 'Workout'}</span>
      </div>
      ${isUploaded ? `
        <button class="playlist-delete-btn" onclick="deleteVideo('${vid.id}')" title="Delete Uploaded Video">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      ` : ''}
    `;

    playlistItemsList.appendChild(item);
  });
}

// Load Video by Index
function loadVideo(index, autoPlay = false) {
  if (!gymVideos || gymVideos.length === 0) return;
  if (!gymVideoPlayer) return;

  currentVideoIdx = (index + gymVideos.length) % gymVideos.length;
  const vid = gymVideos[currentVideoIdx];

  gymVideoPlayer.src = vid.src;
  gymVideoPlayer.load();

  if (currentVideoTitle) currentVideoTitle.textContent = vid.title;
  if (currentVideoDesc) currentVideoDesc.textContent = vid.description || '';
  if (videoCategoryBadge) videoCategoryBadge.textContent = vid.category || 'Workout Session';
  if (sequenceBadge) sequenceBadge.innerHTML = `<i class="fa-solid fa-repeat"></i> Auto-Sequence: Video ${currentVideoIdx + 1} of ${gymVideos.length}`;
  if (currentVideoDate) currentVideoDate.textContent = vid.uploadedAt || 'SMN Training';

  // Update playlist active item
  if (playlistItemsList) {
    const items = playlistItemsList.querySelectorAll('.playlist-item');
    items.forEach((el, idx) => {
      if (idx === currentVideoIdx) {
        el.classList.add('active');
        el.querySelector('.playlist-play-icon i').className = 'fa-solid fa-chart-simple';
      } else {
        el.classList.remove('active');
        el.querySelector('.playlist-play-icon i').className = 'fa-solid fa-play';
      }
    });
  }

  if (autoPlay) {
    gymVideoPlayer.play().then(() => {
      updatePlayState(true);
    }).catch(err => {
      console.warn('AutoPlay prevented by browser:', err);
      updatePlayState(false);
    });
  } else {
    updatePlayState(false);
  }
}

// Play / Pause Toggle
function togglePlayPause() {
  if (!gymVideoPlayer) return;
  if (gymVideoPlayer.paused || gymVideoPlayer.ended) {
    gymVideoPlayer.play();
    updatePlayState(true);
  } else {
    gymVideoPlayer.pause();
    updatePlayState(false);
  }
}

function updatePlayState(isPlaying) {
  if (playPauseBtn) {
    playPauseBtn.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    playPauseBtn.title = isPlaying ? 'Pause Video' : 'Play Video';
  }
  if (videoWrapper) {
    if (isPlaying) {
      videoWrapper.classList.add('is-playing');
    } else {
      videoWrapper.classList.remove('is-playing');
    }
  }
}

// Continuous Sequential Playback: Auto-advance to next video when current video ends!
if (gymVideoPlayer) {
  gymVideoPlayer.addEventListener('ended', () => {
    console.log('[SEQUENCE] Video ended, auto-advancing to next workout video...');
    nextVideo(true);
  });

  gymVideoPlayer.addEventListener('play', () => updatePlayState(true));
  gymVideoPlayer.addEventListener('pause', () => updatePlayState(false));

  gymVideoPlayer.addEventListener('timeupdate', () => {
    if (!gymVideoPlayer.duration) return;
    const progress = (gymVideoPlayer.currentTime / gymVideoPlayer.duration) * 100;
    if (videoProgressBar) {
      videoProgressBar.style.width = `${progress}%`;
    }
    if (videoTimeDisplay) {
      videoTimeDisplay.textContent = `${formatTime(gymVideoPlayer.currentTime)} / ${formatTime(gymVideoPlayer.duration)}`;
    }
  });

  // Toggle play/pause by clicking directly on video screen
  gymVideoPlayer.addEventListener('click', togglePlayPause);
}

// Previous & Next Video
function prevVideo(autoPlay = true) {
  loadVideo(currentVideoIdx - 1, autoPlay);
}

function nextVideo(autoPlay = true) {
  loadVideo(currentVideoIdx + 1, autoPlay);
}

// Seek video timeline
function seekVideo(event) {
  const container = document.getElementById('videoProgressContainer');
  if (!container || !gymVideoPlayer || !gymVideoPlayer.duration) return;
  const rect = container.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const percent = Math.max(0, Math.min(1, clickX / rect.width));
  gymVideoPlayer.currentTime = percent * gymVideoPlayer.duration;
}

// Volume & Mute
function changeVolume(val) {
  if (!gymVideoPlayer) return;
  gymVideoPlayer.volume = parseFloat(val);
  gymVideoPlayer.muted = (parseFloat(val) === 0);
  updateVolumeIcon();
}

function toggleMute() {
  if (!gymVideoPlayer) return;
  gymVideoPlayer.muted = !gymVideoPlayer.muted;
  if (!gymVideoPlayer.muted && gymVideoPlayer.volume === 0) {
    gymVideoPlayer.volume = 0.5;
    if (volumeSlider) volumeSlider.value = 0.5;
  }
  updateVolumeIcon();
}

function updateVolumeIcon() {
  if (!volumeMuteBtn || !gymVideoPlayer) return;
  const icon = volumeMuteBtn.querySelector('i');
  if (gymVideoPlayer.muted || gymVideoPlayer.volume === 0) {
    icon.className = 'fa-solid fa-volume-xmark';
  } else if (gymVideoPlayer.volume < 0.5) {
    icon.className = 'fa-solid fa-volume-low';
  } else {
    icon.className = 'fa-solid fa-volume-high';
  }
}

// Fullscreen Toggle
function toggleFullscreen() {
  if (!gymVideoPlayer) return;
  if (!document.fullscreenElement) {
    if (gymVideoPlayer.requestFullscreen) {
      gymVideoPlayer.requestFullscreen();
    } else if (gymVideoPlayer.webkitRequestFullscreen) {
      gymVideoPlayer.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// ============================================================
// OWNER VIDEO UPLOAD MODAL & API (RESTRICTED TO OWNER)
// ============================================================
const uploadModal = document.getElementById('uploadModal');
const ownerUploadForm = document.getElementById('ownerUploadForm');
const uploadStatusBanner = document.getElementById('uploadStatusBanner');
const uploadSubmitBtn = document.getElementById('uploadSubmitBtn');

function openUploadModal() {
  if (!uploadModal) return;
  uploadModal.style.display = 'flex';
  if (uploadStatusBanner) uploadStatusBanner.style.display = 'none';
  const pinInput = document.getElementById('ownerPinInput');
  if (pinInput) {
    pinInput.value = '';
    setTimeout(() => pinInput.focus(), 200);
  }
}

function closeUploadModal() {
  if (!uploadModal) return;
  uploadModal.style.display = 'none';
  if (ownerUploadForm) ownerUploadForm.reset();
  if (uploadStatusBanner) uploadStatusBanner.style.display = 'none';
}

if (uploadModal) {
  uploadModal.addEventListener('click', (e) => {
    if (e.target === uploadModal) {
      closeUploadModal();
    }
  });
}

async function handleVideoUpload(event) {
  event.preventDefault();

  const pin = document.getElementById('ownerPinInput').value.trim();
  const title = document.getElementById('videoTitleInput').value.trim();
  const category = document.getElementById('videoCategorySelect').value;
  const description = document.getElementById('videoDescInput').value.trim();
  const fileInput = document.getElementById('videoFileInput');

  if (!fileInput.files || fileInput.files.length === 0) {
    showUploadStatus('Please choose a video file (.mp4, .webm, .mov) to upload.', 'error');
    return;
  }

  const file = fileInput.files[0];

  // Prepare FormData
  const formData = new FormData();
  formData.append('ownerPin', pin);
  formData.append('title', title);
  formData.append('category', category);
  formData.append('description', description);
  formData.append('videoFile', file);

  // Set loading state
  const btnText = uploadSubmitBtn.querySelector('.btn-text');
  const spinner = uploadSubmitBtn.querySelector('.spinner');
  uploadSubmitBtn.disabled = true;
  btnText.style.display = 'none';
  spinner.style.display = 'inline-block';
  showUploadStatus('Uploading video to SMN Gym server... Please wait.', 'success');

  try {
    const response = await fetch('/api/upload-video', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      showUploadStatus(`
        <strong>✅ Video Uploaded Successfully!</strong><br>
        "${title}" has been added to your workout sequence.
      `, 'success');

      // Refresh playlist
      gymVideos = result.videos || gymVideos;
      renderPlaylist();

      // Play the newly uploaded video
      currentVideoIdx = 0;
      loadVideo(0, true);

      setTimeout(() => {
        closeUploadModal();
      }, 1400);
    } else {
      showUploadStatus(result.message || 'Upload failed. Please check your PIN.', 'error');
    }
  } catch (error) {
    console.error('Video upload error:', error);
    showUploadStatus('Server error during video upload. Please check file size or network connection.', 'error');
  } finally {
    uploadSubmitBtn.disabled = false;
    btnText.style.display = 'inline-block';
    spinner.style.display = 'none';
  }
}

function showUploadStatus(msg, type = 'error') {
  if (!uploadStatusBanner) return;
  uploadStatusBanner.className = `form-status ${type}`;
  uploadStatusBanner.innerHTML = msg;
  uploadStatusBanner.style.display = 'block';
}

// Delete video function for owner
async function deleteVideo(videoId) {
  const pin = prompt('Owner Action: Enter Owner Security PIN to delete this video:');
  if (!pin) return;

  try {
    const res = await fetch(`/api/videos/${videoId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerPin: pin })
    });
    const data = await res.json();
    if (data.success) {
      alert('Video removed from sequence.');
      gymVideos = data.videos;
      renderPlaylist();
      loadVideo(0, true);
    } else {
      alert(data.message || 'Failed to delete video.');
    }
  } catch (err) {
    console.error('Delete error:', err);
    alert('Error deleting video.');
  }
}

// Initialize video playlist on start
fetchGymVideos();

// ============================================================
// ANIMATED BROWSER TAB FAVICON (CHROME COMPATIBLE WORKOUT MOTION)
// ============================================================
function initAnimatedFavicon() {
  try {
    // Remove static icon tags to ensure Chrome updates smoothly
    document.querySelectorAll("link[rel*='icon']").forEach(el => {
      if (el.id !== 'dynamicFavicon') {
        el.remove();
      }
    });

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;

    function renderFrame() {
      frame = (frame + 1) % 40;
      const progress = frame / 40;
      
      // Pronounced lifting reps & tilt motion
      const yLift = -Math.sin(progress * Math.PI * 2) * 3.5; // -3.5px lift
      const angleDeg = Math.sin(progress * Math.PI * 2) * 28; // ±28 degree curl

      ctx.clearRect(0, 0, 32, 32);

      // Rounded vibrant gradient badge background
      const r = 8;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(32 - r, 0);
      ctx.quadraticCurveTo(32, 0, 32, r);
      ctx.lineTo(32, 32 - r);
      ctx.quadraticCurveTo(32, 32, 32 - r, 32);
      ctx.lineTo(r, 32);
      ctx.quadraticCurveTo(0, 32, 0, 32 - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 0, 32, 32);
      grad.addColorStop(0, '#f59e0b');
      grad.addColorStop(1, '#ea580c');
      ctx.fillStyle = grad;
      ctx.fill();

      // Draw dumbbell in center with lift and curl motion
      ctx.save();
      ctx.translate(16, 16 + yLift);
      ctx.rotate((angleDeg * Math.PI) / 180);

      ctx.fillStyle = '#ffffff';

      // Barbell shaft
      ctx.fillRect(-8, -2, 16, 4);

      // Left inner & outer weights
      ctx.fillRect(-10, -5, 2.5, 10);
      ctx.fillRect(-13.5, -7, 2.5, 14);

      // Right inner & outer weights
      ctx.fillRect(7.5, -5, 2.5, 10);
      ctx.fillRect(11, -7, 2.5, 14);

      ctx.restore();

      // Chrome requires replacing the link node to repaint the tab icon
      const dataUri = canvas.toDataURL('image/png');
      const oldLink = document.getElementById('dynamicFavicon');
      const newLink = document.createElement('link');
      newLink.id = 'dynamicFavicon';
      newLink.rel = 'icon';
      newLink.type = 'image/png';
      newLink.href = dataUri;

      if (oldLink && oldLink.parentNode) {
        oldLink.parentNode.replaceChild(newLink, oldLink);
      } else {
        document.head.appendChild(newLink);
      }
    }

    // Run animation cycle every 120ms (approx 8.3 fps, ideal for browser tab repaints)
    setInterval(renderFrame, 120);
    renderFrame();
  } catch (err) {
    console.warn('Animated favicon not supported:', err);
  }
}

if (document.readyState === 'complete') {
  initAnimatedFavicon();
} else {
  window.addEventListener('load', initAnimatedFavicon);
}

