(() => {
  function initializeProfile(page) {
    const loading = page.querySelector('[data-student-loading]');
    const errorPanel = page.querySelector('[data-student-error]');
    const errorMessage = page.querySelector('[data-student-error-message]');
    const content = page.querySelector('[data-student-content]');
    const retryButton = page.querySelector('[data-student-retry]');

    function displayProfile(profile) {
      page.querySelectorAll('[data-field]').forEach((element) => {
        const property = element.dataset.field;
        const value = profile[property];
        const hasValue = value !== null && value !== undefined && value !== '';
        const displayValue = hasValue ? String(value) : 'Not provided';
        element.textContent = `${displayValue}${hasValue ? (element.dataset.suffix || '') : ''}`;
      });
    }

    async function loadProfile() {
      loading.classList.remove('d-none');
      errorPanel.classList.add('d-none');
      content.classList.add('d-none');
      try {
        const response = await window.Api.get('/api/students/me');
        if (response?.success !== true || !response.data || typeof response.data !== 'object') {
          throw new Error('The server returned an incomplete student profile. Please try again.');
        }
        displayProfile(response.data);
        loading.classList.add('d-none');
        content.classList.remove('d-none');
      } catch (error) {
        if (error instanceof window.Api.ApiError && (error.status === 401 || error.status === 403)) return;
        errorMessage.textContent = error instanceof window.Api.ApiError && error.status === 404
          ? 'We could not find a student profile for this account.'
          : error.message || 'Unable to load your profile. Please try again.';
        loading.classList.add('d-none');
        errorPanel.classList.remove('d-none');
      }
    }

    retryButton.addEventListener('click', loadProfile);
    document.addEventListener('DOMContentLoaded', () => {
      if (window.Auth.requireRole('STUDENT')) loadProfile();
    });
  }

  function initializeAvailableExams(page) {
    const loading = page.querySelector('[data-exams-loading]');
    const errorPanel = page.querySelector('[data-exams-error]');
    const errorMessage = page.querySelector('[data-exams-error-message]');
    const emptyPanel = page.querySelector('[data-exams-empty]');
    const list = page.querySelector('[data-exams-list]');
    const retryButton = page.querySelector('[data-exams-retry]');

    function showOnly(target) {
      [loading, errorPanel, emptyPanel, list].forEach((element) => element.classList.add('d-none'));
      if (target) target.classList.remove('d-none');
    }

    function formatDateTime(value) {
      if (value === null || value === undefined || value === '') return 'Not provided';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
    }

    function setValue(element, value, suffix = '') {
      const hasValue = value !== null && value !== undefined && value !== '';
      element.textContent = hasValue ? `${value}${suffix}` : 'Not provided';
    }

    function createExamCard(exam) {
      if (exam.id === null || exam.id === undefined) {
        throw new Error('The server returned an exam without an ID. Please refresh and try again.');
      }

      const column = document.createElement('div');
      column.className = 'col-12 col-lg-6';
      const card = document.createElement('article');
      card.className = 'exam-card h-100';

      const header = document.createElement('div');
      header.className = 'exam-card-header';
      const subject = document.createElement('p');
      subject.className = 'exam-subject';
      setValue(subject, exam.subjectName);
      const title = document.createElement('h2');
      title.className = 'h5 exam-title';
      setValue(title, exam.title);
      header.append(subject, title);
      card.append(header);

      if (exam.description) {
        const description = document.createElement('p');
        description.className = 'exam-description';
        description.textContent = exam.description;
        card.append(description);
      }

      const details = document.createElement('dl');
      details.className = 'exam-details';
      [
        ['Duration', exam.durationMinutes, ' min'],
        ['Total marks', exam.totalMarks, ''],
        ['Passing marks', exam.passingMarks, ''],
        ['Starts', formatDateTime(exam.startTime), ''],
        ['Ends', formatDateTime(exam.endTime), '']
      ].forEach(([label, value, suffix]) => {
        const detail = document.createElement('div');
        detail.className = 'exam-detail';
        const term = document.createElement('dt');
        term.textContent = label;
        const description = document.createElement('dd');
        setValue(description, value, suffix);
        detail.append(term, description);
        details.append(detail);
      });
      card.append(details);

      const actions = document.createElement('div');
      actions.className = 'exam-card-actions';
      const startLink = document.createElement('a');
      startLink.className = 'btn btn-primary';
      startLink.textContent = 'Start Exam';
      const destination = new URL('exam-start.html', window.location.href);
      destination.searchParams.set('examId', String(exam.id));
      startLink.href = destination.href;
      actions.append(startLink);
      card.append(actions);
      column.append(card);
      return column;
    }

    async function loadExams() {
      showOnly(loading);
      try {
        const response = await window.Api.get('/api/student/exams/available');
        if (response?.success !== true || !Array.isArray(response.data)) {
          throw new Error('The server returned an unexpected available-exams response. Please try again.');
        }
        if (response.data.length === 0) {
          showOnly(emptyPanel);
          return;
        }

        const cards = response.data.map(createExamCard);
        list.replaceChildren(...cards);
        showOnly(list);
      } catch (error) {
        if (error instanceof window.Api.ApiError && (error.status === 401 || error.status === 403)) return;
        errorMessage.textContent = error instanceof window.Api.ApiError && error.status === 0
          ? 'Unable to connect to the examination service. Please try again.'
          : error.message || 'Unable to load available exams. Please try again.';
        showOnly(errorPanel);
      }
    }

    retryButton.addEventListener('click', loadExams);
    document.addEventListener('DOMContentLoaded', () => {
      if (window.Auth.requireRole('STUDENT')) loadExams();
    });
  }

  const page = document.querySelector('[data-student-view]');
  if (!page) return;
  if (page.dataset.studentView === 'available-exams') initializeAvailableExams(page);
  else initializeProfile(page);
})();
