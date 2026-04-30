const state = {
    config: null
};

const els = {
    providers: document.getElementById('provider-grid'),
    exams: document.getElementById('exam-grid'),
    activeSites: document.getElementById('active-sites'),
    providerTracks: document.getElementById('provider-tracks'),
    questionTotal: document.getElementById('question-total'),
    overallProgress: document.getElementById('overall-progress'),
    lastUpdated: document.getElementById('last-updated'),
    error: document.getElementById('home-error')
};

init();

async function init() {
    try {
        const response = await fetch('data/exams.json', { cache: 'no-store' });
        if (!response.ok) throw new Error(`Could not load data/exams.json (${response.status})`);
        state.config = await response.json();
        render();
    } catch (error) {
        els.error.textContent = `Could not load the study lab data. Start a local server and open http://localhost:8000. Details: ${error.message}`;
        els.error.classList.remove('hidden');
    }
}

function render() {
    const liveExams = state.config.exams.filter((exam) => exam.status === 'live');
    const totalQuestions = liveExams.reduce((sum, exam) => sum + exam.questionTotal, 0);
    const progress = liveExams.map((exam) => ({ exam, progress: readProgress(exam) }));
    const answeredAll = progress.reduce((sum, item) => sum + item.progress.answered, 0);
    const latest = progress.map((item) => item.progress.updatedAt).filter(Boolean).sort().at(-1);

    els.activeSites.textContent = liveExams.length;
    els.providerTracks.textContent = state.config.providers.length;
    els.questionTotal.textContent = totalQuestions.toLocaleString();
    els.overallProgress.textContent = `${totalQuestions ? Math.round((answeredAll / totalQuestions) * 100) : 0}%`;
    els.lastUpdated.textContent = latest ? `Last saved ${new Date(latest).toLocaleString()}` : 'No saved progress yet';

    els.providers.innerHTML = state.config.providers.map(renderProvider).join('');
    els.exams.innerHTML = progress.map(({ exam, progress: examProgress }) => renderExam(exam, examProgress)).join('');

    document.querySelectorAll('[data-reset-key]').forEach((button) => {
        button.addEventListener('click', () => {
            if (!confirm('Reset saved progress for this exam?')) return;
            localStorage.removeItem(button.dataset.resetKey);
            render();
        });
    });
}

function renderProvider(provider) {
    const statusClass = provider.status === 'live' ? 'status-live' : 'status-planned';
    return `
        <article class="provider-card">
            <div class="provider-head">
                <h3>${escapeHtml(provider.name)}</h3>
                <span class="status-pill ${statusClass}">${escapeHtml(provider.status)}</span>
            </div>
            <p>${escapeHtml(provider.description)}</p>
        </article>
    `;
}

function renderExam(exam, progress) {
    const percent = Math.round((progress.answered / exam.questionTotal) * 100);
    const accuracy = progress.answered ? Math.round((progress.correct / progress.answered) * 100) : 0;
    const remaining = Math.max(exam.questionTotal - progress.answered, 0);
    const updated = progress.updatedAt ? `Last saved ${new Date(progress.updatedAt).toLocaleString()}` : 'No saved progress yet';

    return `
        <article class="exam-card">
            <div class="exam-head">
                <div>
                    <span class="muted">${escapeHtml(exam.provider)} | ${escapeHtml(exam.code)}</span>
                    <h3>${escapeHtml(exam.title)}</h3>
                </div>
                <span class="status-pill status-live">${exam.questionTotal} questions</span>
            </div>
            <p>${escapeHtml(exam.description)}</p>
            <div class="progress-wrap">
                <strong>${progress.answered}/${exam.questionTotal}</strong>
                <div class="bar" aria-hidden="true"><div class="bar-fill" style="width: ${percent}%"></div></div>
                <span class="muted">${percent}%</span>
            </div>
            <div class="metric-grid">
                <div class="metric"><strong>${accuracy}%</strong><span>accuracy</span></div>
                <div class="metric"><strong>${progress.current}</strong><span>saved question</span></div>
                <div class="metric"><strong>${remaining}</strong><span>remaining</span></div>
            </div>
            <div class="button-row">
                <a class="link-btn primary" href="exam.html?exam=${encodeURIComponent(exam.id)}">Open study site</a>
                <button class="reset-btn" type="button" data-reset-key="${escapeAttr(exam.storageKey)}">Reset progress</button>
            </div>
            <span class="muted">${escapeHtml(updated)}</span>
        </article>
    `;
}

function readProgress(exam) {
    try {
        const saved = JSON.parse(localStorage.getItem(exam.storageKey) || 'null');
        const answers = saved && saved.a ? saved.a : {};
        let answered = 0;
        let correct = 0;

        Object.values(answers).forEach((value) => {
            const answer = normalizeAnswer(value);
            if (!answer || !answer.selected || !answer.selected.length) return;
            answered += 1;
            if (answer.c === true) correct += 1;
        });

        return {
            answered,
            correct,
            current: Math.min(Math.max(Number(saved && saved.i ? saved.i : 0) + 1, 1), exam.questionTotal),
            updatedAt: saved && saved.updatedAt ? saved.updatedAt : null
        };
    } catch (error) {
        return { answered: 0, correct: 0, current: 1, updatedAt: null };
    }
}

function normalizeAnswer(answer) {
    if (!answer) return null;
    if (Array.isArray(answer.selected)) return answer;
    if (Array.isArray(answer)) return { selected: answer, c: false };
    if (typeof answer === 'number' || typeof answer === 'string') return { selected: [answer], c: false };
    return null;
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
