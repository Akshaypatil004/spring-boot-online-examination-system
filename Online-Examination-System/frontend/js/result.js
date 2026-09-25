(() => {
  function formatDateTime(value) {
    if (value === null || value === undefined || value === '') return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  function displayValue(value) {
    return value === null || value === undefined || value === '' ? '—' : String(value);
  }

  function statusBadge(status) {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = displayValue(status);
    if (status === 'PASS') badge.classList.add('text-bg-success');
    else if (status === 'FAIL') badge.classList.add('text-bg-danger');
    else badge.classList.add('text-bg-secondary');
    return badge;
  }

  function showState(page, name) {
    const states = ['loading', 'error', 'empty', 'content'];
    states.forEach((state) => {
      const element = page.querySelector(`[data-${page.dataset.resultsView}-${state}]`);
      if (element) element.classList.toggle('d-none', state !== name);
    });
  }

  function studentResultErrorMessage(error, fallback) {
    if (!(error instanceof window.Api.ApiError)) return fallback;
    if (error.status === 404) return 'This result could not be found. It may have been removed or the link may be invalid.';
    if (error.status === 400) return 'The result request was invalid. Return to My Results and try again.';
    if (error.status === 0) return 'Unable to reach the server. Check your connection and try again.';
    if (error.status >= 500) return 'The results service is temporarily unavailable. Please try again later.';
    return fallback;
  }

  function initializeResults(page) {
    const message = page.querySelector('[data-results-error-message]');
    const rows = page.querySelector('[data-results-rows]');

    async function loadResults() {
      showState(page, 'loading');
      try {
        const response = await window.Api.get('/api/student/results');
        if (response?.success !== true || !Array.isArray(response.data)) {
          throw new Error('The server returned an unexpected results response. Please try again.');
        }
        if (response.data.length === 0) {
          showState(page, 'empty');
          return;
        }

        const resultRows = response.data.map((result) => {
          if (result.resultId === null || result.resultId === undefined) {
            throw new Error('The server returned a result without a result ID. Please refresh and try again.');
          }
          const row = document.createElement('tr');
          const identity = document.createElement('th');
          identity.scope = 'row';
          identity.textContent = `Result ${result.resultId}`;
          if (result.attemptId !== null && result.attemptId !== undefined) {
            const attempt = document.createElement('span');
            attempt.className = 'd-block small text-body-secondary';
            attempt.textContent = `Attempt ${result.attemptId}`;
            identity.append(attempt);
          }
          row.append(identity);

          const score = document.createElement('td');
          score.textContent = displayValue(result.score);
          row.append(score);

          const counts = document.createElement('td');
          counts.textContent = `${displayValue(result.attemptedQuestions)} / ${displayValue(result.totalQuestions)} attempted`;
          const correctCount = document.createElement('span');
          correctCount.className = 'd-block small text-body-secondary';
          correctCount.textContent = `${displayValue(result.correctAnswers)} correct · ${displayValue(result.wrongAnswers)} wrong · ${displayValue(result.unansweredQuestions)} unanswered`;
          counts.append(correctCount);
          row.append(counts);

          const percentage = document.createElement('td');
          percentage.textContent = result.percentage === null || result.percentage === undefined ? '—' : `${result.percentage}%`;
          row.append(percentage);
          const outcomeCell = document.createElement('td');
          outcomeCell.append(statusBadge(result.resultStatus));
          row.append(outcomeCell);

          const actionCell = document.createElement('td');
          const action = document.createElement('a');
          action.className = 'btn btn-sm btn-outline-primary';
          action.textContent = 'View details';
          action.href = `result.html?resultId=${encodeURIComponent(result.resultId)}`;
          actionCell.append(action);
          row.append(actionCell);
          return row;
        });
        rows.replaceChildren(...resultRows);
        showState(page, 'content');
      } catch (error) {
        if (error instanceof window.Api.ApiError && (error.status === 401 || error.status === 403)) return;
        message.textContent = studentResultErrorMessage(error, 'Unable to load your results. Please try again.');
        showState(page, 'error');
      }
    }

    page.querySelector('[data-results-retry]').addEventListener('click', loadResults);
    loadResults();
  }

  function initializeResultDetail(page) {
    const loading = page.querySelector('[data-result-loading]');
    const error = page.querySelector('[data-result-error]');
    const message = page.querySelector('[data-result-error-message]');
    const content = page.querySelector('[data-result-content]');
    const resultId = new URLSearchParams(window.location.search).get('resultId');

    async function loadResult() {
      loading.classList.remove('d-none');
      error.classList.add('d-none');
      content.classList.add('d-none');
      if (!resultId || !/^\d+$/.test(resultId)) {
        message.textContent = 'A valid result ID was not provided.';
        loading.classList.add('d-none');
        error.classList.remove('d-none');
        return;
      }
      try {
        const response = await window.Api.get(`/api/student/results/${encodeURIComponent(resultId)}`);
        const result = response?.data;
        if (response?.success !== true || !result || typeof result !== 'object') {
          throw new Error('The server returned an unexpected result response. Please try again.');
        }
        page.querySelector('[data-result-id]').textContent = displayValue(result.resultId);
        page.querySelector('[data-result-attempt-id]').textContent = displayValue(result.attemptId);
        page.querySelector('[data-result-percentage]').textContent = result.percentage === null || result.percentage === undefined ? '—' : `${result.percentage}%`;
        const badge = page.querySelector('[data-result-status]');
        const outcome = statusBadge(result.resultStatus);
        badge.className = outcome.className;
        badge.textContent = outcome.textContent;
        page.querySelectorAll('[data-result-field]').forEach((element) => {
          element.textContent = displayValue(result[element.dataset.resultField]);
        });
        loading.classList.add('d-none');
        content.classList.remove('d-none');
      } catch (requestError) {
        if (requestError instanceof window.Api.ApiError && (requestError.status === 401 || requestError.status === 403)) return;
        message.textContent = studentResultErrorMessage(requestError, 'Unable to load this result. Please try again.');
        loading.classList.add('d-none');
        error.classList.remove('d-none');
      }
    }

    loadResult();
  }

  function initializeAttempts(page) {
    const loading = page.querySelector('[data-attempts-loading]');
    const error = page.querySelector('[data-attempts-error]');
    const message = page.querySelector('[data-attempts-error-message]');
    const empty = page.querySelector('[data-attempts-empty]');
    const content = page.querySelector('[data-attempts-content]');
    const rows = page.querySelector('[data-attempts-rows]');

    function show(target) {
      [loading, error, empty, content].forEach((element) => element.classList.toggle('d-none', element !== target));
    }

    async function loadAttempts() {
      show(loading);
      try {
        const attemptsResponse = await window.Api.get('/api/student/attempts');
        if (attemptsResponse?.success !== true || !Array.isArray(attemptsResponse.data)) {
          throw new Error('The server returned an unexpected attempts response. Please try again.');
        }
        if (attemptsResponse.data.length === 0) {
          show(empty);
          return;
        }

        const submittedAttempts = attemptsResponse.data.filter((attempt) => attempt.status === 'SUBMITTED');
        let resultsByAttempt = new Map();
        if (submittedAttempts.length > 0) {
          try {
            const resultsResponse = await window.Api.get('/api/student/results');
            if (resultsResponse?.success === true && Array.isArray(resultsResponse.data)) {
              resultsByAttempt = new Map(resultsResponse.data
                .filter((result) => result.attemptId !== null && result.attemptId !== undefined)
                .map((result) => [String(result.attemptId), result]));
            }
          } catch (error) {
            if (error instanceof window.Api.ApiError && (error.status === 401 || error.status === 403)) return;
            // Attempt history remains useful when the separate result lookup is unavailable.
          }
        }

        const attemptRows = attemptsResponse.data.map((attempt) => {
          const row = document.createElement('tr');
          const exam = document.createElement('th');
          exam.scope = 'row';
          exam.textContent = displayValue(attempt.examTitle);
          const examId = document.createElement('span');
          examId.className = 'd-block small text-body-secondary';
          examId.textContent = `Exam ${displayValue(attempt.examId)} · Attempt ${displayValue(attempt.id)}`;
          exam.append(examId);
          row.append(exam);

          const started = document.createElement('td');
          started.textContent = formatDateTime(attempt.startedAt);
          row.append(started);

          const submitted = document.createElement('td');
          submitted.textContent = formatDateTime(attempt.submittedAt);
          row.append(submitted);

          const statusCell = document.createElement('td');
          const status = document.createElement('span');
          status.className = 'badge';
          status.textContent = displayValue(attempt.status);
          if (attempt.status === 'IN_PROGRESS') status.classList.add('text-bg-warning');
          else if (attempt.status === 'SUBMITTED') status.classList.add('text-bg-success');
          else status.classList.add('text-bg-secondary');
          statusCell.append(status);
          row.append(statusCell);

          const actionCell = document.createElement('td');
          if (attempt.status === 'IN_PROGRESS' && attempt.id !== null && attempt.id !== undefined) {
            const action = document.createElement('a');
            action.className = 'btn btn-sm btn-outline-primary';
            action.textContent = 'Resume attempt';
            action.href = `exam.html?attemptId=${encodeURIComponent(attempt.id)}`;
            actionCell.append(action);
          } else {
            const result = attempt.status === 'SUBMITTED'
              ? resultsByAttempt.get(String(attempt.id))
              : null;
            if (result?.resultId !== null && result?.resultId !== undefined) {
              const action = document.createElement('a');
              action.className = 'btn btn-sm btn-outline-primary';
              action.textContent = 'View Result';
              action.href = `result.html?resultId=${encodeURIComponent(result.resultId)}`;
              actionCell.append(action);
            } else {
              actionCell.textContent = attempt.status === 'SUBMITTED' ? 'Result not available' : '—';
            }
          }
          row.append(actionCell);
          return row;
        });
        rows.replaceChildren(...attemptRows);
        show(content);
      } catch (requestError) {
        if (requestError instanceof window.Api.ApiError && (requestError.status === 401 || requestError.status === 403)) return;
        if (requestError instanceof window.Api.ApiError && requestError.status === 0) {
          message.textContent = 'Unable to reach the server. Check your connection and try again.';
        } else if (requestError instanceof window.Api.ApiError && requestError.status >= 500) {
          message.textContent = 'Attempt history is temporarily unavailable. Please try again later.';
        } else {
          message.textContent = 'Unable to load your attempt history. Please try again.';
        }
        show(error);
      }
    }

    page.querySelector('[data-attempts-retry]').addEventListener('click', loadAttempts);
    loadAttempts();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.querySelector('[data-results-view]');
    if (!page || !window.Auth.requireRole('STUDENT')) return;
    if (page.dataset.resultsView === 'results') initializeResults(page);
    else if (page.dataset.resultsView === 'detail') initializeResultDetail(page);
    else if (page.dataset.resultsView === 'attempts') initializeAttempts(page);
  });
})();
