# Add A New Dynamic Exam

1. Copy `templates/dynamic-exam.example.json` to `data/<exam-id>.json`.
2. Fill `domains`, `concepts`, and `questions`.
3. Copy `templates/exam-metadata.example.json` into the `exams` array in `data/exams.json`.
4. Set `id`, `providerId`, `code`, `title`, `questionTotal`, `data`, `storageKey`, `filterTags`, and `focusSessions`.
5. Run `node tools/validate-study-data.mjs`.
6. Open `http://localhost:8000/exam.html?exam=<exam-id>`.

Question rules:

- `correct` can be a number for one answer, an array, or a comma string like `"0,2"` for multi-answer questions.
- `tags` drive filters, keyword cards, concept quizzes, and repeated-pattern sessions.
- Keep `id` stable once progress exists. Browser progress uses the question id.
