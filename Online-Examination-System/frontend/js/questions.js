(() => {
  function friendlyError(error, fallback) {
    if (error instanceof window.Api.ApiError) {
      if (error.status === 0) return 'Unable to reach the server. Check that the backend is running and try again.';
      if (error.status === 400) return 'Questions and options can only be changed while an exam is in DRAFT status. When adding an option, also confirm fewer than four options are already saved.';
      if (error.status === 404) return 'The selected exam or question could not be found. Refresh the page and try again.';
      if (error.status === 409) return 'This question change conflicts with existing data. Refresh and try again.';
      if (error.status >= 500) return 'The server could not complete this request. Please try again later.';
    }
    return fallback;
  }

  function initializeQuestions(page) {
    const examSelect = page.querySelector('[data-question-exam]');
    const examError = page.querySelector('[data-question-exams-error]');
    const loading = page.querySelector('[data-questions-loading]');
    const errorPanel = page.querySelector('[data-questions-error]');
    const errorMessage = page.querySelector('[data-questions-error-message]');
    const empty = page.querySelector('[data-questions-empty]');
    const content = page.querySelector('[data-questions-content]');
    const rows = page.querySelector('[data-questions-rows]');
    const feedback = page.querySelector('[data-questions-feedback]');
    const selectMessage = page.querySelector('[data-select-exam-message]');
    const addButton = page.querySelector('[data-add-question]');
    const optionsPanel = page.querySelector('[data-options-panel]');
    const optionsQuestion = page.querySelector('[data-options-question]');
    const optionsCount = page.querySelector('[data-options-count]');
    const optionsReadonly = page.querySelector('[data-options-readonly]');
    const optionsFeedback = page.querySelector('[data-options-feedback]');
    const optionsLoading = page.querySelector('[data-options-loading]');
    const optionsError = page.querySelector('[data-options-error]');
    const optionsErrorMessage = page.querySelector('[data-options-error-message]');
    const optionsEmpty = page.querySelector('[data-options-empty]');
    const optionsList = page.querySelector('[data-options-list]');
    const addOptionButton = page.querySelector('[data-add-option]');

    // The Bootstrap modal sits outside <main>; resolve it from the document and scope all modal selectors there.
    const modalElement = document.querySelector('[data-question-modal]');
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
    const form = modalElement.querySelector('[data-question-form]');
    const formError = modalElement.querySelector('[data-question-form-error]');
    const modalTitle = modalElement.querySelector('[data-question-modal-title]');
    const saveButton = modalElement.querySelector('[data-save-question]');
    const saveLabel = modalElement.querySelector('[data-save-question-label]');
    const saveSpinner = modalElement.querySelector('[data-save-question-spinner]');

    const optionModalElement = document.querySelector('[data-option-modal]');
    const optionModal = window.bootstrap.Modal.getOrCreateInstance(optionModalElement);
    const optionForm = optionModalElement.querySelector('[data-option-form]');
    const optionFormError = optionModalElement.querySelector('[data-option-form-error]');
    const saveOptionButton = optionModalElement.querySelector('[data-save-option]');
    const saveOptionLabel = optionModalElement.querySelector('[data-save-option-label]');
    const saveOptionSpinner = optionModalElement.querySelector('[data-save-option-spinner]');

    let exams = [];
    let questions = [];
    let optionRecords = [];
    let selectedExam = null;
    let selectedQuestion = null;
    let editingId = null;
    let saving = false;
    let savingOption = false;
    let listRequest = 0;
    let optionsRequest = 0;
    const pendingDeletes = new Set();

    function showQuestionState(state) {
      loading.classList.toggle('d-none', state !== 'loading');
      errorPanel.classList.toggle('d-none', state !== 'error');
      empty.classList.toggle('d-none', state !== 'empty');
      content.classList.toggle('d-none', state !== 'content');
      selectMessage.classList.toggle('d-none', state !== 'select');
    }

    function showFeedback(message, type = 'success') {
      feedback.textContent = message;
      feedback.className = `alert alert-${type}`;
      feedback.classList.remove('d-none');
    }

    function showOptionsFeedback(message, type = 'success') {
      optionsFeedback.textContent = message;
      optionsFeedback.className = `alert alert-${type}`;
      optionsFeedback.classList.remove('d-none');
    }

    function showOptionsState(state) {
      optionsLoading.classList.toggle('d-none', state !== 'loading');
      optionsError.classList.toggle('d-none', state !== 'error');
      optionsEmpty.classList.toggle('d-none', state !== 'empty');
      optionsList.classList.toggle('d-none', state !== 'content');
    }

    function updateOptionsAvailability() {
      const readOnly = selectedExam?.status !== 'DRAFT';
      const loadingOptions = !optionsLoading.classList.contains('d-none');
      const optionsFailed = !optionsError.classList.contains('d-none');
      optionsReadonly.classList.toggle('d-none', !readOnly);
      addOptionButton.disabled = !selectedQuestion || readOnly || optionRecords.length >= 4 || loadingOptions || optionsFailed || savingOption;
      if (loadingOptions) optionsCount.textContent = 'Loading option count…';
      else if (optionsFailed) optionsCount.textContent = 'Option count unavailable';
      else optionsCount.textContent = `${optionRecords.length} of 4 options added`;
    }

    function clearOptionSelection() {
      optionsRequest += 1;
      selectedQuestion = null;
      optionRecords = [];
      optionsPanel.classList.add('d-none');
      optionsQuestion.textContent = '';
      optionsList.replaceChildren();
      optionsFeedback.classList.add('d-none');
      showOptionsState('empty');
      updateOptionsAvailability();
    }

    function isUnauthorized(error) {
      return error instanceof window.Api.ApiError && (error.status === 401 || error.status === 403);
    }

    function cell(value, className = '') {
      const element = document.createElement('td');
      element.textContent = value === null || value === undefined || value === '' ? '—' : String(value);
      if (className) element.className = className;
      return element;
    }

    function makeButton(label, className, datasetName, question) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `btn btn-sm ${className} me-1 mb-1`;
      button.textContent = label;
      button.dataset[datasetName] = String(question.id);
      button.setAttribute('aria-label', `${label} question ${question.id}`);
      return button;
    }

    function renderQuestions(questions) {
      // The backend endpoint orders by questionOrder. Keep its order as returned.
      const questionRows = questions.map((question) => {
        if (question?.id === null || question?.id === undefined) throw new Error('The server returned a question without an ID. Refresh and try again.');
        const row = document.createElement('tr');
        row.append(cell(question.id));
        const text = document.createElement('th');
        text.scope = 'row';
        text.className = 'text-break';
        text.style.minWidth = '16rem';
        text.textContent = question.questionText ?? '—';
        row.append(text, cell(question.marks), cell(question.questionOrder));

        const statusCell = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = question.status ?? '—';
        if (question.status === 'ACTIVE') badge.classList.add('text-bg-success');
        else if (question.status === 'INACTIVE') badge.classList.add('text-bg-secondary');
        else badge.classList.add('text-bg-light', 'border');
        statusCell.append(badge);
        row.append(statusCell);

        const actions = document.createElement('td');
        actions.className = 'text-nowrap';
        actions.append(makeButton('Manage options', 'btn-outline-secondary', 'manageOptions', question));
        if (selectedExam?.status === 'DRAFT') {
          actions.append(
            makeButton('Edit', 'btn-outline-primary', 'editQuestion', question),
            makeButton('Delete', 'btn-outline-danger', 'deleteQuestion', question)
          );
        } else {
          actions.textContent = 'Read only';
        }
        row.append(actions);
        return row;
      });
      rows.replaceChildren(...questionRows);
    }

    function renderOptions(optionList) {
      const items = optionList.map((option) => {
        const item = document.createElement('div');
        item.className = 'list-group-item d-flex flex-column flex-sm-row justify-content-between align-items-sm-start gap-2';
        const details = document.createElement('div');
        details.className = 'flex-grow-1';
        const heading = document.createElement('div');
        heading.className = 'fw-semibold text-break';
        heading.textContent = `${option.optionLabel ?? 'Unlabelled option'}${option.id === null || option.id === undefined ? '' : ` · ID ${option.id}`}`;
        const text = document.createElement('div');
        text.className = 'text-body-secondary text-break';
        text.textContent = option.optionText ?? '—';
        details.append(heading, text);
        item.append(details);
        return item;
      });
      optionsList.replaceChildren(...items);
    }

    async function loadOptions(preserveFeedback = false) {
      if (!selectedQuestion) return;
      const questionId = selectedQuestion.id;
      const requestNumber = ++optionsRequest;
      optionRecords = [];
      if (!preserveFeedback) optionsFeedback.classList.add('d-none');
      showOptionsState('loading');
      updateOptionsAvailability();
      try {
        const response = await window.Api.get(`/api/admin/questions/${encodeURIComponent(questionId)}/options`);
        if (requestNumber !== optionsRequest) return;
        if (response?.success !== true || !Array.isArray(response.data)) throw new Error('The server returned an unexpected options response.');
        optionRecords = response.data;
        renderOptions(optionRecords);
        showOptionsState(optionRecords.length === 0 ? 'empty' : 'content');
        updateOptionsAvailability();
      } catch (error) {
        if (requestNumber !== optionsRequest || isUnauthorized(error)) return;
        optionsErrorMessage.textContent = friendlyError(error, 'Unable to load options. Please try again.');
        showOptionsState('error');
        updateOptionsAvailability();
      }
    }

    function selectQuestionOptions(questionId) {
      selectedQuestion = questions.find((question) => String(question.id) === String(questionId)) ?? null;
      if (!selectedQuestion) return;
      optionsPanel.classList.remove('d-none');
      optionsQuestion.textContent = `Question ${selectedQuestion.id}: ${selectedQuestion.questionText ?? ''}`;
      optionRecords = [];
      optionsCount.textContent = 'Loading option count…';
      optionsReadonly.classList.toggle('d-none', selectedExam?.status === 'DRAFT');
      optionsFeedback.classList.add('d-none');
      loadOptions();
      optionsPanel.scrollIntoView();
    }

    function openCreateOptionModal() {
      if (!selectedQuestion || selectedExam?.status !== 'DRAFT' || optionRecords.length >= 4 || savingOption) return;
      optionForm.reset();
      optionForm.querySelectorAll('.is-invalid').forEach((field) => field.classList.remove('is-invalid'));
      optionFormError.textContent = '';
      optionFormError.classList.add('d-none');
      saveOptionLabel.textContent = 'Save Option';
      optionModal.show();
      optionForm.elements.optionLabel.focus();
    }

    function setSavingOption(value) {
      savingOption = value;
      saveOptionButton.disabled = value;
      saveOptionSpinner.classList.toggle('d-none', !value);
      saveOptionLabel.textContent = value ? 'Saving…' : 'Save Option';
      updateOptionsAvailability();
    }

    async function saveOption(event) {
      event.preventDefault();
      if (savingOption || !selectedQuestion || selectedExam?.status !== 'DRAFT' || optionRecords.length >= 4) return;
      optionFormError.textContent = '';
      optionFormError.classList.add('d-none');
      optionForm.elements.optionLabel.value = optionForm.elements.optionLabel.value.trim();
      optionForm.elements.optionText.value = optionForm.elements.optionText.value.trim();
      const valid = optionForm.checkValidity();
      optionForm.querySelectorAll(':invalid').forEach((field) => field.classList.add('is-invalid'));
      if (!valid) {
        optionForm.reportValidity();
        return;
      }

      const requestBody = {
        optionText: optionForm.elements.optionText.value,
        optionLabel: optionForm.elements.optionLabel.value,
        correct: optionForm.elements.correct.checked
      };
      const questionId = selectedQuestion.id;
      setSavingOption(true);
      try {
        const response = await window.Api.post(`/api/admin/questions/${encodeURIComponent(questionId)}/options`, requestBody);
        if (response?.success !== true || !response.data || typeof response.data !== 'object') throw new Error('The server did not confirm the option creation.');
        optionModal.hide();
        showOptionsFeedback('Option created successfully.');
        await loadOptions(true);
      } catch (error) {
        if (isUnauthorized(error)) return;
        optionFormError.textContent = friendlyError(error, 'Unable to create this option. Review the values and try again.');
        optionFormError.classList.remove('d-none');
      } finally {
        setSavingOption(false);
      }
    }

    function updateSelectedExam(examId) {
      selectedExam = exams.find((exam) => String(exam.id) === String(examId)) ?? null;
      addButton.disabled = !selectedExam || selectedExam.status !== 'DRAFT';
      if (selectedExam && selectedExam.status !== 'DRAFT') {
        showFeedback(`This exam is ${selectedExam.status.toLowerCase()}. Its questions can be viewed but not changed.`, 'warning');
      }
    }

    async function loadQuestions() {
      clearOptionSelection();
      const examId = examSelect.value;
      updateSelectedExam(examId);
      const requestNumber = ++listRequest;
      if (!examId || !selectedExam) {
        showQuestionState('select');
        return;
      }

      showQuestionState('loading');
      try {
        const response = await window.Api.get(`/api/admin/exams/${encodeURIComponent(examId)}/questions`);
        if (requestNumber !== listRequest) return;
        if (response?.success !== true || !Array.isArray(response.data)) throw new Error('The server returned an unexpected questions response.');
        questions = response.data;
        if (questions.length === 0) {
          showQuestionState('empty');
          return;
        }
        renderQuestions(questions);
        showQuestionState('content');
      } catch (error) {
        if (requestNumber !== listRequest || isUnauthorized(error)) return;
        errorMessage.textContent = friendlyError(error, 'Unable to load questions. Please try again.');
        showQuestionState('error');
      }
    }

    async function loadExams() {
      examError.textContent = '';
      examError.classList.add('d-none');
      examSelect.disabled = true;
      try {
        const response = await window.Api.get('/api/admin/exams');
        if (response?.success !== true || !Array.isArray(response.data)) throw new Error('The server returned an unexpected exams response.');
        exams = response.data.filter((exam) => exam?.id !== null && exam?.id !== undefined);
        const options = [new Option('Select an exam', '')];
        exams.forEach((exam) => {
          const label = `${exam.title ?? `Exam ${exam.id}`} — ${exam.status ?? 'Status unavailable'}`;
          options.push(new Option(label, String(exam.id)));
        });
        examSelect.replaceChildren(...options);
        examSelect.disabled = exams.length === 0;
        examSelect.value = '';
        selectedExam = null;
        addButton.disabled = true;
        showQuestionState('select');
        if (exams.length === 0) {
          examError.textContent = 'No exams are available. Create an exam before managing its questions.';
          examError.classList.remove('d-none');
        }
      } catch (error) {
        if (isUnauthorized(error)) return;
        examError.textContent = friendlyError(error, 'Unable to load exams. Please retry.');
        examError.classList.remove('d-none');
        examSelect.replaceChildren(new Option('Exams could not be loaded', ''));
        examSelect.disabled = true;
        addButton.disabled = true;
        showQuestionState('select');
      }
    }

    function clearForm() {
      form.reset();
      form.querySelectorAll('.is-invalid').forEach((field) => field.classList.remove('is-invalid'));
      formError.textContent = '';
      formError.classList.add('d-none');
      editingId = null;
    }

    function openCreateModal() {
      if (!selectedExam || selectedExam.status !== 'DRAFT') return;
      clearForm();
      modalTitle.textContent = 'Add Question';
      saveLabel.textContent = 'Save Question';
      modal.show();
      form.elements.questionText.focus();
    }

    async function openEditModal(id) {
      if (!selectedExam || selectedExam.status !== 'DRAFT') return;
      clearForm();
      try {
        const response = await window.Api.get(`/api/admin/questions/${encodeURIComponent(id)}`);
        const question = response?.data;
        if (response?.success !== true || !question || typeof question !== 'object') throw new Error('The server returned an unexpected question response.');
        if (String(question.examId) !== String(selectedExam.id)) {
          throw new Error('This question does not belong to the selected exam. Refresh the question list and try again.');
        }
        editingId = id;
        form.elements.questionText.value = question.questionText ?? '';
        form.elements.marks.value = question.marks ?? '';
        form.elements.questionOrder.value = question.questionOrder ?? '';
        modalTitle.textContent = 'Edit Question';
        saveLabel.textContent = 'Save Changes';
        modal.show();
        form.elements.questionText.focus();
      } catch (error) {
        if (isUnauthorized(error)) return;
        showFeedback(friendlyError(error, 'Unable to load this question for editing.'), 'danger');
      }
    }

    function setSaving(value) {
      saving = value;
      saveButton.disabled = value;
      saveSpinner.classList.toggle('d-none', !value);
      saveLabel.textContent = value ? 'Saving…' : editingId === null ? 'Save Question' : 'Save Changes';
    }

    function positiveWholeNumber(value) {
      const number = Number(value);
      return value.trim() !== '' && Number.isSafeInteger(number) && number >= 1;
    }

    async function saveQuestion(event) {
      event.preventDefault();
      if (saving || !selectedExam || selectedExam.status !== 'DRAFT') return;
      formError.textContent = '';
      formError.classList.add('d-none');
      form.elements.questionText.value = form.elements.questionText.value.trim();
      const marksValid = positiveWholeNumber(form.elements.marks.value);
      const orderValid = positiveWholeNumber(form.elements.questionOrder.value);
      form.elements.marks.classList.toggle('is-invalid', !marksValid);
      form.elements.questionOrder.classList.toggle('is-invalid', !orderValid);
      const valid = form.checkValidity() && marksValid && orderValid;
      form.querySelectorAll(':invalid').forEach((field) => field.classList.add('is-invalid'));
      if (!valid) {
        form.reportValidity();
        return;
      }

      const requestBody = {
        questionText: form.elements.questionText.value,
        marks: Number(form.elements.marks.value),
        questionOrder: Number(form.elements.questionOrder.value)
      };
      const requestId = editingId;
      const examId = selectedExam.id;
      setSaving(true);
      try {
        const response = requestId === null
          ? await window.Api.post(`/api/admin/exams/${encodeURIComponent(examId)}/questions`, requestBody)
          : await window.Api.put(`/api/admin/questions/${encodeURIComponent(requestId)}`, requestBody);
        if (response?.success !== true || !response.data || typeof response.data !== 'object') throw new Error('The server did not confirm the question change.');
        modal.hide();
        showFeedback(requestId === null ? 'Question created successfully.' : 'Question updated successfully.');
        await loadQuestions();
      } catch (error) {
        if (isUnauthorized(error)) return;
        formError.textContent = friendlyError(error, 'Unable to save this question. Review the fields and try again.');
        formError.classList.remove('d-none');
      } finally {
        setSaving(false);
      }
    }

    async function deleteQuestion(id, button) {
      if (!selectedExam || selectedExam.status !== 'DRAFT' || pendingDeletes.has(String(id))) return;
      if (!window.confirm('Are you sure you want to delete this question? This cannot be undone.')) return;
      pendingDeletes.add(String(id));
      button.disabled = true;
      try {
        await window.Api.request(`/api/admin/questions/${encodeURIComponent(id)}`, { method: 'DELETE' });
        showFeedback('Question deleted successfully.');
        await loadQuestions();
      } catch (error) {
        if (isUnauthorized(error)) return;
        showFeedback(friendlyError(error, 'Unable to delete this question. It may be in use by existing exam data.'), 'danger');
      } finally {
        pendingDeletes.delete(String(id));
        button.disabled = false;
      }
    }

    examSelect.addEventListener('change', () => {
      feedback.classList.add('d-none');
      loadQuestions();
    });
    page.querySelector('[data-retry-question-exams]').addEventListener('click', loadExams);
    page.querySelector('[data-retry-questions]').addEventListener('click', loadQuestions);
    addButton.addEventListener('click', openCreateModal);
    rows.addEventListener('click', (event) => {
      const manageOptions = event.target.closest('[data-manage-options]');
      const edit = event.target.closest('[data-edit-question]');
      const remove = event.target.closest('[data-delete-question]');
      if (manageOptions) selectQuestionOptions(manageOptions.dataset.manageOptions);
      else if (edit) openEditModal(edit.dataset.editQuestion);
      else if (remove) deleteQuestion(remove.dataset.deleteQuestion, remove);
    });
    form.addEventListener('submit', saveQuestion);
    form.addEventListener('input', (event) => event.target.classList.remove('is-invalid'));
    modalElement.addEventListener('hidden.bs.modal', clearForm);
    addOptionButton.addEventListener('click', openCreateOptionModal);
    page.querySelector('[data-retry-options]').addEventListener('click', loadOptions);
    optionForm.addEventListener('submit', saveOption);
    optionForm.addEventListener('input', (event) => event.target.classList.remove('is-invalid'));

    showQuestionState('select');
    loadExams();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.querySelector('[data-questions-page]');
    if (!page || !window.Auth.requireRole('ADMIN')) return;
    initializeQuestions(page);
  });
})();
