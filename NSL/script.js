// STORAGE
let data = JSON.parse(localStorage.getItem('nalData')) || {
  "Mathematics": []
};

// MODE & BALANCED QUIZ SYSTEM VARIABLE LOGIC
let currentMode = 'study';
let currentQuizCard = null;
let quizPool = []; // This tracks remaining unasked questions to block repeats

function saveData() {
  localStorage.setItem('nalData', JSON.stringify(data));
}

// SLIDESHOW
const images = ['bg1.jpg', 'bg2.jpg', 'bg3.jpg'];
let currentImageIndex = 0;
const slideshowElement = document.getElementById('bg-slideshow');

function changeBackground() {
  if (slideshowElement) {
    slideshowElement.style.backgroundImage = `url('${images[currentImageIndex]}')`;
    currentImageIndex = (currentImageIndex + 1) % images.length;
  }
}
changeBackground();
setInterval(changeBackground, 8000);

// TOGGLE MODES
function toggleMode() {
  const studyPanel = document.getElementById('study-panel');
  const displayDiv = document.getElementById('display');
  const quizSection = document.getElementById('quiz-section');
  const toggleBtn = document.getElementById('modeToggleBtn');

  if (currentMode === 'study') {
    currentMode = 'test';
    toggleBtn.innerText = "Switch to Study Mode";
    studyPanel.style.display = 'none';
    displayDiv.style.display = 'none';
    quizSection.style.display = 'block';
    quizPool = []; // Clear old tracked pool to rebuild fresh
    generateQuizQuestion();
  } else {
    currentMode = 'study';
    toggleBtn.innerText = "Switch to Test Mode";
    studyPanel.style.display = 'block';
    studyPanel.removeAttribute('style'); 
    displayDiv.style.display = 'block';
    quizSection.style.display = 'none';
    render();
  }
}

function handleSubjectChange() {
  quizPool = []; // Rebuild pool when subject switches
  if (currentMode === 'test') {
    generateQuizQuestion();
  } else {
    render();
  }
}

// TEST MODE LOGIC (ANTI-REPEAT INTEGRATION)
function generateQuizQuestion() {
  const sub = document.getElementById('subjectSelector').value;
  const questionContainer = document.getElementById('quiz-question');
  const optionsContainer = document.getElementById('quiz-options');
  
  if (!sub || !data[sub] || data[sub].length < 4) {
    questionContainer.innerHTML = "<span style='color:red; font-size:1.2rem;'>You need at least 4 items saved in this subject to take a test!</span>";
    optionsContainer.innerHTML = "";
    return;
  }

  const subjectCards = data[sub];

  // If pool tracker is totally empty, clone full list and do a clean random shuffle
  if (quizPool.length === 0) {
    quizPool = [...subjectCards];
    quizPool.sort(() => 0.5 - Math.random());
  }

  // Pull the very top card off the shuffled deck queue
  currentQuizCard = quizPool.pop();

  // Print text or formula prompt
  questionContainer.innerHTML = currentQuizCard.def;

  // Gather distractors (Filter out matching term cleanly)
  const otherCards = subjectCards.filter(card => card.term.toLowerCase() !== currentQuizCard.term.toLowerCase());
  
  // Scramble distractors and grab 3
  const shuffledOthers = otherCards.sort(() => 0.5 - Math.random());
  const wrongOptions = shuffledOthers.slice(0, 3).map(card => card.term);

  // Compile final 4 buttons options array
  const allChoices = [currentQuizCard.term, ...wrongOptions];
  const finalChoices = allChoices.sort(() => 0.5 - Math.random());

  // Render choice buttons cleanly
  optionsContainer.innerHTML = "";
  finalChoices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.innerText = choice;
    btn.onclick = () => checkQuizAnswer(choice);
    optionsContainer.appendChild(btn);
  });

  // Re-run MathJax structural formula alignment compiler
  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise([questionContainer]).catch(function (err) {
      console.log("MathJax Quiz render failed: " + err.message);
    });
  }
}

function checkQuizAnswer(selectedChoice) {
  if (selectedChoice.toLowerCase() === currentQuizCard.term.toLowerCase()) {
    alert("Correct! 🎉");
    generateQuizQuestion(); 
  } else {
    alert(`Incorrect. The correct term was:\n"${currentQuizCard.term.toUpperCase()}"`);
  }
}

// ADD ENTRY
function addEntry() {
  const sub = document.getElementById('subjectSelector').value;
  const term = document.getElementById('term').value;
  const def = document.getElementById('def').value;

  if (!sub || !term || !def) return;

  data[sub].push({
    term,
    def,
    show: false
  });

  document.getElementById('term').value = '';
  document.getElementById('def').value = '';

  saveData();
  quizPool = []; // Reset tracked pool because a new item was added
  render();
}

// RENDER STUDY VIEW
function render() {
  const sub = document.getElementById('subjectSelector').value;
  const search = document.getElementById('searchBar').value.toLowerCase();

  document.getElementById('currentSubjectTitle').innerText = sub || "No Subject";

  const div = document.getElementById('display');
  if (!sub) return;

  const filtered = data[sub]
    .map((e, i) => ({ ...e, i }))
    .filter(e => e.term.toLowerCase().includes(search));

  div.innerHTML = filtered.map(e => `
      <div class="entry">
        <div class="term" onclick="toggle(${e.i})">
          <strong>${e.term}</strong>
        </div>
        <button onclick="deleteEntry(${e.i})">Delete</button>
        ${
          e.show
          ? `<div class="definition">${e.def}</div>`
          : ''
        }
      </div>
    `).join('');

  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise([div]).catch(function (err) {
      console.log("MathJax failed: " + err.message);
    });
  }
}

// SUBJECT ACTIONS
function addSubject() {
  const name = document.getElementById('newSubject').value;
  if (name && !data[name]) {
    data[name] = [];
    document.getElementById('newSubject').value = '';
    saveData();
    updateSelector();
  }
}

function deleteSubject() {
  const sub = document.getElementById('subjectSelector').value;
  if (confirm(`Delete ${sub}?`)) {
    delete data[sub];
    saveData();
    updateSelector();
    render();
  }
}

function updateSelector() {
  const sel = document.getElementById('subjectSelector');
  sel.innerHTML = Object.keys(data)
    .map(s => `<option value="${s}">${s}</option>`)
    .join('');
  render();
}

function deleteEntry(idx) {
  const sub = document.getElementById('subjectSelector').value;
  data[sub].splice(idx, 1);
  saveData();
  quizPool = []; // Reset pool tracker
  render();
}

function toggle(idx) {
  const sub = document.getElementById('subjectSelector').value;
  data[sub][idx].show = !data[sub][idx].show;
  render();
}

// BACKUP OPERATIONS
function exportData() {
  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'nal-backup.json';
  a.click();
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    data = JSON.parse(e.target.result);
    saveData();
    quizPool = []; // Flush active pool
    updateSelector();
    render();
  };
  reader.readAsText(file);
}

updateSelector();