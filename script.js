// Show/Hide Form
const showFormBtn = document.getElementById('showFormBtn');
const addAssignmentForm = document.getElementById('addAssignmentForm');

// Enable audio playback on mobile by allowing user interaction first
let audioEnabled = false;
document.addEventListener('click', () => {
  if (!audioEnabled) {
    const audio = document.getElementById('alarmSound');
    if (audio) {
      // Create a silent audio playback to unlock audio on mobile
      audio.play().catch(() => {});
      audio.pause();
      audioEnabled = true;
    }
  }
});

showFormBtn.addEventListener('click', () => {
  addAssignmentForm.classList.toggle('hidden');
  // Set minimum date to today
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
  document.getElementById('assignmentDeadline').min = minDateTime;
});

// Add Assignment Logic
const addAssignmentBtn = document.getElementById('addAssignmentBtn');
const assignmentTableBody = document.querySelector('#assignmentTable tbody');

// Create alarm audio element (CHANGED FROM const TO let to prevent reassignment errors)
let alarmSound = document.getElementById('alarmSound'); 

// manual stop flag used to prevent auto-replay after user stops it
let alarmStoppedManually = false;
// keep a timeout id for a playing alarm so we can cancel it
let currentAlarmTimeout = null;

// Stop alarm button
const stopAlarmBtn = document.getElementById('stopAlarmBtn');

// hide stop button if table empty (page load or reload)
if (stopAlarmBtn && assignmentTableBody && assignmentTableBody.children.length === 0) {
  stopAlarmBtn.classList.add('hidden');
}

// ensure button starts hidden and add click listener
if (stopAlarmBtn) {
  stopAlarmBtn.classList.add('hidden');
  stopAlarmBtn.addEventListener('click', () => {
    if (alarmSound) {
      alarmSound.pause();
      alarmSound.currentTime = 0;
      alarmSound.loop = false;
    }
    if (currentAlarmTimeout) {
      clearTimeout(currentAlarmTimeout);
      currentAlarmTimeout = null;
    }
    alarmStoppedManually = true; // remember user stopped it
    stopAlarmBtn.classList.add('hidden');
  });
}

// Helper function to play the alarm for a fixed duration (30s)
function triggerAlarm() {
  if (!alarmSound) return;
  // if already playing, ignore
  if (!alarmSound.paused) return;
  
  // don't use loop; instead, restart on end until timeout
  alarmSound.loop = false;
  alarmSound.play().catch(e => console.log('Audio play failed:', e));
  
  // clear any existing timeout
  if (currentAlarmTimeout) {
    clearTimeout(currentAlarmTimeout);
    currentAlarmTimeout = null;
  }
  
  // function to restart audio if still within 30s
  const restartIfNeeded = () => {
    if (currentAlarmTimeout) { // still active
      alarmSound.currentTime = 0;
      alarmSound.play().catch(e => console.log('Audio play failed:', e));
    }
  };
  
  // listen for end and restart
  alarmSound.addEventListener('ended', restartIfNeeded);
  
  currentAlarmTimeout = setTimeout(() => {
    if (alarmSound) {
      alarmSound.pause();
      alarmSound.currentTime = 0;
      // remove the listener
      alarmSound.removeEventListener('ended', restartIfNeeded);
    }
    if (stopAlarmBtn) {
      stopAlarmBtn.classList.add('hidden');
    }
    currentAlarmTimeout = null;
  }, 30000); // stop after 30 seconds
}

