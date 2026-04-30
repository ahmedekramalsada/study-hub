#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const config = readJson('data/exams.json');
const ids = new Set();
let failures = 0;

for (const exam of config.exams || []) {
  if (!exam.id || ids.has(exam.id)) fail(`Invalid or duplicate exam id: ${exam.id}`);
  ids.add(exam.id);
  for (const field of ['providerId', 'provider', 'code', 'title', 'data', 'storageKey']) {
    if (!exam[field]) fail(`${exam.id}: missing ${field}`);
  }
  const data = readJson(exam.data);
  if (!Array.isArray(data.questions) || data.questions.length === 0) fail(`${exam.id}: no questions`);
  if (exam.questionTotal !== data.questions.length) fail(`${exam.id}: questionTotal ${exam.questionTotal} does not match ${data.questions.length}`);

  const questionIds = new Set();
  data.questions.forEach((question, index) => {
    const label = `${exam.id} question ${index + 1}`;
    if (!question.id || questionIds.has(question.id)) fail(`${label}: missing or duplicate id`);
    questionIds.add(question.id);
    for (const field of ['q', 'opts', 'correct', 'explain']) {
      if (question[field] === undefined || question[field] === null) fail(`${label}: missing ${field}`);
    }
    if (!Array.isArray(question.opts) || question.opts.length < 2) fail(`${label}: opts must have at least 2 choices`);
    const correct = normalizeCorrect(question.correct);
    if (!correct.length) fail(`${label}: correct is empty`);
    correct.forEach((answer) => {
      if (!Number.isInteger(answer) || answer < 0 || answer >= question.opts.length) fail(`${label}: correct index ${answer} is out of range`);
    });
  });
}

if (failures) {
  console.error(`${failures} validation issue(s).`);
  process.exit(1);
}

console.log(`Validated ${ids.size} exam(s).`);

function readJson(file) {
  const full = path.resolve(root, file);
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function normalizeCorrect(value) {
  if (Array.isArray(value)) return value.map(Number);
  if (typeof value === 'string') return value.split(',').map((item) => Number(item.trim())).filter(Number.isFinite);
  if (typeof value === 'number') return [value];
  return [];
}

function fail(message) {
  failures += 1;
  console.error(message);
}
