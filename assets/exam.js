const params = new URLSearchParams(window.location.search);
const requestedExamId = params.get('exam');

const app = {
    config: null,
    exam: null,
    data: null,
    questions: [],
    concepts: [],
    domains: {},
    currentQuestions: [],
    currentIdx: 0,
    answered: {},
    pending: [],
    pendingQuestionId: null,
    savedQuestionId: null,
    sessionName: 'Smart order: unique ideas first',
    reviewFilter: 'all',
    conceptCategory: 'All',
    conceptSearch: ''
};

const el = {
    badge: document.getElementById('exam-badge'),
    title: document.getElementById('exam-title'),
    subtitle: document.getElementById('exam-subtitle'),
    links: document.getElementById('exam-links'),
    error: document.getElementById('exam-error'),
    progressText: document.getElementById('progress-text'),
    progressBar: document.getElementById('progress-bar'),
    searchInput: document.getElementById('search-input'),
    jumpInput: document.getElementById('jump-input'),
    filterTags: document.getElementById('filter-tags'),
    sessionButtons: document.getElementById('session-buttons'),
    sessionLabel: document.getElementById('session-label'),
    questionCounter: document.getElementById('question-counter'),
    questionText: document.getElementById('question-text'),
    questionTags: document.getElementById('question-tags'),
    options: document.getElementById('options'),
    submit: document.getElementById('submit-answer-btn'),
    multiControls: document.getElementById('multi-answer-controls'),
    selectionHint: document.getElementById('selection-hint'),
    peek: document.getElementById('peek-answer-btn'),
    answerPeek: document.getElementById('answer-peek'),
    answerSummary: document.getElementById('answer-summary'),
    explanation: document.getElementById('explanation'),
    prev: document.getElementById('prev-btn'),
    next: document.getElementById('next-btn'),
    reviewList: document.getElementById('review-list'),
    reviewSummary: document.getElementById('review-summary'),
    conceptSearch: document.getElementById('concept-search'),
    conceptCategories: document.getElementById('concept-categories'),
    conceptList: document.getElementById('concept-list'),
    keywordList: document.getElementById('keyword-list'),
    analyticsMetrics: document.getElementById('analytics-metrics'),
    domainStats: document.getElementById('domain-stats')
};

const STUDY_KEY_RULES = [
    ['IAM / access control', /iam|identity center|cognito|role|policy|mfa|root user|access key|least privilege|entra|active directory/],
    ['Shared responsibility', /shared responsibility|security of the cloud|security in the cloud|customer responsibility|provider responsibility/],
    ['Audit / logging', /cloudtrail|audit api|api calls?|activity log|audit log|logging|unauthorized access/],
    ['Monitoring', /cloudwatch|azure monitor|metrics|alarms?|logs|monitor/],
    ['Compliance / governance', /aws config|policy|configuration|compliance rules?|resource config|governance|blueprints/],
    ['Threat detection', /guardduty|defender|threat detection|suspicious|malicious/],
    ['Vulnerability scanning', /inspector|vulnerabilit|patch|scan/],
    ['Sensitive data', /macie|pii|sensitive data|data loss|classification/],
    ['Web protection', /\bwaf\b|sql injection|xss|shield|ddos|web attack/],
    ['Object storage', /\bs3\b|blob storage|object storage|bucket|glacier|archive|versioning|lifecycle|intelligent-tiering|snowball/],
    ['Block / file storage', /\bebs\b|\befs\b|\bfsx\b|managed disk|files|block storage|file system|instance store/],
    ['Pricing / commitments', /reserved instances?|savings plans?|spot instances?|on-demand|dedicated host|capacity reservation|reservation|savings/],
    ['Compute services', /\bec2\b|lambda|fargate|ecs|eks|elastic beanstalk|batch|app runner|lightsail|virtual machine|functions|container apps/],
    ['Database chooser', /rds|aurora|dynamodb|redshift|athena|neptune|elasticache|documentdb|database|sql|nosql|cosmos|synapse/],
    ['Networking', /vpc|vnet|route 53|cloudfront|global accelerator|internet gateway|nat gateway|direct connect|vpn|privatelink|security group|nacl|load balancer/],
    ['Migration / hybrid', /migration|datasync|dms|storage gateway|snow|outposts|transfer family|application migration|arc|migrate/],
    ['Integration / messaging', /sqs|sns|eventbridge|step functions|service bus|event grid|queue|notification|workflow/],
    ['Architecture frameworks', /well-architected|operational excellence|reliability|performance efficiency|cost optimization|sustainability|cloud adoption framework|\bcaf\b/],
    ['Billing tools', /cost explorer|budgets|pricing calculator|cost and usage report|compute optimizer|trusted advisor|support plan|artifact|cost management/],
    ['Bedrock / foundation models', /bedrock|foundation model|\bfm\b|\bfms\b|llm|titan|nova|claude|stable diffusion/],
    ['Prompt engineering', /prompt|few-shot|zero-shot|chain-of-thought|negative prompt|temperature|top k|top p|context window|token/],
    ['RAG / knowledge bases', /rag|retrieval|knowledge base|embedding|vector|opensearch|kendra|semantic search/],
    ['AI safety / guardrails', /guardrail|denied topic|content filter|word filter|unsafe|toxicity|moderation|prompt injection/],
    ['SageMaker AI', /sagemaker|canvas|jumpstart|ground truth|data wrangler|feature store|clarify|model monitor|model card|autopilot|batch transform/],
    ['AI service chooser', /comprehend|rekognition|textract|transcribe|polly|translate|lex|personalize|q business|q developer|healthscribe/],
    ['Responsible AI', /responsible ai|fairness|bias|explainability|transparency|privacy|human-in-the-loop|human review|plagiarism|hallucination/],
    ['AI metrics / evaluation', /accuracy|precision|recall|f1|rmse|mse|r-squared|bleu|rouge|bertscore|latency|conversion rate|evaluation metric/],
    ['Learning types / algorithms', /supervised|unsupervised|reinforcement|classification|regression|clustering|decision tree|logistic regression|neural network|autoencoder/],
    ['Data preparation / governance', /data labeling|dataset|preprocess|augmentation|data residency|data retention|data governance|federated learning/]
];

