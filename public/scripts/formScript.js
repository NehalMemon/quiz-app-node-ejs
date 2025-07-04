document.addEventListener("DOMContentLoaded", () => {
  let questionIndex = 0;

  function addQuestion() {
    const container = document.getElementById("questionsContainer");

    const questionBlock = document.createElement("div");
    questionBlock.className = "mb-8 p-4 border border-gray-300 rounded-lg bg-gray-50";

    questionBlock.innerHTML = `
      <h2 class="text-xl font-semibold text-gray-700 mb-2">Question ${questionIndex + 1}</h2>
      <div class="grid gap-4">
        <input type="text" name="questions[${questionIndex}][questionText]" placeholder="Question Text" required class="w-full border border-gray-300 rounded px-4 py-2" />
        <div class="grid grid-cols-2 gap-4">
          <input type="text" name="questions[${questionIndex}][options][]" placeholder="Option A" required class="border border-gray-300 rounded px-4 py-2" />
          <input type="text" name="questions[${questionIndex}][options][]" placeholder="Option B" required class="border border-gray-300 rounded px-4 py-2" />
          <input type="text" name="questions[${questionIndex}][options][]" placeholder="Option C" required class="border border-gray-300 rounded px-4 py-2" />
          <input type="text" name="questions[${questionIndex}][options][]" placeholder="Option D" required class="border border-gray-300 rounded px-4 py-2" />
        </div>
        <input type="text" name="questions[${questionIndex}][correctAnswer]" placeholder="Correct Answer" required class="w-full border border-gray-300 rounded px-4 py-2" />
      </div>
    `;

    container.appendChild(questionBlock);
    questionIndex++;
  }

  // Expose function to global so inline onclick="addQuestion()" works
  window.addQuestion = addQuestion;

  // Automatically add one question on page load
  addQuestion();
});
