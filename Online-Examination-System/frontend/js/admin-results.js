(() => {
  function friendlyError(error, fallback) {
    if (error instanceof window.Api.ApiError) {
      if (error.status === 0) return 'Unable to reach the server. Check that the backend is running and try again.';
      if (error.status === 400) return 'The result request is invalid. Check the result ID and try again.';
      if (error.status === 404) return 'The requested result or exam could not be found.';
      if (error.status === 409) return 'The result request conflicts with the current data. Please refresh and try again.';
      if (error.status >= 500) return 'The server could not complete this request. Please try again later.';
    }
    return fallback;
  }

  function initializeAdminResults(page) {
    const detailSection = page.querySelector('[data-result-detail-section]');
    const listHeading = page.querySelector('[data-results-list-heading]');
    const filterSection = page.querySelector('[data-results-filter-section]');
    const listFeedback = page.querySelector('[data-results-feedback]');
    const listLoading = page.querySelector('[data-results-loading]');
    const listError = page.querySelector('[data-results-error]');
    const listErrorMessage = page.querySelector('[data-results-error-message]');
    const listEmpty = page.querySelector('[data-results-empty]');
    const listContent = page.querySelector('[data-results-content]');
    const resultRows = page.querySelector('[data-results-rows]');
    const emptyTitle = page.querySelector('[data-empty-results-title]');
    const emptyDescription = page.querySelector('[data-empty-results-description]');
    const examFilter = page.querySelector('[data-results-exam]');
    const examsFilterError = page.querySelector('[data-exams-filter-error]');
    const detailLoading = page.querySelector('[data-result-detail-loading]');
    const detailError = page.querySelector('[data-result-detail-error]');
    const detailErrorMessage = page.querySelector('[data-result-detail-error-message]');
    const detailContent = page.querySelector('[data-result-detail-content]');

    function showListState(state) {
      listLoading.classList.toggle('d-none', state !== 'loading');
      listError.classList.toggle('d-none', state !== 'error');
      listEmpty.classList.toggle('d-none', state !== 'empty');
      listContent.classList.toggle('d-none', state !== 'content');
    }

    function showDetailState(state) {
      detailLoading.classList.toggle('d-none', state !== 'loading');
      detailError.classList.toggle('d-none', state !== 'error');
      detailContent.classList.toggle('d-none', state !== 'content');
    }

    function isUnauthorized(error) {
      return error instanceof window.Api.ApiError && (error.status === 401 || error.status === 403);
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
      else badge.classList.add('text-bg-light', 'border');
      return badge;
    }

    function cell(value, className = '') {
      const element = document.createElement('td');
      element.textContent = displayValue(value);
      if (className) element.className = className;
      return element;
    }

    function renderResults(results) {
      const rows = results.map((result) => {
        if (result?.resultId === null || result?.resultId === undefined) {
          throw new Error('The server returned a result without an ID. Refresh the results and try again.');
        }
        const row = document.createElement('tr');
        row.append(cell(result.resultId), cell(result.attemptId));
        row.append(cell(result.score));
        row.append(cell(`${displayValue(result.attemptedQuestions)} / ${displayValue(result.totalQuestions)}`));
        row.append(cell(result.percentage === null || result.percentage === undefined ? '—' : `${result.percentage}%`));
        const status = document.createElement('td');
        status.append(statusBadge(result.resultStatus));
        row.append(status);
        const actions = document.createElement('td');
        const details = document.createElement('a');
        details.className = 'btn btn-sm btn-outline-primary';
        details.href = `results.html?resultId=${encodeURIComponent(result.resultId)}`;
        details.textContent = 'View Details';
        actions.append(details);
        row.append(actions);
        return row;
      });
      resultRows.replaceChildren(...rows);
    }

    async function loadResults(examId = '') {
      showListState('loading');
      try {
        const path = examId
          ? `/api/admin/results/exam/${encodeURIComponent(examId)}`
          : '/api/admin/results';
        const response = await window.Api.get(path);
        if (response?.success !== true || !Array.isArray(response.data)) throw new Error('The server returned an unexpected results response.');
        if (response.data.length === 0) {
          emptyTitle.textContent = examId ? 'No results for this exam' : 'No results available';
          emptyDescription.textContent = 'No result records were returned for this selection.';
          showListState('empty');
          return;
        }
        renderResults(response.data);
        showListState('content');
      } catch (error) {
        if (isUnauthorized(error)) return;
        listErrorMessage.textContent = friendlyError(error, 'Unable to load results. Please try again.');
        showListState('error');
      }
    }

    async function loadExams() {
      const previousExamId = examFilter.value;
      examsFilterError.textContent = '';
      examsFilterError.classList.add('d-none');
      examFilter.disabled = true;
      try {
        const response = await window.Api.get('/api/admin/exams');
        if (response?.success !== true || !Array.isArray(response.data)) throw new Error('The server returned an unexpected exams response.');
        const options = [new Option('All Exams', '')];
        let previousExamStillExists = false;
        response.data.forEach((exam) => {
          if (exam?.id === null || exam?.id === undefined) return;
          const title = exam.title ? `${exam.title} (ID ${exam.id})` : `Exam ${exam.id}`;
          const examId = String(exam.id);
          if (examId === previousExamId) previousExamStillExists = true;
          options.push(new Option(title, examId));
        });
        examFilter.replaceChildren(...options);
        examFilter.value = previousExamStillExists ? previousExamId : '';
        examFilter.disabled = false;
        if (previousExamId && !previousExamStillExists) await loadResults('');
      } catch (error) {
        if (isUnauthorized(error)) return;
        examsFilterError.textContent = friendlyError(error, 'Exam filtering is unavailable. You can still view all results.');
        examsFilterError.classList.remove('d-none');
        examFilter.disabled = false;
      }
    }

    function renderDetail(result) {
      const requiredFields = ['resultId', 'attemptId', 'totalQuestions', 'attemptedQuestions', 'correctAnswers', 'wrongAnswers', 'unansweredQuestions', 'score', 'percentage', 'resultStatus'];
      if (!result || typeof result !== 'object' || requiredFields.some((field) => !(field in result))) {
        throw new Error('The server returned incomplete result details. Please try again.');
      }
      page.querySelector('[data-detail-result-id]').textContent = displayValue(result.resultId);
      page.querySelector('[data-detail-attempt-id]').textContent = displayValue(result.attemptId);
      page.querySelector('[data-detail-percentage]').textContent = result.percentage === null || result.percentage === undefined ? '—' : `${result.percentage}%`;
      const status = page.querySelector('[data-detail-status]');
      const newStatus = statusBadge(result.resultStatus);
      newStatus.setAttribute('data-detail-status', '');
      status.replaceWith(newStatus);
      for (const field of ['score', 'totalQuestions', 'attemptedQuestions', 'correctAnswers', 'wrongAnswers', 'unansweredQuestions']) {
        page.querySelector(`[data-detail-field="${field}"]`).textContent = displayValue(result[field]);
      }
    }

    async function loadResultDetail(resultId) {
      showDetailState('loading');
      try {
        const response = await window.Api.get(`/api/admin/results/${encodeURIComponent(resultId)}`);
        if (response?.success !== true || !response.data || typeof response.data !== 'object') throw new Error('The server returned an unexpected result response.');
        renderDetail(response.data);
        showDetailState('content');
      } catch (error) {
        if (isUnauthorized(error)) return;
        detailErrorMessage.textContent = friendlyError(error, 'Unable to load this result. Please try again.');
        showDetailState('error');
      }
    }

    function showMissingResultId() {
      detailErrorMessage.textContent = 'A valid result ID is required to view result details.';
      showDetailState('error');
    }

    const parameters = new URLSearchParams(window.location.search);
    const hasResultId = parameters.has('resultId');
    if (hasResultId) {
      listHeading.classList.add('d-none');
      filterSection.classList.add('d-none');
      listFeedback.classList.add('d-none');
      listLoading.classList.add('d-none');
      listError.classList.add('d-none');
      listEmpty.classList.add('d-none');
      listContent.classList.add('d-none');
      detailSection.classList.remove('d-none');
      const resultId = parameters.get('resultId')?.trim() ?? '';
      if (!/^[1-9]\d*$/.test(resultId)) showMissingResultId();
      else loadResultDetail(resultId);
      return;
    }

    page.querySelector('[data-retry-results]').addEventListener('click', () => loadResults(examFilter.value));
    page.querySelector('[data-retry-exams]').addEventListener('click', loadExams);
    examFilter.addEventListener('change', () => loadResults(examFilter.value));
    loadExams();
    loadResults();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.querySelector('[data-admin-results-page]');
    if (!page || !window.Auth.requireRole('ADMIN')) return;
    initializeAdminResults(page);
  });
})();