const GENERIC_STUDY_TAGS = new Set(['security', 'compute', 'storage', 'database', 'network', 'billing', 'cost', 'ai-ml', 'genai', 'bedrock', 'sagemaker', 'data', 'evaluation', 'ai-services', 'responsible-ai']);

init();

async function init() {
    try {
        const configResponse = await fetch('data/exams.json', { cache: 'no-store' });
        if (!configResponse.ok) throw new Error(`Could not load data/exams.json (${configResponse.status})`);
        app.config = await configResponse.json();
        app.exam = app.config.exams.find((exam) => exam.id === requestedExamId) || app.config.exams.find((exam) => exam.status === 'live');
        if (!app.exam) throw new Error('No live exam is configured.');

        const dataResponse = await fetch(app.exam.data, { cache: 'no-store' });
        if (!dataResponse.ok) throw new Error(`Could not load ${app.exam.data} (${dataResponse.status})`);
        app.data = await dataResponse.json();
        app.questions = app.data.questions.map((question, index) => ({
            id: question.id || `q-${index + 1}`,
            n: question.n || index + 1,
            tags: Array.isArray(question.tags) ? question.tags : [],
            ...question
        }));
        app.concepts = Array.isArray(app.data.concepts) ? app.data.concepts : [];
        app.domains = app.data.domains || {};
        app.currentQuestions = getStudyOrderedQuestions(app.questions);

        setupUi();
        loadProgress();
        applySavedQuestion();
        bindEvents();
        renderAll();
    } catch (error) {
        el.error.textContent = `Could not load this dynamic exam page. Start a local server and open http://localhost:8000/exam.html?exam=aws-clf. Details: ${error.message}`;
        el.error.classList.remove('hidden');
    }
}

function setupUi() {
    document.documentElement.style.setProperty('--accent', app.exam.accent || '#f59e0b');
    document.title = `${app.exam.provider} ${app.exam.code} ${app.exam.title}`;
    el.badge.style.background = app.exam.accent ? `linear-gradient(135deg, ${app.exam.accent}, ${app.exam.accent})` : '';
    el.badge.textContent = app.exam.badge || app.exam.provider;
    el.title.textContent = `${app.exam.code} ${app.exam.title}`;
    el.subtitle.textContent = `${app.exam.provider} | ${app.questions.length} questions`;
    el.jumpInput.max = app.questions.length;

    document.getElementById('footer-exam-name').textContent = `${app.exam.provider} ${app.exam.code} ${app.exam.title}`;
    document.getElementById('footer-question-count').textContent = `${app.questions.length} questions`;

    const siblingLinks = app.config.exams
        .filter((exam) => exam.status === 'live' && exam.id !== app.exam.id)
        .map((exam) => `<a class="link-btn" href="exam.html?exam=${encodeURIComponent(exam.id)}">${escapeHtml(exam.code)}</a>`)
        .join('');
    el.links.innerHTML = siblingLinks;

    document.getElementById('loading-skeleton').classList.add('hidden');

    renderFilterTags();
    renderSessionButtons();
    highlightActiveSession('all');
    highlightActiveFilter('all');
    renderCheatSheet();
}

function bindEvents() {
    document.querySelectorAll('[data-tab]').forEach((button) => {
        button.addEventListener('click', () => showTab(button.dataset.tab));
    });

    el.searchInput.addEventListener('input', () => {
        const term = el.searchInput.value.trim().toLowerCase();
        if (term.length < 2) return;
        const results = app.questions.filter((question) => questionMatchesSearch(question, term));
        if (!results.length) return;
        app.currentQuestions = getStudyOrderedQuestions(results);
        app.currentIdx = 0;
        app.sessionName = `Search: ${term}`;
        highlightActiveSession(null);
        highlightActiveFilter('all');
        showTab('quiz');
        renderQuiz();
        debounceUpdateProgress();
    });

    document.getElementById('jump-btn').addEventListener('click', () => jumpToQuestion(el.jumpInput.value));
    el.jumpInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            jumpToQuestion(event.target.value);
        }
    });

    el.filterTags.addEventListener('click', (event) => {
        const button = event.target.closest('[data-filter-tag]');
        if (!button) return;
        startTagSession(button.dataset.filterTag);
    });

    el.sessionButtons.addEventListener('click', (event) => {
        const button = event.target.closest('[data-session]');
        if (!button) return;
        startSession(button.dataset.session);
    });

    document.getElementById('shuffle-btn').addEventListener('click', () => {
        app.currentQuestions = [...app.currentQuestions].sort(() => Math.random() - 0.5);
        app.currentIdx = 0;
        app.sessionName = `${app.sessionName} shuffled`;
        highlightActiveSession(null);
        highlightActiveFilter('all');
        renderQuiz();
        debounceUpdateProgress();
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
        if (!confirm('Reset all progress for this exam?')) return;
        localStorage.removeItem(app.exam.storageKey);
        app.answered = {};
        app.currentIdx = 0;
        app.currentQuestions = getStudyOrderedQuestions(app.questions);
        app.sessionName = 'Smart order: unique ideas first';
        highlightActiveSession('all');
        highlightActiveFilter('all');
        renderAll();
    });

    el.options.addEventListener('click', (event) => {
        const button = event.target.closest('[data-option]');
        if (!button) return;
        chooseOption(Number(button.dataset.option));
    });

    el.submit.addEventListener('click', submitPendingAnswer);

    el.peek.addEventListener('click', () => {
        el.answerPeek.classList.toggle('hidden');
        el.peek.textContent = el.answerPeek.classList.contains('hidden') ? 'Peek answer' : 'Hide answer';
    });

    el.prev.addEventListener('click', () => {
        if (app.currentIdx <= 0) return;
        app.currentIdx -= 1;
        renderQuiz();
        debounceUpdateProgress();
    });

    el.next.addEventListener('click', () => {
        if (app.currentIdx < app.currentQuestions.length - 1) {
            app.currentIdx += 1;
            renderQuiz();
            debounceUpdateProgress();
            return;
        }
        const stats = calculateStats();
        alert(`Complete. Score: ${stats.correct}/${stats.answered} (${stats.accuracy}%)`);
    });

    document.getElementById('review-filters').addEventListener('click', (event) => {
        const button = event.target.closest('[data-review-filter]');
        if (!button) return;
        app.reviewFilter = button.dataset.reviewFilter;
        renderReview();
    });

    el.reviewList.addEventListener('click', (event) => {
        const item = event.target.closest('[data-review-q]');
        if (!item) return;
        const question = app.questions.find((candidate) => candidate.id === item.dataset.reviewQ);
        if (!question) return;
        app.currentQuestions = [question];
        app.currentIdx = 0;
        app.sessionName = `Review PDF Q${question.n}`;
        highlightActiveSession(null);
        highlightActiveFilter('all');
        showTab('quiz');
        renderQuiz();
        debounceUpdateProgress();
    });

    el.conceptSearch.addEventListener('input', (event) => {
        app.conceptSearch = event.target.value.trim().toLowerCase();
        renderConcepts();
    });

    el.conceptCategories.addEventListener('click', (event) => {
        const button = event.target.closest('[data-concept-category]');
        if (!button) return;
        app.conceptCategory = button.dataset.conceptCategory;
        renderConcepts();
    });

    el.conceptList.addEventListener('click', (event) => {
        const button = event.target.closest('[data-concept-name]');
        if (!button) return;
        startConceptSession(button.dataset.conceptName);
    });

    document.getElementById('cheatsheet').addEventListener('click', (event) => {
        const button = event.target.closest('[data-concept-name]');
        if (!button) return;
        startConceptSession(button.dataset.conceptName);
    });

    el.keywordList.addEventListener('click', (event) => {
        const item = event.target.closest('[data-keyword]');
        if (!item) return;
        startTagSession(item.dataset.keyword);
    });

    document.addEventListener('keydown', (event) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
        const key = event.key.toLowerCase();
        if (key === 'arrowleft' && app.currentIdx > 0) {
            app.currentIdx -= 1;
            renderQuiz();
            debounceUpdateProgress();
        } else if (key === 'arrowright' && app.currentIdx < app.currentQuestions.length - 1) {
            app.currentIdx += 1;
            renderQuiz();
            debounceUpdateProgress();
        } else if (key >= 'a' && key <= 'e') {
            const index = key.charCodeAt(0) - 97;
            const option = el.options.querySelectorAll('[data-option]')[index];
            if (option) option.click();
        } else if (key === 'enter' && !el.multiControls.classList.contains('hidden') && !el.submit.disabled) {
            el.submit.click();
        }
    });
}

