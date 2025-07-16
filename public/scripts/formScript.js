document.addEventListener("DOMContentLoaded", () => {
  populateExistingQuestions();

  const quizForm = document.getElementById("quizForm");
  quizForm.addEventListener("submit", (e) => {
    prepareQuestions(); // This adds the questions JSON to the hidden input
  });
});

function addQuestion(questionData = {}) {
  const container = document.getElementById("questionsContainer");
  const questionIndex = container.children.length;

  const options = questionData.options || ["", "", "", ""];
  
  // Determine correctIndex from correctAns
  let correctIndex = -1;
  if (questionData.correctAns) {
    correctIndex = options.findIndex(opt => opt.trim() === questionData.correctAns.trim());
  }

  const div = document.createElement("div");
  div.className = "question-block border p-4 mb-4 rounded bg-gray-50";

  div.innerHTML = `
    <input type="text" placeholder="Question Text" class="w-full border px-2 py-1 mb-4" data-type="questionText" value="${questionData.questionText || ''}" required>

    <div class="grid grid-cols-1 gap-2">
      ${["A", "B", "C", "D"].map((label, i) => `
        <label class="flex items-center space-x-2">
          <input type="radio" name="correct-${questionIndex}" value="${i}" ${i === correctIndex ? "checked" : ""} class="correct-radio">
          <span>${label}:</span>
          <input type="text" class="border px-2 py-1 flex-1" data-type="option" value="${options[i] || ''}" required>
        </label>
      `).join("")}
    </div>

    <button type="button" class="remove-question text-red-600 text-sm underline mt-3">Remove</button>
  `;

  // Add remove button handler
  div.querySelector(".remove-question").addEventListener("click", () => {
    div.remove();
  });

  container.appendChild(div);
}



function prepareQuestions() {
  const blocks = document.querySelectorAll(".question-block");
  const questions = [];

  blocks.forEach((block, index) => {
    const questionText = block.querySelector('[data-type="questionText"]').value.trim();
    const optionInputs = block.querySelectorAll('[data-type="option"]');
    const radios = block.querySelectorAll('.correct-radio');

    const options = Array.from(optionInputs).map(input => input.value.trim());
    const selectedRadio = Array.from(radios).find(r => r.checked);
    const correctIndex = selectedRadio ? parseInt(selectedRadio.value) : -1;

    if (questionText && options.length === 4 && correctIndex >= 0) {
      questions.push({
        questionText,
        options,
        correctIndex,
      });
    }
  });

  document.getElementById("questionsInput").value = JSON.stringify(questions);
}


function populateExistingQuestions() {
  try {
    const oldData = JSON.parse(document.getElementById("oldData").textContent);
    if (Array.isArray(oldData)) {
      oldData.forEach(q => addQuestion(q));
    }
  } catch (err) {
    console.error("Error parsing old questions", err);
  }
}
