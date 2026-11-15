// quiz.js - builds the quiz from data, grades it, runs a 10-minute timer, and handles reset.
const LIMIT_SECONDS = 600, PASS_PERCENT = 70;

// Question data. type: "fill" (text box), "single" (radio), "multi" (checkboxes).
// answer: string for fill/single, array of option indexes for multi (fill accepts several spellings).
const QUESTIONS = [
  { type:"fill",   q:"To turn an element into a flex container, set display to ____.", answer:["flex"] },
  { type:"fill",   q:"The HTML element that wraps the unique main content of a page is the ____ element.", answer:["main","<main>"] },
  { type:"fill",   q:"In repeat(auto-____, minmax(300px, 1fr)), what word fills the blank so columns fit the available space?", answer:["fit"] },
  { type:"single", q:"Which W3.CSS class fixes the navigation bar to the top of the screen?", options:["w3-wide","w3-top","w3-card","w3-padding"], answer:1 },
  { type:"single", q:"Which attribute on the html element declares the page language?", options:["charset","dir","lang","xml"], answer:2 },
  { type:"single", q:"Flexbox is a layout system with how many dimensions?", options:["One","Two","Three","None"], answer:0 },
  { type:"single", q:"Which element ties visible text to a form field for screen readers?", options:["span","label","legend","caption"], answer:1 },
  { type:"single", q:"A stylesheet rule marked !important versus a normal inline style: which wins?", options:["The inline style","The !important rule","Whichever is longer","They tie"], answer:1 },
  { type:"multi",  q:"Select ALL semantic HTML elements.", options:["header","div","nav","span","footer"], answer:[0,2,4] },
  { type:"multi",  q:"Select ALL true statements about grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)).", options:["It needs no media queries","Columns adapt to the width","It requires JavaScript","It fits as many 300px columns as possible"], answer:[0,1,3] }
];

const form = document.getElementById("quiz"), results = document.getElementById("results");
const timerEl = document.getElementById("timer"), submitBtn = document.getElementById("submit-btn");
let remaining, ticker, finished;

// Build the form controls from QUESTIONS
function build() {
  form.innerHTML = "";
  QUESTIONS.forEach((item, i) => {
    const fs = document.createElement("fieldset");
    fs.className = "question";
    fs.innerHTML = `<legend>Question ${i + 1}</legend><p>${item.q.replace(/</g, "&lt;")}</p>`;
    if (item.type === "fill") {
      fs.innerHTML += `<label for="q${i}" class="hint">Type your answer</label><input type="text" id="q${i}" name="q${i}" autocomplete="off">`;
    } else {
      const kind = item.type === "single" ? "radio" : "checkbox";
      fs.innerHTML += `<p class="hint">${item.type === "single" ? "Choose one." : "Choose all that apply."}</p>` +
        item.options.map((o, j) => `<label><input type="${kind}" name="q${i}" value="${j}"> ${o}</label>`).join("");
    }
    form.appendChild(fs);
  });
}

// Read the user's answer for question i
function read(i) {
  const item = QUESTIONS[i];
  if (item.type === "fill") return form.elements["q" + i].value.trim().toLowerCase();
  const checked = [...form.querySelectorAll(`input[name="q${i}"]:checked`)].map(el => +el.value);
  return item.type === "single" ? (checked.length ? checked[0] : null) : checked.sort();
}

function isCorrect(i, a) {
  const item = QUESTIONS[i];
  if (item.type === "fill") return item.answer.includes(a);
  if (item.type === "single") return a === item.answer;
  return a.length === item.answer.length && a.every((v, k) => v === item.answer[k]);
}

// Text for the "correct answer" line and for the user's answer
function show(i, a) {
  const item = QUESTIONS[i];
  if (a === null || a === "" || (Array.isArray(a) && !a.length)) return "(no answer)";
  if (item.type === "fill") return a;
  return item.type === "single" ? item.options[a] : a.map(k => item.options[k]).join(", ");
}
function correctText(i) {
  const item = QUESTIONS[i];
  if (item.type === "fill") return item.answer[0];
  return item.type === "single" ? item.options[item.answer] : item.answer.map(k => item.options[k]).join(", ");
}

function fmt(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }

function submit() {
  if (finished) return;
  finished = true; clearInterval(ticker);
  const spent = LIMIT_SECONDS - remaining;
  let score = 0;
  const rows = QUESTIONS.map((item, i) => {
    const a = read(i), ok = isCorrect(i, a);
    if (ok) score++;
    return `<li class="${ok ? "pass" : "fail"}"><strong>Question ${i + 1}: ${ok ? "Correct" : "Incorrect"} (${ok ? 1 : 0}/1)</strong><br>
      Your answer: ${show(i, a).replace(/</g, "&lt;")}<br>Correct answer: ${correctText(i).replace(/</g, "&lt;")}</li>`;
  }).join("");
  const pct = Math.round(score / QUESTIONS.length * 100), passed = pct >= PASS_PERCENT;
  results.innerHTML = `<div class="summary ${passed ? "pass" : "fail"}"><h2>${passed ? "Pass" : "Fail"}</h2>
    <p>Total score: ${score} / ${QUESTIONS.length} (${pct}%)<br>Time spent: ${fmt(spent)} of ${fmt(LIMIT_SECONDS)}</p></div>
    <h2>Question review</h2><ol class="review">${rows}</ol>`;
  results.hidden = false;
  form.querySelectorAll("input").forEach(el => el.disabled = true);
  submitBtn.disabled = true;
  results.scrollIntoView({ behavior: "smooth" });
}

function start() {
  clearInterval(ticker);
  finished = false; remaining = LIMIT_SECONDS;
  build(); results.hidden = true; results.innerHTML = ""; submitBtn.disabled = false;
  timerEl.textContent = "Time left: " + fmt(remaining); timerEl.classList.remove("low");
  ticker = setInterval(() => {
    remaining--;
    timerEl.textContent = "Time left: " + fmt(remaining);
    timerEl.classList.toggle("low", remaining <= 60);
    if (remaining <= 0) submit();   // auto-submit at 10 minutes
  }, 1000);
}

form.addEventListener("submit", e => { e.preventDefault(); submit(); });
document.getElementById("reset-btn").addEventListener("click", () => { start(); window.scrollTo({ top: 0, behavior: "smooth" }); });
start();
