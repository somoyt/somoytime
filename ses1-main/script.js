// Mobile Menu
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('navbar').classList.toggle('active');
});

// Dark Mode Toggle
const darkBtn = document.getElementById('dark-toggle');
function setDarkMode(on) {
  if (on) {
    document.documentElement.style.setProperty('--bg', '#111');
    document.documentElement.style.setProperty('--text', '#fff');
    localStorage.setItem('darkmode', 'on');
  } else {
    document.documentElement.style.setProperty('--bg', '#fff');
    document.documentElement.style.setProperty('--text', '#111');
    localStorage.setItem('darkmode', 'off');
  }
}
darkBtn.addEventListener('click', () => {
  setDarkMode(localStorage.getItem('darkmode') !== 'on');
});
if (localStorage.getItem('darkmode') === 'on') setDarkMode(true);

// Breaking Ticker (dummy for now)
document.getElementById('breaking-ticker').innerText = "শিরোনাম ১ | শিরোনাম ২ | শিরোনাম ৩";

// Live Time Formatting
function formatTime(published) {
  const now = new Date();
  const pub = new Date(published);
  const diffMs = now - pub;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  if (diffSec < 60) return "এইমাত্র";
  if (diffMin < 60) return diffMin + " মিনিট আগে";
  if (diffHr < 24) return diffHr + " ঘন্টা আগে";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (pub.toDateString() === yesterday.toDateString()) return "গতকাল";
  return pub.toLocaleDateString('bn-BD');
}

function updateTimes() {
  document.querySelectorAll('.news-card').forEach(card => {
    const timeEl = card.querySelector('.news-time');
    const pubTime = card.getAttribute('data-time');
    if (timeEl && pubTime) {
      timeEl.innerText = formatTime(pubTime);
    }
  });
}
setInterval(updateTimes, 60000);
updateTimes();
