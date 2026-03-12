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

// Create alarm audio element
const alarmSound = document.getElementById('alarmSound');
if (alarmSound) {
  alarmSound.loop = true; // Make it loop like a real alarm
}

// manual stop flag used to prevent auto-replay after user stops it
let alarmStoppedManually = false;

// Stop alarm button (added to UI) - MUST be defined before use
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
    }
    alarmStoppedManually = true;             // remember user stopped it
    stopAlarmBtn.classList.add('hidden');
  });
}

// Helper function to update countdown with alarm
function updateCountdown(deadline, countdownCell) {
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
      clearInterval(interval);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    countdownCell.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    // Ignore alarms if user manually stopped them
    if (alarmStoppedManually) {
      if (alarmSound) {
        alarmSound.pause();
        alarmSound.currentTime = 0;
      }
      return;
    }

    // Reset flags if we go back above 5 minutes (all alarms reset)
    if (days > 0 || hours > 0 || minutes > 5) {
      if (alarmSound && !alarmSound.paused) {
        alarmSound.pause();
        alarmSound.currentTime = 0;
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
      if (!alarmAt5Min && alarmSound && alarmSound.paused) {
        alarmSound.play().catch(e => console.log('Audio play failed:', e));
        alarmAt5Min = true;
      }
      if (stopAlarmBtn) {
        stopAlarmBtn.classList.remove('hidden');
      }
    }
    // SILENT PERIOD: Between after 5 min alarm (290s) and before 3 min alarm (180s)
    else if (totalSecondsRemaining <= 289 && totalSecondsRemaining > 180) {
      if (alarmSound && !alarmSound.paused) {
        alarmSound.pause();
        alarmSound.currentTime = 0;
      }
      if (stopAlarmBtn) {
        stopAlarmBtn.classList.add('hidden');
      }
    }
    // ALARM 2: Beep at 3 minutes (when time is between 180-170 seconds)
    else if (totalSecondsRemaining <= 180 && totalSecondsRemaining > 170) {
      if (!alarmAt3Min && alarmSound && alarmSound.paused) {
        alarmSound.play().catch(e => console.log('Audio play failed:', e));
        alarmAt3Min = true;
      }
      if (stopAlarmBtn) {
        stopAlarmBtn.classList.remove('hidden');
      }
    }
    // SILENT PERIOD: Between after 3 min alarm (170s) and final 30 seconds (30s)
    else if (totalSecondsRemaining <= 169 && totalSecondsRemaining > 30) {
      if (alarmSound && !alarmSound.paused) {
        alarmSound.pause();
        alarmSound.currentTime = 0;
      }
      if (stopAlarmBtn) {
        stopAlarmBtn.classList.add('hidden');
      }
    }
    // ALARM 3: Beep at final 30 seconds (0-30)
    else if (totalSecondsRemaining <= 30 && totalSecondsRemaining > 0) {
      if (!alarmAt30Sec && alarmSound && alarmSound.paused) {
        alarmSound.play().catch(e => console.log('Audio play failed:', e));
        alarmAt30Sec = true;
      }
      if (stopAlarmBtn) {
        stopAlarmBtn.classList.remove('hidden');
      }
    }
    // Stop all alarms when deadline passes
    else if (diff <= 0) {
      if (alarmSound) {
        alarmSound.pause();
        alarmSound.currentTime = 0;
      }
      if (stopAlarmBtn) {
        stopAlarmBtn.classList.add('hidden');
      }
    }
  }, 1000);
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

  const row = document.createElement('tr');
  const countdownCell = document.createElement('td');

  row.innerHTML = `
    <td>${name}</td>
    <td>${course}</td>
    <td>${level}</td>
    <td>${new Date(deadline).toLocaleString()}</td>
    <td></td>
    <td><button class="action-btn">Delete</button></td>
  `;

  row.querySelector('.action-btn').addEventListener('click', () => {
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
  updateCountdown(deadline, row.cells[4]);


  // Clear form
  document.getElementById('assignmentName').value = '';
  document.getElementById('courseName').value = '';
  document.getElementById('assignmentDeadline').value = '';
});