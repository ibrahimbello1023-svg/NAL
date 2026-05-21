// STORAGE
let data = JSON.parse(localStorage.getItem('nalData')) || {
  "Mathematics": []
};

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
  render();
}

// RENDER
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

  // RENDER MATH SYSTEMATICALLY
  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise([div]).catch(function (err) {
      console.log("MathJax failed: " + err.message);
    });
  }
}

// SUBJECTS
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

// ENTRIES
function deleteEntry(idx) {
  const sub = document.getElementById('subjectSelector').value;
  data[sub].splice(idx, 1);
  saveData();
  render();
}

function toggle(idx) {
  const sub = document.getElementById('subjectSelector').value;
  data[sub][idx].show = !data[sub][idx].show;
  render();
}

// EXPORT
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

// IMPORT
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    data = JSON.parse(e.target.result);
    saveData();
    updateSelector();
    render();
  };
  reader.readAsText(file);
}

updateSelector();