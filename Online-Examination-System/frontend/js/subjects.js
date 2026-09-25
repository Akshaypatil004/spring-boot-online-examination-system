(() => {
  function requestErrorMessage(error, fallback) {
    if (error instanceof window.Api.ApiError) {
      if (error.status === 0) return 'Unable to reach the server. Check that the backend is running and try again.';
      if (error.status === 400) return 'Some subject information is invalid. Review the fields and try again.';
      if (error.status === 404) return 'The subject or academic program could not be found. Refresh the page and try again.';
      if (error.status === 409) return 'A subject with this name already exists in the selected academic program.';
      if (error.status >= 500) return 'The server could not complete this request. Please try again later.';
    }
    return fallback;
  }

  function initializeSubjects(page) {
    const loading = page.querySelector('[data-subjects-loading]');
    const errorPanel = page.querySelector('[data-subjects-error]');
    const errorMessage = page.querySelector('[data-subjects-error-message]');
    const empty = page.querySelector('[data-subjects-empty]');
    const content = page.querySelector('[data-subjects-content]');
    const rows = page.querySelector('[data-subjects-rows]');
    const feedback = page.querySelector('[data-subjects-feedback]');
    const noProgramsMessage = page.querySelector('[data-no-programs-message]');
    const addButtons = page.querySelectorAll('[data-add-subject]');
    const modalElement = document.querySelector('[data-subject-modal]');
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
    const form = modalElement.querySelector('[data-subject-form]');
    const formError = modalElement.querySelector('[data-subject-form-error]');
    const modalTitle = modalElement.querySelector('[data-subject-modal-title]');
    const programSelect = modalElement.querySelector('[name="academicProgramId"]');
    const saveButton = modalElement.querySelector('[data-save-subject]');
    const saveLabel = modalElement.querySelector('[data-save-subject-label]');
    const saveSpinner = modalElement.querySelector('[data-save-subject-spinner]');
    let programs = [];
    let editingId = null;
    let saving = false;
    const deletingIds = new Set();

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
      showFeedback(requestErrorMessage(error, fallback), 'danger');
    }

    function updateProgramAvailability(message, canRetry = false) {
      const unavailable = programs.length === 0;
      addButtons.forEach((button) => { button.disabled = unavailable; });
      programSelect.disabled = unavailable;
      noProgramsMessage.classList.toggle('d-none', !unavailable);
      noProgramsMessage.replaceChildren();
      if (!unavailable) return;

      noProgramsMessage.append(document.createTextNode(message));
      if (canRetry) {
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'btn btn-sm btn-outline-warning ms-2';
        retry.textContent = 'Retry loading programs';
        retry.dataset.retryPrograms = '';
        noProgramsMessage.append(retry);
      } else {
        const link = document.createElement('a');
        link.className = 'alert-link ms-1';
        link.href = 'programs.html';
        link.textContent = 'Manage programs';
        noProgramsMessage.append(link);
      }
    }

    async function loadPrograms() {
      noProgramsMessage.classList.add('d-none');
      try {
        const response = await window.Api.get('/api/admin/programs');
        if (response?.success !== true || !Array.isArray(response.data)) {
          throw new Error('The server returned an unexpected programs response.');
        }
        programs = response.data.filter((program) => program?.id !== null && program?.id !== undefined);
        const options = [new Option('Select a program', '')];
        programs.forEach((program) => {
          const option = new Option(
            program.code ? `${program.name} (${program.code})` : String(program.name ?? 'Academic program'),
            String(program.id)
          );
          options.push(option);
        });
        programSelect.replaceChildren(...options);
        if (programs.length === 0) {
          updateProgramAvailability('Create an academic program before adding or editing subjects.');
        } else {
          addButtons.forEach((button) => { button.disabled = false; });
          programSelect.disabled = false;
        }
      } catch (requestError) {
        if (requestError instanceof window.Api.ApiError && (requestError.status === 401 || requestError.status === 403)) return;
        const message = requestErrorMessage(requestError, 'Academic programs could not be loaded. Subject creation is unavailable.');
        updateProgramAvailability(message, true);
      }
    }

    function cell(value, className = '') {
      const element = document.createElement('td');
      element.textContent = value === null || value === undefined || value === '' ? '—' : String(value);
      if (className) element.className = className;
      return element;
    }

    function renderSubjects(subjects) {
      const subjectRows = subjects.map((subject) => {
        if (subject?.id === null || subject?.id === undefined) {
          throw new Error('The server returned a subject without an ID. Refresh and try again.');
        }
        const row = document.createElement('tr');
        row.append(cell(subject.id));
        const name = document.createElement('th');
        name.scope = 'row';
        name.textContent = subject.name ?? '—';
        row.append(name, cell(subject.description), cell(subject.academicProgramName));

        const statusCell = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = subject.status ?? '—';
        if (subject.status === 'ACTIVE') badge.classList.add('text-bg-success');
        else if (subject.status === 'INACTIVE') badge.classList.add('text-bg-secondary');
        else badge.classList.add('text-bg-light', 'border');
        statusCell.append(badge);
        row.append(statusCell);

        const actions = document.createElement('td');
        actions.className = 'text-nowrap';
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'btn btn-sm btn-outline-primary me-2';
        edit.textContent = 'Edit';
        edit.dataset.editSubject = String(subject.id);
        edit.setAttribute('aria-label', `Edit ${subject.name ?? 'subject'}`);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'btn btn-sm btn-outline-danger';
        remove.textContent = 'Delete';
        remove.dataset.deleteSubject = String(subject.id);
        remove.setAttribute('aria-label', `Delete ${subject.name ?? 'subject'}`);
        actions.append(edit, remove);
        row.append(actions);
        return row;
      });
      rows.replaceChildren(...subjectRows);
    }

    async function loadSubjects() {
      showListState('loading');
      try {
        const response = await window.Api.get('/api/admin/subjects');
        if (response?.success !== true || !Array.isArray(response.data)) {
          throw new Error('The server returned an unexpected subjects response. Please try again.');
        }
        if (response.data.length === 0) {
          showListState('empty');
          return;
        }
        renderSubjects(response.data);
        showListState('content');
      } catch (requestError) {
        if (requestError instanceof window.Api.ApiError && (requestError.status === 401 || requestError.status === 403)) return;
        errorMessage.textContent = requestErrorMessage(requestError, 'Unable to load subjects. Please try again.');
        showListState('error');
      }
    }

    function clearForm() {
      form.reset();
      form.querySelectorAll('.is-invalid').forEach((field) => field.classList.remove('is-invalid'));
      formError.textContent = '';
      formError.classList.add('d-none');
    }

    function openCreateSubjectModal() {
      if (programs.length === 0) return;
      editingId = null;
      clearForm();
      modalTitle.textContent = 'Add Subject';
      saveLabel.textContent = 'Save Subject';
      modal.show();
      form.elements.name.focus();
    }

    async function openEditSubjectModal(id) {
      if (programs.length === 0) {
        updateProgramAvailability('Load or create an academic program before editing subjects.', true);
        return;
      }
      clearForm();
      try {
        const response = await window.Api.get(`/api/admin/subjects/${encodeURIComponent(id)}`);
        const subject = response?.data;
        if (response?.success !== true || !subject || typeof subject !== 'object') {
          throw new Error('The server returned an unexpected subject response. Please try again.');
        }
        const programExists = programs.some((program) => String(program.id) === String(subject.academicProgramId));
        if (!programExists) {
          throw new Error('The subject’s academic program is not available. Reload the program list and try again.');
        }
        editingId = id;
        form.elements.name.value = subject.name ?? '';
        form.elements.description.value = subject.description ?? '';
        programSelect.value = String(subject.academicProgramId);
        modalTitle.textContent = 'Edit Subject';
        saveLabel.textContent = 'Save Changes';
        modal.show();
        form.elements.name.focus();
      } catch (requestError) {
        showRequestError(requestError, 'Unable to load this subject for editing. Please refresh and try again.');
      }
    }

    function setSaving(isSaving) {
      saving = isSaving;
      saveButton.disabled = isSaving;
      saveSpinner.classList.toggle('d-none', !isSaving);
      saveLabel.textContent = isSaving ? 'Saving…' : editingId === null ? 'Save Subject' : 'Save Changes';
    }

    async function saveSubject(event) {
      event.preventDefault();
      if (saving) return;
      formError.textContent = '';
      formError.classList.add('d-none');
      form.elements.name.value = form.elements.name.value.trim();
      form.elements.description.value = form.elements.description.value.trim();

      const valid = form.checkValidity();
      form.querySelectorAll(':invalid').forEach((field) => field.classList.add('is-invalid'));
      if (!valid || programs.length === 0) {
        form.reportValidity();
        return;
      }

      const requestBody = {
        name: form.elements.name.value,
        description: form.elements.description.value || null,
        academicProgramId: Number(programSelect.value)
      };
      setSaving(true);
      try {
        const response = editingId === null
          ? await window.Api.post('/api/admin/subjects', requestBody)
          : await window.Api.put(`/api/admin/subjects/${encodeURIComponent(editingId)}`, requestBody);
        if (response?.success !== true || !response.data || typeof response.data !== 'object') {
          throw new Error('The server did not confirm the subject change. Please try again.');
        }
        const successMessage = editingId === null ? 'Subject created successfully.' : 'Subject updated successfully.';
        modal.hide();
        showFeedback(successMessage);
        await loadSubjects();
      } catch (requestError) {
        if (requestError instanceof window.Api.ApiError && (requestError.status === 401 || requestError.status === 403)) return;
        formError.textContent = requestErrorMessage(requestError, 'Unable to save this subject. Please try again.');
        formError.classList.remove('d-none');
      } finally {
        setSaving(false);
      }
    }

    async function deleteSubject(id, button) {
      if (deletingIds.has(id)) return;
      if (!window.confirm('Are you sure you want to delete this subject?')) return;
      deletingIds.add(id);
      button.disabled = true;
      try {
        await window.Api.request(`/api/admin/subjects/${encodeURIComponent(id)}`, { method: 'DELETE' });
        showFeedback('Subject deleted successfully.');
        await loadSubjects();
      } catch (requestError) {
        showRequestError(requestError, 'Unable to delete this subject. It may be in use by an exam.');
      } finally {
        deletingIds.delete(id);
        button.disabled = false;
      }
    }

    addButtons.forEach((button) => button.addEventListener('click', openCreateSubjectModal));
    page.querySelector('[data-retry-subjects]').addEventListener('click', loadSubjects);
    form.addEventListener('submit', saveSubject);
    page.querySelector('[data-subjects-rows]').addEventListener('click', (event) => {
      const editButton = event.target.closest('[data-edit-subject]');
      const deleteButton = event.target.closest('[data-delete-subject]');
      if (editButton) openEditSubjectModal(editButton.dataset.editSubject);
      else if (deleteButton) deleteSubject(deleteButton.dataset.deleteSubject, deleteButton);
    });
    noProgramsMessage.addEventListener('click', (event) => {
      if (event.target.matches('[data-retry-programs]')) loadPrograms();
    });
    modalElement.addEventListener('hidden.bs.modal', clearForm);
    form.addEventListener('input', (event) => event.target.classList.remove('is-invalid'));

    loadPrograms();
    loadSubjects();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.querySelector('[data-subjects-page]');
    if (!page || !window.Auth.requireRole('ADMIN')) return;
    initializeSubjects(page);
  });
})();
