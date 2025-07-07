document.addEventListener("DOMContentLoaded", () => {
  populateExistingQuestions();
});

function addQuestion(questionData = {}) {
  const container = document.getElementById("questionsContainer");

  const questionIndex = container.children.length;

  const div = document.createElement("div");
  div.className = "question-block border p-4 mb-4 rounded bg-gray-50";
  div.innerHTML = `
    <input type="text" placeholder="Question Text" class="w-full border px-2 py-1 mb-2" data-type="questionText" value="${questionData.questionText || ''}" required>

    <div class="grid grid-cols-2 gap-2 mb-2">
      ${(questionData.options || ["", "", "", ""]).map((opt, i) => `
        <input type="text" placeholder="Option ${i + 1}" class="border px-2 py-1" data-type="option" value="${opt}" required>
      `).join("")}
    </div>

    <input type="text" placeholder="Correct Answer" class="w-full border px-2 py-1" data-type="correctAns" value="${questionData.correctAns || ''}" required>
  `;

  container.appendChild(div);
}

function prepareQuestions() {
  const blocks = document.querySelectorAll(".question-block");
  const questions = [];

  blocks.forEach((block) => {
    const questionText = block.querySelector('[data-type="questionText"]').value.trim();
    const correctAns = block.querySelector('[data-type="correctAns"]').value.trim();
    const optionInputs = block.querySelectorAll('[data-type="option"]');

    const options = Array.from(optionInputs).map(input => input.value.trim()).filter(opt => opt);

    if (questionText && options.length && correctAns) {
      questions.push({
        questionText,
        options,
        correctAns
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