// Helper function to update countdown with alarm
function updateCountdown(deadline, row, countdownCell) {
  // Track which alarms have been triggered for this countdown
  let alarmAt5Min = false;
  let alarmAt3Min = false;
  let alarmAt30Sec = false;
  
  const interval = setInterval(() => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;

    if (diff <= 0) {
      countdownCell.textContent = "Deadline Passed";
      countdownCell.style.color = "var(--danger)";
      clearInterval(interval);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    // Beautiful time formatting 
    countdownCell.textContent = 
      (days > 0 ? `${days}d ` : '') + 
      `${String(hours).padStart(2, '0')}h ` + 
      `${String(minutes).padStart(2, '0')}m ` + 
      `${String(seconds).padStart(2, '0')}s`;

    // Ignore alarms if user manually stopped them
    if (alarmStoppedManually) {
      if (alarmSound) {
        alarmSound.pause();
        alarmSound.currentTime = 0;
      }
      if (currentAlarmTimeout) {
        clearTimeout(currentAlarmTimeout);
        currentAlarmTimeout = null;
      }
      return;
    }

    // Reset flags if we go back above 5 minutes (all alarms reset)
    if (days > 0 || hours > 0 || minutes > 5) {
      if (alarmSound) {
        if (!alarmSound.paused) {
          alarmSound.pause();
          alarmSound.currentTime = 0;
        }
        alarmSound.loop = false;
        // remove any 'ended' listeners by cloning the element
        const newAudio = alarmSound.cloneNode(true);
        alarmSound.parentNode.replaceChild(newAudio, alarmSound);
        // update reference properly since it's a let variable now
        alarmSound = newAudio;
      }
      if (currentAlarmTimeout) {
        clearTimeout(currentAlarmTimeout);
        currentAlarmTimeout = null;
      }
      if (stopAlarmBtn) {
        stopAlarmBtn.classList.add('hidden');
      }
      alarmAt5Min = false;
      alarmAt3Min = false;
      alarmAt30Sec = false;
      return;
    }

    // Calculate total seconds remaining
    const totalSecondsRemaining = (days * 24 * 60 * 60) + (hours * 60 * 60) + (minutes * 60) + seconds;

    // ALARM 1: Beep at 5 minutes (when time is between 300-290 seconds)
    if (totalSecondsRemaining <= 300 && totalSecondsRemaining > 290) {
      if (!alarmAt5Min) {
        triggerAlarm();
        alarmAt5Min = true;
      }
      if (stopAlarmBtn) stopAlarmBtn.classList.remove('hidden');
    }
    // SILENT PERIOD: After 5 min alarm until before 3 min alarm
    else if (totalSecondsRemaining <= 289 && totalSecondsRemaining > 180) {
      if (!currentAlarmTimeout) {
        if (alarmSound && !alarmSound.paused) {
          alarmSound.pause();
          alarmSound.currentTime = 0;
        }
        if (stopAlarmBtn) stopAlarmBtn.classList.add('hidden');
      }
    }
    // ALARM 2: Beep at 3 minutes (when time is between 180-170 seconds)
    else if (totalSecondsRemaining <= 180 && totalSecondsRemaining > 170) {
      if (!alarmAt3Min) {
        triggerAlarm();
        alarmAt3Min = true;
      }
      if (stopAlarmBtn) stopAlarmBtn.classList.remove('hidden');
    }
    // SILENT PERIOD: Between after 3 min alarm and final 30 seconds
    else if (totalSecondsRemaining <= 169 && totalSecondsRemaining > 30) {
      if (!currentAlarmTimeout) {
        if (alarmSound && !alarmSound.paused) {
          alarmSound.pause();
          alarmSound.currentTime = 0;
        }
        if (stopAlarmBtn) stopAlarmBtn.classList.add('hidden');
      }
    }
    // ALARM 3: Beep at final 30 seconds (0-30)
    else if (totalSecondsRemaining <= 30 && totalSecondsRemaining > 0) {
      if (!alarmAt30Sec) {
        triggerAlarm();
        alarmAt30Sec = true;
      }
      if (stopAlarmBtn) stopAlarmBtn.classList.remove('hidden');
      countdownCell.style.color = "var(--danger)"; // Turn text red in last 30 seconds
    }
    // Stop all alarms when deadline passes
    else if (diff <= 0) {
      if (alarmSound) {
        alarmSound.pause();
        alarmSound.currentTime = 0;
      }
      if (stopAlarmBtn) stopAlarmBtn.classList.add('hidden');
    }
  }, 1000);
  
  // Attach the interval ID to the row so we can clear it upon deletion to prevent memory leaks
  row.dataset.intervalId = interval;
}

addAssignmentBtn.addEventListener('click', () => {
  const name = document.getElementById('assignmentName').value.trim();
  const course = document.getElementById('courseName').value.trim();
  const deadline = document.getElementById('assignmentDeadline').value;
  const level = document.getElementById('level').value;

  if (!name || !course || !deadline) {
    alert("Please fill in all fields!");
    return;
  }

  // Format date nicely
  const formattedDate = new Date(deadline).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', 
    hour: 'numeric', minute: '2-digit', hour12: true
  });

  const row = document.createElement('tr');

  row.innerHTML = `
    <td><strong>${name}</strong></td>
    <td>${course}</td>
    <td><span style="background: var(--bg-color); padding: 4px 8px; border-radius: 6px; font-size: 0.85em; font-weight: 500;">${level}</span></td>
    <td>${formattedDate}</td>
    <td></td>
    <td><button class="action-btn">Delete</button></td>
  `;

  row.querySelector('.action-btn').addEventListener('click', () => {
    // Clear the specific interval for this row so it stops counting in the background
    if (row.dataset.intervalId) {
      clearInterval(row.dataset.intervalId);
    }
    
    // Stop alarm when deleting assignment
    if (alarmSound) {
      alarmSound.pause();
      alarmSound.currentTime = 0;
    }
    alarmStoppedManually = false; // clear flag in case it was set
    row.remove();

    // if table is now empty hide the stop button again
    if (assignmentTableBody.children.length === 0 && stopAlarmBtn) {
      stopAlarmBtn.classList.add('hidden');
    }
  });

  assignmentTableBody.appendChild(row);
  updateCountdown(deadline, row, row.cells[4]);

  // Clear form & hide it
  document.getElementById('assignmentName').value = '';
  document.getElementById('courseName').value = '';
  document.getElementById('assignmentDeadline').value = '';
  addAssignmentForm.classList.add('hidden'); // automatically close form after saving
});