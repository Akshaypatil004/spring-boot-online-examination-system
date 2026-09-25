(() => {
  function friendlyError(error, context) {
    if (error instanceof window.Api.ApiError) {
      if (error.status === 0) return 'Unable to reach the server. Check that the backend is running and try again.';
      if (error.status === 400) return 'Some program information is invalid. Review the fields and try again.';
      if (error.status === 404) return 'This academic program could not be found. Refresh the list and try again.';
      if (error.status === 409) return 'A program with this code already exists. Choose a different code.';
      if (error.status >= 500) return 'The server could not complete this request. Please try again later.';
    }
    return context;
  }

  function initializePrograms(page) {
    const loading = page.querySelector('[data-programs-loading]');
    const errorPanel = page.querySelector('[data-programs-error]');
    const errorMessage = page.querySelector('[data-programs-error-message]');
    const empty = page.querySelector('[data-programs-empty]');
    const content = page.querySelector('[data-programs-content]');
    const rows = page.querySelector('[data-programs-rows]');
    const feedback = page.querySelector('[data-programs-feedback]');
    const modalElement = document.querySelector('[data-program-modal]');
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
    const form = modalElement.querySelector('[data-program-form]');
    const formError = modalElement.querySelector('[data-program-form-error]');
    const modalTitle = modalElement.querySelector('[data-program-modal-title]');
    const saveButton = modalElement.querySelector('[data-save-program]');
    const saveLabel = modalElement.querySelector('[data-save-label]');
    const saveSpinner = modalElement.querySelector('[data-save-spinner]');
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
      feedback.className = `alert alert-${type} `;
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

    function renderPrograms(programs) {
      const programRows = programs.map((program) => {
        if (program?.id === null || program?.id === undefined) {
          throw new Error('The server returned a program without an ID. Refresh and try again.');
        }
        const row = document.createElement('tr');
        row.append(cell(program.id));
        const name = document.createElement('th');
        name.scope = 'row';
        name.textContent = program.name ?? '—';
        row.append(name, cell(program.code), cell(program.durationYears === null || program.durationYears === undefined ? '—' : `${program.durationYears} years`), cell(program.department));

        const statusCell = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = program.status ?? '—';
        if (program.status === 'ACTIVE') badge.classList.add('text-bg-success');
        else if (program.status === 'INACTIVE') badge.classList.add('text-bg-secondary');
        else badge.classList.add('text-bg-light', 'border');
        statusCell.append(badge);
        row.append(statusCell);

        const actions = document.createElement('td');
        actions.className = 'text-nowrap';
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'btn btn-sm btn-outline-primary me-2';
        edit.textContent = 'Edit';
        edit.dataset.editProgram = String(program.id);
        edit.setAttribute('aria-label', `Edit ${program.name ?? 'program'}`);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'btn btn-sm btn-outline-danger';
        remove.textContent = 'Delete';
        remove.dataset.deleteProgram = String(program.id);
        remove.setAttribute('aria-label', `Delete ${program.name ?? 'program'}`);
        actions.append(edit, remove);
        row.append(actions);
        return row;
      });
      rows.replaceChildren(...programRows);
    }

    async function loadPrograms() {
      showListState('loading');
      try {
        const response = await window.Api.get('/api/admin/programs');
        if (response?.success !== true || !Array.isArray(response.data)) {
          throw new Error('The server returned an unexpected programs response. Please try again.');
        }
        if (response.data.length === 0) {
          showListState('empty');
          return;
        }
        renderPrograms(response.data);
        showListState('content');
      } catch (requestError) {
        if (requestError instanceof window.Api.ApiError && (requestError.status === 401 || requestError.status === 403)) return;
        errorMessage.textContent = friendlyError(requestError, 'Unable to load programs. Please try again.');
        showListState('error');
      }
    }

    function clearForm() {
      form.reset();
      form.querySelectorAll('.is-invalid').forEach((field) => field.classList.remove('is-invalid'));
      formError.textContent = '';
      formError.classList.add('d-none');
    }

    function openCreateProgramModal() {
      editingId = null;
      clearForm();
      modalTitle.textContent = 'Add Program';
      saveLabel.textContent = 'Save Program';
      modal.show();
      form.elements.name.focus();
    }

    async function openEditProgram(id) {
      clearForm();
      try {
        const response = await window.Api.get(`/api/admin/programs/${encodeURIComponent(id)}`);
        const program = response?.data;
        if (response?.success !== true || !program || typeof program !== 'object') {
          throw new Error('The server returned an unexpected program response. Please try again.');
        }
        editingId = id;
        form.elements.name.value = program.name ?? '';
        form.elements.code.value = program.code ?? '';
        form.elements.durationYears.value = program.durationYears ?? '';
        form.elements.department.value = program.department ?? '';
        modalTitle.textContent = 'Edit Program';
        saveLabel.textContent = 'Save Changes';
        modal.show();
        form.elements.name.focus();
      } catch (requestError) {
        showRequestError(requestError, 'Unable to load this program for editing. Please refresh and try again.');
      }
    }

    function setSaving(isSaving) {
      saving = isSaving;
      saveButton.disabled = isSaving;
      saveSpinner.classList.toggle('d-none', !isSaving);
      saveLabel.textContent = isSaving ? 'Saving…' : editingId === null ? 'Save Program' : 'Save Changes';
    }

    async function saveProgram(event) {
      event.preventDefault();
      if (saving) return;
      formError.textContent = '';
      formError.classList.add('d-none');

      for (const field of [form.elements.name, form.elements.code, form.elements.department]) {
        field.value = field.value.trim();
      }
      const duration = Number(form.elements.durationYears.value);
      const durationValid = Number.isInteger(duration) && duration >= 1;
      form.elements.durationYears.classList.toggle('is-invalid', !durationValid);
      const fieldsValid = form.checkValidity();
      form.querySelectorAll(':invalid').forEach((field) => field.classList.add('is-invalid'));
      if (!fieldsValid || !durationValid) {
        form.reportValidity();
        return;
      }

      const requestBody = {
        name: form.elements.name.value,
        code: form.elements.code.value,
        durationYears: duration,
        department: form.elements.department.value
      };
      setSaving(true);
      try {
        const response = editingId === null
          ? await window.Api.post('/api/admin/programs', requestBody)
          : await window.Api.put(`/api/admin/programs/${encodeURIComponent(editingId)}`, requestBody);
        if (response?.success !== true || !response.data || typeof response.data !== 'object') {
          throw new Error('The server did not confirm the program change. Please try again.');
        }
        const successMessage = editingId === null ? 'Program created successfully.' : 'Program updated successfully.';
        modal.hide();
        showFeedback(successMessage);
        await loadPrograms();
      } catch (requestError) {
        if (requestError instanceof window.Api.ApiError && (requestError.status === 401 || requestError.status === 403)) return;
        formError.textContent = friendlyError(requestError, 'Unable to save this program. Please try again.');
        formError.classList.remove('d-none');
      } finally {
        setSaving(false);
      }
    }

    async function deleteProgram(id, button) {
      if (deletingIds.has(id)) return;
      if (!window.confirm('Are you sure you want to delete this academic program? This cannot be undone.')) return;
      deletingIds.add(id);
      button.disabled = true;
      try {
        await window.Api.request(`/api/admin/programs/${encodeURIComponent(id)}`, { method: 'DELETE' });
        showFeedback('Program deleted successfully.');
        await loadPrograms();
      } catch (requestError) {
        showRequestError(requestError, 'Unable to delete this program. It may be in use.');
      } finally {
        deletingIds.delete(id);
        button.disabled = false;
      }
    }

    page.querySelectorAll('[data-add-program]').forEach((button) => button.addEventListener('click', openCreateProgramModal));
    page.querySelector('[data-retry-programs]').addEventListener('click', loadPrograms);
    form.addEventListener('submit', saveProgram);
    page.querySelector('[data-programs-rows]').addEventListener('click', (event) => {
      const editButton = event.target.closest('[data-edit-program]');
      const deleteButton = event.target.closest('[data-delete-program]');
      if (editButton) openEditProgram(editButton.dataset.editProgram);
      else if (deleteButton) deleteProgram(deleteButton.dataset.deleteProgram, deleteButton);
    });
    modalElement.addEventListener('hidden.bs.modal', clearForm);
    form.addEventListener('input', (event) => event.target.classList.remove('is-invalid'));
    loadPrograms();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.querySelector('[data-programs-page]');
    if (!page || !window.Auth.requireRole('ADMIN')) return;
    initializePrograms(page);
  });
})();