function showTab(tab) {
    const isQuizTab = tab === 'quiz';
    document.querySelectorAll('[data-tab]').forEach((button) => button.classList.toggle('active', button.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.toggle('hidden', panel.id !== tab));
    if (isQuizTab) renderQuiz();
    if (tab === 'review') renderReview();
    if (tab === 'learn') renderConcepts();
    if (tab === 'keywords') renderKeywords();
    if (tab === 'analytics') renderAnalytics();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

let updateProgressTimer = null;
function debounceUpdateProgress() {
    if (updateProgressTimer) return;
    updateProgressTimer = setTimeout(() => {
        updateProgressTimer = null;
        updateProgress();
        saveProgress();
    }, 100);
}

function renderAll() {
    renderCheatSheet();
    renderQuiz();
    renderReview();
    renderConcepts();
    renderKeywords();
    renderAnalytics();
    updateProgress();
}

function renderFilterTags() {
    const tags = app.exam.filterTags || getTopTags(8).map(([tag]) => tag);
    el.filterTags.innerHTML = [
        '<button class="chip-btn" type="button" data-filter-tag="all">All</button>',
        ...tags.map((tag) => `<button class="chip-btn" type="button" data-filter-tag="${escapeAttr(tag)}">${escapeHtml(labelize(tag))}</button>`)
    ].join('');
}

function highlightActiveFilter(tag) {
    document.querySelectorAll('[data-filter-tag]').forEach((button) => {
        button.classList.toggle('active', button.dataset.filterTag === tag);
    });
}

function renderSessionButtons() {
    const base = [
        ['all', 'Smart order'],
        ['random25', 'Random 25'],
        ['wrong', 'Wrong only'],
        ['unseen', 'Unseen only'],
        ['repeated', 'Repeated concepts']
    ];
    const focus = (app.exam.focusSessions || []).map((session) => [session.id, session.label]);
    el.sessionButtons.innerHTML = [...base, ...focus]
        .map(([id, label]) => `<button class="chip-btn" type="button" data-session="${escapeAttr(id)}">${escapeHtml(label)}</button>`)
        .join('');
}

function highlightActiveSession(sessionId) {
    document.querySelectorAll('[data-session]').forEach((button) => {
        button.classList.toggle('active', button.dataset.session === sessionId);
    });
}

function sectionHeading(text, icon) {
    return `<h3 class="cram-section-heading">${icon || ''} ${escapeHtml(text)}</h3>`;
}

function renderCheatSheet() {
    const cram = app.data.cramSheet || {};
    document.getElementById('cheatsheet-title').textContent = `${app.exam.code} ${app.exam.title} Study Plan`;
    document.getElementById('exam-description').textContent = app.exam.description || '';
    document.getElementById('resource-links').innerHTML = (app.exam.links || [])
        .map((link) => `<a class="resource-link" href="${escapeAttr(link.href)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`)
        .join('');

    let html = '';

    if (cram.studyPlanTimeline) {
        html += sectionHeading('Study Timeline', '⏱️');
        html += `<div class="cram-timeline">${cram.studyPlanTimeline.map((item, i) => `
            <div class="cram-step">
                <span class="cram-step-num color-${item.color}">${i + 1}</span>
                <div class="cram-step-time">${escapeHtml(item.time)}</div>
                <div class="cram-step-label">${escapeHtml(item.label)}</div>
            </div>`).join('')}</div>`;
    }

    if (cram.domainWeights) {
        html += sectionHeading('Exam Domain Weights', '📊');
        html += `<div class="cram-stat-grid cols-5">${cram.domainWeights.map((item) => `
            <div class="cram-stat-card">
                <div class="cram-stat-value color-${item.color}">${escapeHtml(item.label)}</div>
                <div class="cram-stat-desc">${escapeHtml(item.desc)}</div>
            </div>`).join('')}</div>`;
    }

    if (cram.repeatedIdeas) {
        html += sectionHeading('Most Repeated Ideas', '🔄');
        html += `<div class="cram-stat-grid">${cram.repeatedIdeas.map((item) => `
            <div class="cram-stat-card">
                <div class="cram-stat-value color-${item.color}">${escapeHtml(item.label)}</div>
                <div class="cram-stat-desc">${escapeHtml(item.desc)}</div>
            </div>`).join('')}</div>`;
    }

    if (cram.solverRules) {
        html += sectionHeading('Decision Rules', '🧠');
        html += `<div class="cram-rules">${cram.solverRules.map((item) => `
            <div class="cram-rule-card">
                <div class="cram-rule-header color-${item.color}">${escapeHtml(item.keyword)}</div>
                <div class="cram-rule-body">${escapeHtml(item.rule)}</div>
            </div>`).join('')}</div>`;
    }

    if (cram.securitySection) {
        const sec = cram.securitySection;
        html += sectionHeading(sec.title, '🔐');
        html += `<div class="cram-cols-3">${sec.columns.map((col) => `
            <div class="cram-col-card">
                <h4 class="cram-col-title color-${col.color}">${escapeHtml(col.title)}</h4>
                ${col.items.map((item) => item.prefix
                    ? `<p><strong>${escapeHtml(item.prefix)}</strong> ${escapeHtml(item.text)}</p>`
                    : `<p>${escapeHtml(item.text)}</p>`).join('')}
            </div>`).join('')}</div>`;
    }

    if (cram.serviceChooserTable) {
        const t = cram.serviceChooserTable;
        html += sectionHeading(t.title, '🗂️');
        html += `<div class="cram-table-wrap"><table class="cram-table"><thead><tr>
            <th>Service area</th><th>Choose when you see</th><th>Watch out</th>
        </tr></thead><tbody>${t.rows.map((row) => `
            <tr>
                <td class="col-area color-${row.color}">${escapeHtml(row.area)}</td>
                <td class="col-choose">${escapeHtml(row.choose)}</td>
                <td class="col-trap">${escapeHtml(row.trap)}</td>
            </tr>`).join('')}</tbody></table></div>`;
    }

    const twoColPairs = [['s3Patterns', 'pricingPatterns'], ['cloudConcepts', 'migrationHybrid'], ['promptRagSection', 'responsibleAiSection']];
    const renderedTwoCol = new Set();
    for (const [leftKey, rightKey] of twoColPairs) {
        const left = cram[leftKey];
        const right = cram[rightKey];
        if (!left && !right) continue;
        html += '<div class="cram-two-col">';
        for (const key of [leftKey, rightKey]) {
            const section = cram[key];
            if (!section) continue;
            html += `<div class="cram-panel-card"><h3>${escapeHtml(section.title)}</h3>`;
            html += section.items.map((item) => {
                if (item.keyword) {
                    return `<p><strong class="color-${item.color}">${escapeHtml(item.keyword)}</strong> ${escapeHtml(item.text)}</p>`;
                }
                return `<p>${escapeHtml(item.text)}</p>`;
            }).join('');
            html += '</div>';
            renderedTwoCol.add(key);
        }
        html += '</div>';
    }

    if (cram.metricsSection && !renderedTwoCol.has('metricsSection')) {
        html += sectionHeading(cram.metricsSection.title, '📐');
        html += `<div class="cram-panel-card" style="margin-bottom:28px"><p style="font-size:13px;color:#cbd5e1;line-height:1.6">${cram.metricsSection.items.map((item) =>
            `<strong class="color-${item.color}">${escapeHtml(item.keyword)}</strong> ${escapeHtml(item.text)}`
        ).join('<br>')}</p></div>`;
    }

    if (cram.multiAnswerPatterns) {
        html += sectionHeading(cram.multiAnswerPatterns.title, '✅');
        html += `<div class="cram-multi">${cram.multiAnswerPatterns.items.map((item) => `
            <div class="cram-multi-item">
                <span class="cram-multi-kw color-${item.color}">${escapeHtml(item.keyword)}</span> ${escapeHtml(item.text)}
            </div>`).join('')}</div>`;
    }

    if (cram.trapPairs) {
        html += sectionHeading(cram.trapPairs.title, '⚠️');
        html += `<div class="cram-traps">${cram.trapPairs.items.map((item) => `
            <div class="cram-trap-item">${escapeHtml(item.text)}</div>`).join('')}</div>`;
    }

    html += `<div class="cram-section">${sectionHeading('Key Concepts', '📖')}<div class="concept-grid">${app.concepts.slice(0, 6).map(renderConceptCard).join('')}</div></div>`;

    document.getElementById('cheatsheet-content').innerHTML = html;
}

function renderQuiz() {
    if (!app.currentQuestions.length) {
        el.questionText.textContent = 'No questions in this session.';
        el.options.innerHTML = '';
        return;
    }

    const question = getCurrentQuestion();
    const answer = app.answered[question.id];
    const correct = normalizeCorrect(question);
    const isMulti = correct.length > 1;
    if (answer) {
        app.pending = [...answer.selected];
        app.pendingQuestionId = question.id;
    } else if (app.pendingQuestionId !== question.id) {
        app.pending = [];
        app.pendingQuestionId = question.id;
    }

    el.sessionLabel.textContent = `Session: ${app.sessionName} (${app.currentQuestions.length} questions)`;
    el.questionCounter.textContent = `Question ${app.currentIdx + 1} of ${app.currentQuestions.length} (PDF Q${question.n})`;
    el.questionText.textContent = question.q;
    el.questionTags.innerHTML = [
        `<span class="tag domain-tag">${escapeHtml(app.domains[String(question.domain)] || 'Domain')}</span>`,
        `<span class="tag">${isUniqueQuestion(question) ? 'Unique idea' : 'Repeat pattern'}</span>`,
        ...question.tags.map((tag) => `<span class="tag">${escapeHtml(labelize(tag))}</span>`)
    ].join('');
    el.prev.disabled = app.currentIdx === 0;
    el.next.textContent = app.currentIdx === app.currentQuestions.length - 1 ? 'Finish' : 'Next';
    el.explanation.classList.toggle('hidden', !answer);
    el.explanation.innerHTML = answer ? renderExplanation(question) : '';
    el.answerSummary.classList.toggle('hidden', !answer);
    el.answerSummary.innerHTML = answer ? renderAnswerSummary(question, answer) : '';
    el.peek.classList.toggle('hidden', Boolean(answer));
    el.peek.textContent = 'Peek answer';
    el.answerPeek.classList.add('hidden');
    el.answerPeek.innerHTML = `Correct answer: ${formatLetters(correct)} - ${correct.map((index) => escapeHtml(question.opts[index])).join(' | ')}`;

    el.multiControls.classList.toggle('hidden', Boolean(answer) || !isMulti);
    el.submit.disabled = app.pending.length !== correct.length;
    el.submit.textContent = `Submit ${correct.length} Answer${correct.length === 1 ? '' : 's'}`;
    el.selectionHint.textContent = `Selected ${app.pending.length}/${correct.length}. ${app.pending.length === correct.length ? 'Submit when ready.' : `Select exactly ${correct.length} answers.`}`;

    el.options.innerHTML = question.opts.map((option, index) => {
        let state = '';
        if (answer) {
            const selected = answer.selected.includes(index);
            const isCorrect = correct.includes(index);
            state = isCorrect ? ' correct' : selected ? ' wrong' : '';
        } else if (app.pending.includes(index)) {
            state = ' selected';
        }

        return `
            <button class="option${state}" type="button" data-option="${index}" aria-pressed="${app.pending.includes(index)}" ${answer ? 'disabled' : ''}>
                <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                <span>${escapeHtml(option)}</span>
            </button>
        `;
    }).join('');

    updateProgress();
}

function chooseOption(optionIndex) {
    const question = getCurrentQuestion();
    if (app.answered[question.id]) return;

    const required = normalizeCorrect(question).length;
    if (required <= 1) {
        app.pending = [optionIndex];
        submitPendingAnswer();
        return;
    }

    if (app.pending.includes(optionIndex)) {
        app.pending = app.pending.filter((value) => value !== optionIndex);
    } else if (app.pending.length < required) {
        app.pending = [...app.pending, optionIndex];
    }

    renderQuiz();
}

function submitPendingAnswer() {
    const question = getCurrentQuestion();
    if (!question || app.answered[question.id]) return;
    const correct = normalizeCorrect(question);
    if (app.pending.length !== correct.length) return;
    const selected = [...app.pending].sort((a, b) => a - b);
    app.answered[question.id] = {
        selected,
        c: sameNumbers(selected, correct),
        at: new Date().toISOString()
    };
    renderQuiz();
    saveProgress();
}

function renderAnswerSummary(question, answer) {
    const selected = normalizeSelected(answer);
    const correct = normalizeCorrect(question);
    const isCorrect = sameNumbers(selected, correct);
    const className = isCorrect ? 'answer-summary correct-summary' : 'answer-summary wrong-summary';
    el.answerSummary.className = className;
    return `${isCorrect ? 'Correct' : 'Incorrect'} - Correct answer: ${formatLetters(correct)}. Your answer: ${formatLetters(selected) || 'None'}.`;
}

function renderExplanation(question) {
    const concept = findConceptForQuestion(question);
    const conceptHtml = concept ? `
        <div class="question-concept">
            <div class="concept-kicker">Core concept: ${escapeHtml(concept.name)}</div>
            <p>${escapeHtml(concept.what || '')}</p>
            <ul>
                ${(concept.facts || []).slice(0, 3).map((fact) => `<li>${escapeHtml(fact)}</li>`).join('')}
            </ul>
        </div>
    ` : '';

    return `
        <strong>Explanation:</strong>
        <p>${escapeHtml(question.explain || '')}</p>
        ${conceptHtml}
    `;
}

function renderReview() {
    document.querySelectorAll('[data-review-filter]').forEach((button) => {
        button.classList.toggle('active', button.dataset.reviewFilter === app.reviewFilter);
    });

    const stats = calculateStats();
    el.reviewSummary.textContent = `${stats.answered} answered, ${stats.correct} correct, ${stats.wrong} wrong, ${stats.unseen} unseen.`;
    const rows = app.questions
        .filter((question) => app.reviewFilter === 'all' || getQuestionStatus(question) === app.reviewFilter)
        .map((question) => {
            const status = getQuestionStatus(question);
            return `
                <article class="review-item" data-review-q="${escapeAttr(question.id)}">
                    <div class="review-head">
                        <strong>PDF Q${question.n}: ${escapeHtml(question.q)}</strong>
                        <span class="answer-pill">${escapeHtml(labelize(status))}</span>
                    </div>
                    <span class="muted">${escapeHtml(question.explain || '')}</span>
                </article>
            `;
        });

    el.reviewList.innerHTML = rows.join('') || '<p class="muted">No questions match this review filter.</p>';
}

function renderConcepts() {
    document.getElementById('concept-count').textContent = `${app.concepts.length} topics`;
    const categories = ['All', ...new Set(app.concepts.map((concept) => concept.cat).filter(Boolean))];
    el.conceptCategories.innerHTML = categories
        .map((category) => `<button class="chip-btn${category === app.conceptCategory ? ' active' : ''}" type="button" data-concept-category="${escapeAttr(category)}">${escapeHtml(category)}</button>`)
        .join('');

    const concepts = app.concepts.filter((concept) => {
        const matchesCategory = app.conceptCategory === 'All' || concept.cat === app.conceptCategory;
        const text = `${concept.name} ${concept.cat} ${concept.what} ${concept.use} ${(concept.facts || []).join(' ')} ${(concept.traps || []).join(' ')}`.toLowerCase();
        return matchesCategory && (!app.conceptSearch || text.includes(app.conceptSearch));
    });

    el.conceptList.innerHTML = concepts.map(renderConceptCard).join('') || '<p class="muted">No concepts match this search.</p>';
}

function renderConceptCard(concept) {
    const facts = (concept.facts || []).slice(0, 3).map((fact) => `<li>${escapeHtml(fact)}</li>`).join('');
    const traps = (concept.traps || []).slice(0, 2).map((trap) => `<li>${escapeHtml(trap)}</li>`).join('');
    return `
        <article class="concept-card">
            <div class="panel-head">
                <div>
                    <span class="muted">${escapeHtml(concept.cat || 'Concept')}</span>
                    <h3>${escapeHtml(concept.name)}</h3>
                </div>
                <button class="chip-btn" type="button" data-concept-name="${escapeAttr(concept.name)}">Quiz</button>
            </div>
            <p>${escapeHtml(concept.what || '')}</p>
            <p class="muted">${escapeHtml(concept.use || '')}</p>
            ${facts ? `<strong>Facts</strong><ul>${facts}</ul>` : ''}
            ${traps ? `<strong>Traps</strong><ul>${traps}</ul>` : ''}
        </article>
    `;
}

function renderKeywords() {
    const curated = app.exam.keywordTriggers || [];
    const curatedHtml = curated.map((group) => `
        <article class="keyword-card keyword-group">
            <h3>${escapeHtml(group.category)}</h3>
            <div class="keyword-trigger-list">
                ${(group.items || []).map(([trigger, answer]) => `
                    <div class="keyword-trigger">
                        <span>${escapeHtml(trigger)}</span>
                        <strong>${escapeHtml(answer)}</strong>
                    </div>
                `).join('')}
            </div>
        </article>
    `).join('');

    const rulesHtml = (app.exam.guessingRules || []).length ? `
        <article class="keyword-card rules-card">
            <h3>${escapeHtml(app.exam.code)} Guessing Rules</h3>
            <ol>
                ${app.exam.guessingRules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join('')}
            </ol>
        </article>
    ` : '';

    const tagHtml = `
        <article class="keyword-card keyword-group">
            <h3>Question Tags</h3>
            <div class="tag-cloud">
                ${getTopTags(80).map(([tag, count]) => `<button class="tag keyword-tag" type="button" data-keyword="${escapeAttr(tag)}">${escapeHtml(labelize(tag))} <span>${count}</span></button>`).join('')}
            </div>
        </article>
    `;

    el.keywordList.innerHTML = `${curatedHtml}${rulesHtml}${tagHtml}`;
}

function renderAnalytics() {
    const stats = calculateStats();
    const uniqueIds = getUniqueQuestionIds(app.questions);
    const uniqueTotal = uniqueIds.size;
    const repeatedTotal = app.questions.length - uniqueTotal;
    const uniqueAnswered = app.questions.filter((question) => uniqueIds.has(question.id) && app.answered[question.id]).length;
    const repeatedAnswered = app.questions.filter((question) => !uniqueIds.has(question.id) && app.answered[question.id]).length;
    el.analyticsMetrics.innerHTML = [
        metricHtml(`${stats.accuracy}%`, 'accuracy'),
        metricHtml(stats.answered, 'answered'),
        metricHtml(stats.unseen, 'remaining'),
        metricHtml(`${uniqueAnswered}/${uniqueTotal}`, 'unique ideas'),
        metricHtml(`${Math.round((uniqueAnswered / Math.max(uniqueTotal, 1)) * 100)}%`, 'idea coverage'),
        metricHtml(`${repeatedAnswered}/${repeatedTotal}`, 'repeated drills')
    ].join('');

    document.getElementById('study-order-summary').textContent = `Smart order is active: the first ${uniqueTotal} questions are first exposure to distinct ideas, then ${repeatedTotal} repeated pattern questions appear at the end for reinforcement. PDF numbers stay unchanged for search and jump.`;
    renderStudyPath(uniqueTotal, uniqueAnswered);
    renderWeakAreas();
    renderRepeatedTopics();

    const byDomain = {};
    Object.keys(app.domains).forEach((domain) => {
        byDomain[domain] = { total: 0, answered: 0, correct: 0 };
    });

    app.questions.forEach((question) => {
        const key = String(question.domain || 'Other');
        if (!byDomain[key]) byDomain[key] = { total: 0, answered: 0, correct: 0 };
        byDomain[key].total += 1;
        const answer = app.answered[question.id];
        if (answer && answer.selected && answer.selected.length) {
            byDomain[key].answered += 1;
            if (answer.c) byDomain[key].correct += 1;
        }
    });

    el.domainStats.innerHTML = Object.entries(byDomain).map(([domain, stat]) => {
        const accuracy = stat.answered ? Math.round((stat.correct / stat.answered) * 100) : 0;
        const done = stat.total ? Math.round((stat.answered / stat.total) * 100) : 0;
        const label = app.domains[domain] || `Domain ${domain}`;
        return `
            <article class="metric">
                <strong>${accuracy}%</strong>
                <span>${escapeHtml(label)}</span>
                <span class="muted">${stat.answered}/${stat.total} answered</span>
                <div class="domain-bar"><span style="width: ${done}%"></span></div>
            </article>
        `;
    }).join('');
}

function renderStudyPath(uniqueTotal, uniqueAnswered) {
    const wrong = app.questions.filter((question) => getQuestionStatus(question) === 'wrong').length;
    const remainingUnique = Math.max(uniqueTotal - uniqueAnswered, 0);
    document.getElementById('hour-plan').innerHTML = [
        ['Step 1', 'Read Cheat Sheet + Keywords first. Do not start with all raw questions.', 'blue'],
        ['Step 2', `Run Smart order until the unique counter reaches 100%. Remaining unique ideas: ${remainingUnique}.`, 'purple'],
        ['Step 3', 'Open Analytics, drill weakest domains and repeated high-count topics.', 'amber'],
        ['Step 4', `Finish Wrong only (${wrong}) and Repeated concepts sessions. Use peek only when reviewing.`, 'red']
    ].map(([title, body, tone]) => `<div class="study-step ${tone}"><strong>${title}</strong><span>${escapeHtml(body)}</span></div>`).join('');
}

function renderWeakAreas() {
    const rows = Object.entries(app.domains).map(([domain, label]) => {
        const questions = app.questions.filter((question) => String(question.domain) === String(domain));
        const done = questions.filter((question) => app.answered[question.id]).length;
        const correct = questions.filter((question) => app.answered[question.id]?.c).length;
        const accuracy = done ? Math.round((correct / done) * 100) : 0;
        return { label, total: questions.length, done, accuracy };
    }).sort((a, b) => (a.done ? a.accuracy : -1) - (b.done ? b.accuracy : -1));

    document.getElementById('weak-area-list').innerHTML = rows.map((row) => {
        const state = row.done ? `${row.accuracy}% accuracy, ${row.done}/${row.total} practiced` : `Not practiced yet, ${row.total} questions`;
        return `<div class="mini-card"><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(state)}</span></div>`;
    }).join('');
}

function renderRepeatedTopics() {
    const repeated = [...getTopicStats(app.questions).values()]
        .filter((topic) => topic.total > 1)
        .sort((a, b) => b.total - a.total || a.key.localeCompare(b.key))
        .slice(0, 10);

    document.getElementById('repeat-topic-list').innerHTML = repeated.map((topic) => {
        const accuracy = topic.answered ? Math.round((topic.correct / topic.answered) * 100) : 0;
        const state = topic.answered ? `${accuracy}% after ${topic.answered}/${topic.total}` : `0/${topic.total} practiced`;
        return `<div class="mini-card"><div class="mini-card-head"><strong>${escapeHtml(topic.key)}</strong><span>${topic.total} Qs</span></div><span>${escapeHtml(state)}</span></div>`;
    }).join('') || '<p class="muted">No repeated topics detected.</p>';
}

function updateProgress() {
    const stats = calculateStats();
    el.progressText.textContent = `${stats.answered}/${app.questions.length}`;
    el.progressBar.style.width = `${stats.progress}%`;
}

function startSession(type) {
    const focus = (app.exam.focusSessions || []).find((session) => session.id === type);
    if (type === 'all') {
        app.currentQuestions = getStudyOrderedQuestions(app.questions);
        app.sessionName = 'Smart order: unique ideas first';
    } else if (type === 'random25') {
        app.currentQuestions = [...app.questions].sort(() => Math.random() - 0.5).slice(0, 25);
        app.sessionName = 'Random 25';
    } else if (type === 'wrong') {
        app.currentQuestions = getStudyOrderedQuestions(app.questions.filter((question) => getQuestionStatus(question) === 'wrong'));
        app.sessionName = 'Wrong answers';
    } else if (type === 'unseen') {
        app.currentQuestions = getStudyOrderedQuestions(app.questions.filter((question) => getQuestionStatus(question) === 'unseen'));
        app.sessionName = 'Unseen questions';
    } else if (type === 'repeated') {
        app.currentQuestions = getRepeatedQuestions(app.questions);
        app.sessionName = 'Repeated concepts review';
    } else if (focus) {
        app.currentQuestions = getStudyOrderedQuestions(app.questions.filter((question) => focus.tags.some((tag) => question.tags.includes(tag) || question.q.toLowerCase().includes(tag))));
        app.sessionName = focus.label;
    }

    if (!app.currentQuestions.length) {
        alert('No questions in this session yet.');
        app.currentQuestions = getStudyOrderedQuestions(app.questions);
        app.sessionName = 'Smart order: unique ideas first';
        type = 'all';
    }

    highlightActiveSession(type);
    highlightActiveFilter('all');
    app.currentIdx = 0;
    showTab('quiz');
    renderQuiz();
    debounceUpdateProgress();
}

function startTagSession(tag) {
    highlightActiveFilter(tag);
    if (tag === 'all') {
        startSession('all');
        return;
    }
    const matches = app.questions.filter((question) => question.tags.includes(tag));
    app.currentQuestions = getStudyOrderedQuestions(matches);
    app.currentIdx = 0;
    app.sessionName = `${labelize(tag)} questions`;
    highlightActiveSession(null);
    showTab('quiz');
    renderQuiz();
    debounceUpdateProgress();
}

function startConceptSession(name) {
    const concept = app.concepts.find((candidate) => candidate.name === name);
    if (!concept) return;
    const tags = concept.tags || [];
    app.currentQuestions = getStudyOrderedQuestions(app.questions.filter((question) => {
        const text = `${question.q} ${question.explain} ${question.tags.join(' ')}`.toLowerCase();
        return tags.some((tag) => text.includes(tag.toLowerCase()));
    }));
    if (!app.currentQuestions.length) {
        alert('No questions matched this concept yet.');
        return;
    }
    app.currentIdx = 0;
    app.sessionName = `${concept.name} concept quiz`;
    highlightActiveSession(null);
    highlightActiveFilter('all');
    showTab('quiz');
    renderQuiz();
    debounceUpdateProgress();
}

function jumpToQuestion(value) {
    const num = Number.parseInt(value, 10);
    if (!Number.isInteger(num) || num < 1 || num > app.questions.length) {
        alert(`Enter a question number from 1 to ${app.questions.length}.`);
        return;
    }
    app.currentQuestions = [...app.questions];
    app.currentIdx = num - 1;
    app.sessionName = `PDF Q${num}`;
    highlightActiveSession(null);
    highlightActiveFilter('all');
    el.jumpInput.value = String(num);
    showTab('quiz');
    renderQuiz();
    debounceUpdateProgress();
}

function loadProgress() {
    try {
        const saved = JSON.parse(localStorage.getItem(app.exam.storageKey) || 'null');
        if (!saved) return;
        app.savedQuestionId = saved.qid || null;
        app.answered = {};
        Object.entries(saved.a || {}).forEach(([key, value]) => {
            const id = key.startsWith('q-') ? key : `q-${Number(key) + 1}`;
            const question = app.questions.find((candidate) => candidate.id === id);
            const selected = normalizeSelected(value);
            if (!question || !selected.length) return;
            app.answered[id] = {
                selected,
                c: isCorrectAnswer(question, selected),
                at: value && value.at ? value.at : null
            };
        });
        app.currentIdx = Math.min(Math.max(saved.i || 0, 0), app.currentQuestions.length - 1);
    } catch (error) {}
}

function applySavedQuestion() {
    if (!app.savedQuestionId) return;
    const index = app.currentQuestions.findIndex((question) => question.id === app.savedQuestionId);
    if (index >= 0) app.currentIdx = index;
}

function saveProgress() {
    const current = getCurrentQuestion();
    localStorage.setItem(app.exam.storageKey, JSON.stringify({
        a: app.answered,
        i: app.currentIdx,
        qid: current ? current.id : null,
        qn: current ? current.n : null,
        session: app.sessionName,
        total: app.questions.length,
        updatedAt: new Date().toISOString()
    }));
}

function getCurrentQuestion() {
    return app.currentQuestions[app.currentIdx] || app.questions[0];
}

function getQuestionStatus(question) {
    const answer = app.answered[question.id];
    if (!answer) return 'unseen';
    return answer.c ? 'correct' : 'wrong';
}

function calculateStats() {
    let answered = 0;
    let correct = 0;
    Object.entries(app.answered).forEach(([id, answer]) => {
        const question = app.questions.find((candidate) => candidate.id === id);
        if (!question) return;
        const selected = normalizeSelected(answer);
        if (!selected.length) return;
        answered += 1;
        if (isCorrectAnswer(question, selected)) correct += 1;
    });
    const wrong = answered - correct;
    const unseen = app.questions.length - answered;
    return {
        answered,
        correct,
        wrong,
        unseen,
        progress: app.questions.length ? Math.round((answered / app.questions.length) * 100) : 0,
        accuracy: answered ? Math.round((correct / answered) * 100) : 0
    };
}

function normalizeCorrect(question) {
    if (Array.isArray(question.correct)) return question.correct.map(Number).sort((a, b) => a - b);
    if (typeof question.correct === 'string') return question.correct.split(',').map((value) => Number(value.trim())).sort((a, b) => a - b);
    return [Number(question.correct)].sort((a, b) => a - b);
}

function normalizeSelected(value) {
    if (!value && value !== 0) return [];
    if (Array.isArray(value.selected)) return value.selected.map(Number).sort((a, b) => a - b);
    if (Array.isArray(value)) return value.map(Number).sort((a, b) => a - b);
    if (typeof value === 'string') return value.split(',').map((item) => Number(item.trim())).filter(Number.isFinite).sort((a, b) => a - b);
    if (typeof value === 'number') return [value];
    return [];
}

function isCorrectAnswer(question, selected) {
    return sameNumbers(normalizeSelected(selected), normalizeCorrect(question));
}

function sameNumbers(left, right) {
    const a = [...left].map(Number).sort((x, y) => x - y);
    const b = [...right].map(Number).sort((x, y) => x - y);
    return a.length === b.length && a.every((value, index) => value === b[index]);
}

function findConceptForQuestion(question) {
    const text = `${question.q} ${question.explain || ''} ${question.tags.join(' ')}`.toLowerCase();
    return app.concepts.find((concept) => (concept.tags || []).some((tag) => text.includes(String(tag).toLowerCase()))) || null;
}

function getStudyKey(question) {
    const text = `${question.q} ${question.explain || ''} ${(question.tags || []).join(' ')}`.toLowerCase();
    const rule = STUDY_KEY_RULES.find(([, regex]) => regex.test(text));
    if (rule) return rule[0];
    const specificTags = (question.tags || []).filter((tag) => !GENERIC_STUDY_TAGS.has(tag));
    if (specificTags.length) return specificTags.slice(0, 2).map(labelize).join(' + ');
    const concept = findConceptForQuestion(question);
    return concept?.name || app.domains[String(question.domain)] || `Domain ${question.domain}`;
}

function getTopicStats(questions = app.questions) {
    const stats = new Map();
    questions.forEach((question) => {
        const key = getStudyKey(question);
        if (!stats.has(key)) stats.set(key, { key, total: 0, correct: 0, wrong: 0, answered: 0, first: question, domain: question.domain });
        const stat = stats.get(key);
        stat.total += 1;
        const status = getQuestionStatus(question);
        if (status !== 'unseen') stat.answered += 1;
        if (status === 'correct') stat.correct += 1;
        if (status === 'wrong') stat.wrong += 1;
    });
    return stats;
}

function getUniqueQuestionIds(questions = app.questions) {
    const seen = new Set();
    const ids = new Set();
    questions.forEach((question) => {
        const key = getStudyKey(question);
        if (!seen.has(key)) {
            seen.add(key);
            ids.add(question.id);
        }
    });
    return ids;
}

function isUniqueQuestion(question) {
    return getUniqueQuestionIds(app.questions).has(question.id);
}

function getStudyPriority(question) {
    const key = getStudyKey(question).toLowerCase();
    if (/security|iam|shared|responsible|guardrail|privacy|compliance|audit/.test(key)) return 1;
    if (/bedrock|foundation|prompt|rag|sagemaker|ai service/.test(key)) return 2;
    if (/compute|storage|database|network|learning|metrics/.test(key)) return 3;
    if (/billing|cost|caf|well-architected|architecture|migration/.test(key)) return 4;
    return 5;
}

function getStudyOrderedQuestions(questions) {
    const stats = getTopicStats(questions);
    const seen = new Set();
    const unique = [];
    const repeated = [];
    questions.forEach((question) => {
        const key = getStudyKey(question);
        if (seen.has(key)) repeated.push(question);
        else {
            seen.add(key);
            unique.push(question);
        }
    });
    unique.sort((a, b) => getStudyPriority(a) - getStudyPriority(b) || Number(a.domain) - Number(b.domain) || a.n - b.n);
    repeated.sort((a, b) => {
        const countDelta = (stats.get(getStudyKey(b))?.total || 0) - (stats.get(getStudyKey(a))?.total || 0);
        return countDelta || getStudyPriority(a) - getStudyPriority(b) || Number(a.domain) - Number(b.domain) || a.n - b.n;
    });
    return [...unique, ...repeated];
}

function getRepeatedQuestions(questions) {
    const seen = new Set();
    return getStudyOrderedQuestions(questions).filter((question) => {
        const key = getStudyKey(question);
        if (!seen.has(key)) {
            seen.add(key);
            return false;
        }
        return true;
    });
}

function getTopTags(limit) {
    const counts = new Map();
    app.questions.forEach((question) => {
        question.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit);
}

function questionMatchesSearch(question, term) {
    return question.q.toLowerCase().includes(term) ||
        String(question.explain || '').toLowerCase().includes(term) ||
        question.opts.some((option) => String(option).toLowerCase().includes(term)) ||
        question.tags.some((tag) => tag.toLowerCase().includes(term));
}

function metricHtml(value, label) {
    return `<div class="metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`;
}

function formatLetters(indices) {
    return normalizeSelected(indices).map((index) => String.fromCharCode(65 + index)).join(', ');
}

function labelize(value) {
    return String(value).replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function escapeAttr(value) {
    return escapeHtml(value).replaceAll('`', '&#96;');
}
