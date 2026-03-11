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

// Helper function to update countdown with alarm
function updateCountdown(deadline, countdownCell) {
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

    // Play alarm if 30 seconds or less left
    if (days === 0 && hours === 0 && minutes === 0 && seconds <= 30 && seconds > 0) {
      if (alarmSound && alarmSound.paused) {
        alarmSound.play().catch(e => console.log('Audio play failed:', e));
      }
    } else if (diff <= 0) {
      // Stop alarm when deadline has passed
      if (alarmSound) {
        alarmSound.pause();
        alarmSound.currentTime = 0;
      }
    } else {
      // Stop alarm if more than 30 seconds left
      if (alarmSound) {
        alarmSound.pause();
        alarmSound.currentTime = 0;
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
    row.remove();
  });

  assignmentTableBody.appendChild(row);
  updateCountdown(deadline, row.cells[4]);

  // Clear form
  document.getElementById('assignmentName').value = '';
  document.getElementById('courseName').value = '';
  document.getElementById('assignmentDeadline').value = '';
});