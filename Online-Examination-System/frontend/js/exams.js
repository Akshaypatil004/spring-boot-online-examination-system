(() => {
  function friendlyError(error, context) {
    if (error instanceof window.Api.ApiError) {
      if (error.status === 0) return 'Unable to reach the server. Check that the backend is running and try again. A browser CORS restriction may also block this action.';
      if (error.status === 400) return 'The exam details or requested status change are invalid. Review the information and try again.';
      if (error.status === 404) return 'The exam or selected subject could not be found. Refresh the page and try again.';
      if (error.status === 409) return 'This exam cannot be changed because it conflicts with existing data.';
      if (error.status >= 500) return 'The server could not complete this request. Please try again later.';
    }
    return context;
  }

  function initializeExams(page) {
    const loading = page.querySelector('[data-exams-loading]');
    const errorPanel = page.querySelector('[data-exams-error]');
    const errorMessage = page.querySelector('[data-exams-error-message]');
    const empty = page.querySelector('[data-exams-empty]');
    const content = page.querySelector('[data-exams-content]');
    const rows = page.querySelector('[data-exams-rows]');
    const feedback = page.querySelector('[data-exams-feedback]');
    const noSubjectsMessage = page.querySelector('[data-no-subjects-message]');
    const addButtons = page.querySelectorAll('[data-add-exam]');

    // The modal is a sibling of <main>, so resolve it from the document and scope its controls there.
    const modalElement = document.querySelector('[data-exam-modal]');
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
    const form = modalElement.querySelector('[data-exam-form]');
    const formError = modalElement.querySelector('[data-exam-form-error]');
    const modalTitle = modalElement.querySelector('[data-exam-modal-title]');
    const subjectSelect = form.elements.subjectId;
    const saveButton = modalElement.querySelector('[data-save-exam]');
    const saveLabel = modalElement.querySelector('[data-save-exam-label]');
    const saveSpinner = modalElement.querySelector('[data-save-exam-spinner]');
    let subjects = [];
    let subjectsLoaded = false;
    let editingId = null;
    let saving = false;
    const pendingActions = new Set();

    function showListState(state) {
      loading.classList.toggle('d-none', state !== 'loading');
      errorPanel.classList.toggle('d-none', state !== 'error');
      empty.classList.toggle('d-none', state !== 'empty');
      content.classList.toggle('d-none', state !== 'content');
    }

    function showFeedback(message, type = 'success') {
      feedback.textContent = message;
      feedback.className = `alert alert-${type}`;
      feedback.classList.remove('d-none');
    }

    function showRequestError(error, fallback) {
      if (error instanceof window.Api.ApiError && (error.status === 401 || error.status === 403)) return;
      showFeedback(friendlyError(error, fallback), 'danger');
    }

    function cell(value, className = '') {
      const element = document.createElement('td');
      element.textContent = value === null || value === undefined || value === '' ? '—' : String(value);
      if (className) element.className = className;
      return element;
    }

    function formatDateTime(value) {
      if (!value) return '—';
      return String(value).replace('T', ' ');
    }

    function makeAction(label, className, datasetName, id, accessibleName) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `btn btn-sm ${className} me-1 mb-1`;
      button.textContent = label;
      button.dataset[datasetName] = String(id);
      button.setAttribute('aria-label', `${label} ${accessibleName}`);
      return button;
    }

    function renderExams(exams) {
      const examRows = exams.map((exam) => {
        if (exam?.id === null || exam?.id === undefined) throw new Error('The server returned an exam without an ID. Refresh and try again.');
        const row = document.createElement('tr');
        row.append(cell(exam.id));
        const title = document.createElement('th');
        title.scope = 'row';
        title.textContent = exam.title ?? '—';
        row.append(title, cell(exam.subjectName), cell(exam.durationMinutes === null || exam.durationMinutes === undefined ? '—' : `${exam.durationMinutes} min`));
        row.append(cell(exam.totalMarks === null || exam.totalMarks === undefined ? '—' : `${exam.totalMarks} total / ${exam.passingMarks ?? '—'} passing`));
        row.append(cell(formatDateTime(exam.startTime)), cell(formatDateTime(exam.endTime)));

        const statusCell = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = exam.status ?? '—';
        if (exam.status === 'DRAFT') badge.classList.add('text-bg-secondary');
        else if (exam.status === 'PUBLISHED') badge.classList.add('text-bg-success');
        else if (exam.status === 'CLOSED') badge.classList.add('text-bg-dark');
        else badge.classList.add('text-bg-light', 'border');
        statusCell.append(badge);
        row.append(statusCell);

        const actions = document.createElement('td');
        actions.className = 'text-nowrap';
        const name = exam.title ?? `exam ${exam.id}`;
        if (exam.status === 'DRAFT') {
          actions.append(
            makeAction('Edit', 'btn-outline-primary', 'editExam', exam.id, name),
            makeAction('Publish', 'btn-outline-success', 'publishExam', exam.id, name),
            makeAction('Delete', 'btn-outline-danger', 'deleteExam', exam.id, name)
          );
        } else if (exam.status === 'PUBLISHED') {
          actions.append(makeAction('Close', 'btn-outline-secondary', 'closeExam', exam.id, name));
        } else {
          actions.textContent = '—';
        }
        row.append(actions);
        return row;
      });
      rows.replaceChildren(...examRows);
    }

    async function loadExams() {
      showListState('loading');
      try {
        const response = await window.Api.get('/api/admin/exams');
        if (response?.success !== true || !Array.isArray(response.data)) throw new Error('Unexpected exams response.');
        if (response.data.length === 0) {
          showListState('empty');
          return;
        }
        renderExams(response.data);
        showListState('content');
      } catch (error) {
        if (error instanceof window.Api.ApiError && (error.status === 401 || error.status === 403)) return;
        errorMessage.textContent = friendlyError(error, 'Unable to load exams. Please try again.');
        showListState('error');
      }
    }

    function updateSubjectAvailability(message, retry = false) {
      addButtons.forEach((button) => { button.disabled = subjects.length === 0; });
      noSubjectsMessage.replaceChildren(document.createTextNode(message));
      noSubjectsMessage.classList.toggle('d-none', subjects.length > 0);
      if (subjects.length > 0) return;
      if (retry) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-sm btn-outline-warning ms-2';
        button.textContent = 'Retry loading subjects';
        button.dataset.retrySubjects = '';
        noSubjectsMessage.append(button);
      } else {
        const link = document.createElement('a');
        link.className = 'alert-link ms-1';
        link.href = 'subjects.html';
        link.textContent = 'Manage subjects';
        noSubjectsMessage.append(link);
      }
    }

    async function loadSubjects() {
      try {
        const response = await window.Api.get('/api/admin/subjects');
        if (response?.success !== true || !Array.isArray(response.data)) throw new Error('Unexpected subjects response.');
        subjects = response.data.filter((subject) => subject?.id !== null && subject?.id !== undefined);
        subjectsLoaded = true;
        const options = [new Option('Select a subject', '')];
        subjects.forEach((subject) => {
          const label = subject.academicProgramName
            ? `${subject.name ?? 'Subject'} — ${subject.academicProgramName}`
            : String(subject.name ?? 'Subject');
          options.push(new Option(label, String(subject.id)));
        });
        subjectSelect.replaceChildren(...options);
        subjectSelect.disabled = subjects.length === 0;
        updateSubjectAvailability('Create a subject before adding or editing exams.');
      } catch (error) {
        if (error instanceof window.Api.ApiError && (error.status === 401 || error.status === 403)) return;
        subjects = [];
        subjectsLoaded = false;
        subjectSelect.replaceChildren(new Option('Subjects could not be loaded', ''));
        subjectSelect.disabled = true;
        updateSubjectAvailability(friendlyError(error, 'Subjects could not be loaded. Exam creation is unavailable.'), true);
      }
    }

    function clearForm() {
      form.reset();
      form.querySelectorAll('.is-invalid').forEach((field) => field.classList.remove('is-invalid'));
      formError.textContent = '';
      formError.classList.add('d-none');
    }

    function openCreateModal() {
      if (!subjectsLoaded || subjects.length === 0) return;
      editingId = null;
      clearForm();
      modalTitle.textContent = 'Add Exam';
      saveLabel.textContent = 'Save Exam';
      modal.show();
      form.elements.title.focus();
    }

    function toDateInput(value) {
      return value ? String(value).slice(0, 16) : '';
    }

    async function openEditModal(id) {
      if (!subjectsLoaded || subjects.length === 0) {
        showFeedback('Load or create a subject before editing exams.', 'warning');
        return;
      }
      clearForm();
      try {
        const response = await window.Api.get(`/api/admin/exams/${encodeURIComponent(id)}`);
        const exam = response?.data;
        if (response?.success !== true || !exam || typeof exam !== 'object') throw new Error('Unexpected exam response.');
        if (exam.status !== 'DRAFT') {
          showFeedback('Only draft exams can be edited.', 'warning');
          await loadExams();
          return;
        }
        if (!subjects.some((subject) => String(subject.id) === String(exam.subjectId))) {
          throw new Error('The exam’s subject is not in the available subject list. Reload subjects and try again.');
        }
        editingId = id;
        subjectSelect.value = String(exam.subjectId);
        form.elements.title.value = exam.title ?? '';
        form.elements.description.value = exam.description ?? '';
        form.elements.durationMinutes.value = exam.durationMinutes ?? '';
        form.elements.totalMarks.value = exam.totalMarks ?? '';
        form.elements.passingMarks.value = exam.passingMarks ?? '';
        form.elements.startTime.value = toDateInput(exam.startTime);
        form.elements.endTime.value = toDateInput(exam.endTime);
        modalTitle.textContent = 'Edit Exam';
        saveLabel.textContent = 'Save Changes';
        modal.show();
        form.elements.title.focus();
      } catch (error) {
        showRequestError(error, 'Unable to load this exam for editing. Please refresh and try again.');
      }
    }

    function setSaving(value) {
      saving = value;
      saveButton.disabled = value;
      saveSpinner.classList.toggle('d-none', !value);
      saveLabel.textContent = value ? 'Saving…' : editingId === null ? 'Save Exam' : 'Save Changes';
    }

    function validateBusinessRules() {
      const totalMarks = Number(form.elements.totalMarks.value);
      const passingMarks = Number(form.elements.passingMarks.value);
      const start = new Date(form.elements.startTime.value);
      const end = new Date(form.elements.endTime.value);
      const validPassing = Number.isInteger(passingMarks) && passingMarks >= 1 && Number.isInteger(totalMarks) && passingMarks <= totalMarks;
      const validStart = !Number.isNaN(start.getTime()) && start.getTime() > Date.now();
      const validEnd = !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end.getTime() > start.getTime();
      form.elements.passingMarks.classList.toggle('is-invalid', !validPassing);
      form.elements.startTime.classList.toggle('is-invalid', !validStart);
      form.elements.endTime.classList.toggle('is-invalid', !validEnd);
      return validPassing && validStart && validEnd;
    }

    function localDateTimeForApi(value) {
      return value.length === 16 ? `${value}:00` : value;
    }

    async function saveExam(event) {
      event.preventDefault();
      if (saving) return;
      formError.textContent = '';
      formError.classList.add('d-none');
      form.elements.title.value = form.elements.title.value.trim();
      form.elements.description.value = form.elements.description.value.trim();
      const valid = form.checkValidity() && validateBusinessRules();
      form.querySelectorAll(':invalid').forEach((field) => field.classList.add('is-invalid'));
      if (!valid || subjects.length === 0) {
        form.reportValidity();
        return;
      }

      const requestBody = {
        subjectId: Number(subjectSelect.value),
        title: form.elements.title.value,
        description: form.elements.description.value || null,
        durationMinutes: Number(form.elements.durationMinutes.value),
        totalMarks: Number(form.elements.totalMarks.value),
        passingMarks: Number(form.elements.passingMarks.value),
        startTime: localDateTimeForApi(form.elements.startTime.value),
        endTime: localDateTimeForApi(form.elements.endTime.value)
      };
      const requestId = editingId;
      setSaving(true);
      try {
        const response = requestId === null
          ? await window.Api.post('/api/admin/exams', requestBody)
          : await window.Api.put(`/api/admin/exams/${encodeURIComponent(requestId)}`, requestBody);
        if (response?.success !== true || !response.data || typeof response.data !== 'object') throw new Error('The server did not confirm the exam change.');
        modal.hide();
        showFeedback(requestId === null ? 'Exam created successfully.' : 'Exam updated successfully.');
        await loadExams();
      } catch (error) {
        if (error instanceof window.Api.ApiError && (error.status === 401 || error.status === 403)) return;
        formError.textContent = friendlyError(error, 'Unable to save this exam. Please review the values and try again.');
        formError.classList.remove('d-none');
      } finally {
        setSaving(false);
      }
    }

    async function performAction(id, action, button) {
      const key = `${action}:${id}`;
      if (pendingActions.has(key)) return;
      const names = { delete: 'delete this exam', publish: 'publish this exam', close: 'close this exam' };
      const questions = {
        delete: 'Are you sure you want to delete this exam? This cannot be undone.',
        publish: 'Are you sure you want to publish this exam?',
        close: 'Are you sure you want to close this exam?'
      };
      if (!window.confirm(questions[action])) return;

      pendingActions.add(key);
      button.disabled = true;
      try {
        if (action === 'delete') {
          await window.Api.request(`/api/admin/exams/${encodeURIComponent(id)}`, { method: 'DELETE' });
          showFeedback('Exam deleted successfully.');
        } else {
          const endpoint = action === 'publish' ? 'publish' : 'close';
          const response = await window.Api.request(`/api/admin/exams/${encodeURIComponent(id)}/${endpoint}`, { method: 'PATCH' });
          if (response?.success !== true || !response.data || typeof response.data !== 'object') throw new Error('The server did not confirm the status change.');
          showFeedback(action === 'publish' ? 'Exam published successfully.' : 'Exam closed successfully.');
        }
        await loadExams();
      } catch (error) {
        if (error instanceof window.Api.ApiError && (error.status === 401 || error.status === 403)) return;
        if (action === 'publish' && error instanceof window.Api.ApiError && error.status === 400) {
          showFeedback('Unable to publish. Add at least one question and make sure the sum of question marks equals the exam total marks. Also check that the exam start time is in the future.', 'danger');
          return;
        }
        if (action === 'delete' && error instanceof window.Api.ApiError && (error.status === 409 || error.status >= 500)) {
          showFeedback('This exam cannot currently be deleted. It may have dependent questions, attempts, or results.', 'danger');
          return;
        }
        const fallback = action === 'delete'
          ? 'This exam cannot currently be deleted. It may have dependent questions, attempts, or results.'
          : `Unable to ${names[action]}. Please try again.`;
        showRequestError(error, fallback);
      } finally {
        pendingActions.delete(key);
        button.disabled = false;
      }
    }

    addButtons.forEach((button) => button.addEventListener('click', openCreateModal));
    page.querySelector('[data-retry-exams]').addEventListener('click', loadExams);
    form.addEventListener('submit', saveExam);
    rows.addEventListener('click', (event) => {
      const button = event.target.closest('[data-edit-exam], [data-delete-exam], [data-publish-exam], [data-close-exam]');
      if (!button) return;
      if (button.dataset.editExam) openEditModal(button.dataset.editExam);
      else if (button.dataset.deleteExam) performAction(button.dataset.deleteExam, 'delete', button);
      else if (button.dataset.publishExam) performAction(button.dataset.publishExam, 'publish', button);
      else if (button.dataset.closeExam) performAction(button.dataset.closeExam, 'close', button);
    });
    noSubjectsMessage.addEventListener('click', (event) => {
      if (event.target.matches('[data-retry-subjects]')) loadSubjects();
    });
    modalElement.addEventListener('hidden.bs.modal', clearForm);
    form.addEventListener('input', (event) => event.target.classList.remove('is-invalid'));

    loadSubjects();
    loadExams();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.querySelector('[data-exams-page]');
    if (!page || !window.Auth.requireRole('ADMIN')) return;
    initializeExams(page);
  });
})();
