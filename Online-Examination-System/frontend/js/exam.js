(() => {
  const ATTEMPT_STORAGE_PREFIX = 'exam-portal-attempt-';

  function responseData(response, description) {
    if (response?.success !== true || !response.data || typeof response.data !== 'object') {
      throw new Error(`The server returned an unexpected ${description} response. Please try again.`);
    }
    return response.data;
  }

  function showStartError(page, message) {
    page.querySelector('[data-start-loading]').classList.add('d-none');
    page.querySelector('[data-start-error-message]').textContent = message;
    page.querySelector('[data-start-error]').classList.remove('d-none');
  }

  async function getAvailableExam(examId) {
    const response = await window.Api.get('/api/student/exams/available');
    if (response?.success !== true || !Array.isArray(response.data)) {
      throw new Error('Unable to confirm the exam details. Return to available exams and try again.');
    }
    return response.data.find((item) => String(item.id) === String(examId));
  }

  async function redirectToAttempt(attempt, exam) {
    const durationMinutes = Number(exam?.durationMinutes);
    if (!attempt?.id || !attempt.startedAt || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      throw new Error('The backend did not provide valid attempt timing information. The exam cannot be safely resumed.');
    }
    const metadata = {
      attemptId: attempt.id,
      examId: attempt.examId,
      examTitle: attempt.examTitle,
      startedAt: attempt.startedAt,
      durationMinutes,
      status: attempt.status
    };
    window.sessionStorage.setItem(`${ATTEMPT_STORAGE_PREFIX}${attempt.id}`, JSON.stringify(metadata));
    window.location.replace(`exam.html?attemptId=${encodeURIComponent(attempt.id)}`);
  }

  async function recoverExistingAttempt(examId) {
    const response = await window.Api.get('/api/student/attempts');
    if (response?.success !== true || !Array.isArray(response.data)) {
      throw new Error('The server returned an unexpected attempts response. Unable to recover this exam attempt.');
    }
    const attempt = response.data.find((item) =>
      String(item.examId) === String(examId) && item.status === 'IN_PROGRESS'
    );
    if (!attempt) {
      throw new Error('The backend reported an existing attempt, but no in-progress attempt for this exam was found in your account.');
    }
    const exam = await getAvailableExam(examId);
    if (!exam) {
      throw new Error('The existing attempt was found, but the backend did not provide its exam duration. It cannot be safely resumed.');
    }
    await redirectToAttempt(attempt, exam);
  }

  async function startExam(page) {
    if (!window.Auth.requireRole('STUDENT')) return;
    const examId = new URLSearchParams(window.location.search).get('examId');
    if (!examId || !/^\d+$/.test(examId)) {
      showStartError(page, 'The exam link is missing a valid exam ID. Return to available exams and select an exam.');
      return;
    }

    try {
      const attemptResponse = await window.Api.post(`/api/student/exams/${encodeURIComponent(examId)}/attempts`);
      const attempt = responseData(attemptResponse, 'exam attempt');
      const exam = await getAvailableExam(examId);
      if (!exam) throw new Error('This exam is no longer available, or its duration could not be confirmed.');
      await redirectToAttempt(attempt, exam);
    } catch (error) {
      if (error instanceof window.Api.ApiError && (error.status === 401 || error.status === 403)) return;
      const apiMessage = error instanceof window.Api.ApiError ? error.message : '';
      const isDuplicate = (error instanceof window.Api.ApiError && (error.status === 409 || error.status === 400))
        && /already attempted|already.*exam|duplicate/i.test(error.backendMessage);
      if (isDuplicate) {
        try {
          await recoverExistingAttempt(examId);
          return;
        } catch (recoveryError) {
          if (recoveryError instanceof window.Api.ApiError && (recoveryError.status === 401 || recoveryError.status === 403)) return;
          showStartError(page, recoveryError.message || 'An existing attempt could not be recovered.');
          return;
        }
      }
      showStartError(page, apiMessage || error.message || 'Unable to start this exam. Please try again.');
    }
  }

  function initializeExam(page) {
    if (!window.Auth.requireRole('STUDENT')) return;

    const loading = page.querySelector('[data-exam-loading]');
    const errorPanel = page.querySelector('[data-exam-error]');
    const errorMessage = page.querySelector('[data-exam-error-message]');
    const content = page.querySelector('[data-exam-content]');
    const submittedPanel = page.querySelector('[data-exam-submitted]');
    const questionList = page.querySelector('[data-question-list]');
    const timerBadge = document.querySelector('[data-exam-timer]');
    const timerValue = document.querySelector('[data-timer-value]');
    const timerWarning = page.querySelector('[data-timer-warning]');
    const answerError = page.querySelector('[data-answer-error]');
    const answerErrorMessage = page.querySelector('[data-answer-error-message]');
    const submitButton = page.querySelector('[data-submit-exam]');
    const params = new URLSearchParams(window.location.search);
    const attemptId = params.get('attemptId');
    let metadata = null;
    let timerId = null;
    let submitting = false;
    let autoSubmitStarted = false;
    let pendingSaves = new Set();
    let answered = new Set();
    let questionTotal = 0;

    function showSubmitted(resultId) {
      stopTimer();
      content.classList.add('d-none');
      timerBadge.classList.add('d-none');
      submittedPanel.classList.remove('d-none');
      const resultLink = submittedPanel.querySelector('[data-submitted-result]');
      if (resultId !== null && resultId !== undefined) {
        window.location.replace(`result.html?resultId=${encodeURIComponent(resultId)}`);
        return;
      }
      if (resultLink) resultLink.classList.remove('d-none');
    }

    function submissionErrorMessage(error) {
      if (error instanceof window.Api.ApiError) {
        if (error.status === 400) return 'The server could not accept this submission. Check your saved answers and try again.';
        if (error.status === 401) return 'Your session has expired. Please sign in again.';
        if (error.status === 403) return 'You are not allowed to submit this exam attempt.';
        if (error.status === 404) return 'This exam attempt could not be found.';
        if (error.status >= 500 || error.status === 0) return 'The server is unavailable. Your submission could not be confirmed. Please try again.';
      }
      return error?.message || 'Unable to submit your exam. Please try again.';
    }

    async function findResultIdForAttempt() {
      try {
        const response = await window.Api.get('/api/student/results');
        if (response?.success === true && Array.isArray(response.data)) {
          return response.data.find((result) => String(result.attemptId) === attemptId)?.resultId ?? null;
        }
      } catch { /* A submitted attempt remains submitted even if result lookup is unavailable. */ }
      return null;
    }

    function displayError(message) {
      loading.classList.add('d-none');
      content.classList.add('d-none');
      errorMessage.textContent = message;
      errorPanel.classList.remove('d-none');
    }

    function updateAnswerCount() {
      page.querySelector('[data-answered-count]').textContent = String(answered.size);
      page.querySelector('[data-total-count]').textContent = String(questionTotal);
    }

    async function recoverAttemptMetadata() {
      let attemptsResponse;
      try {
        attemptsResponse = await window.Api.get('/api/student/attempts');
      } catch (error) {
        if (error instanceof window.Api.ApiError && (error.status === 401 || error.status === 403)) throw error;
        throw new Error(error.message || 'Unable to recover this attempt from your account. Please try again.');
      }
      if (attemptsResponse?.success !== true || !Array.isArray(attemptsResponse.data)) {
        throw new Error('The server returned an unexpected attempts response. Unable to recover this attempt.');
      }

      const attempt = attemptsResponse.data.find((item) => String(item.id) === attemptId);
      if (!attempt) throw new Error('This attempt was not found in your student account.');
      if (attempt.status === 'SUBMITTED') {
        return {
          attemptId: attempt.id,
          examId: attempt.examId,
          examTitle: attempt.examTitle,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          status: attempt.status
        };
      }
      if (attempt.status !== 'IN_PROGRESS' || !attempt.startedAt || attempt.examId === null || attempt.examId === undefined) {
        throw new Error('The backend did not return valid timing and status information for this in-progress attempt.');
      }

      // AttemptResponse has startedAt but no duration. The existing available-exams
      // response supplies the backend-defined duration while the exam is available.
      const examsResponse = await window.Api.get('/api/student/exams/available');
      if (examsResponse?.success !== true || !Array.isArray(examsResponse.data)) {
        throw new Error('The server returned an unexpected available-exams response. Unable to recover the exam duration.');
      }
      const exam = examsResponse.data.find((item) => String(item.id) === String(attempt.examId));
      const durationMinutes = Number(exam?.durationMinutes);
      if (!exam || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        throw new Error('The backend did not provide the duration for this attempt’s exam. Its remaining time cannot be safely calculated.');
      }

      return {
        attemptId: attempt.id,
        examId: attempt.examId,
        examTitle: attempt.examTitle,
        startedAt: attempt.startedAt,
        durationMinutes,
        status: attempt.status
      };
    }

    function createQuestionCard(question, index) {
      if (question.questionId === null || question.questionId === undefined || !Array.isArray(question.options)) {
        throw new Error('The server returned a question without its required ID or options. Please reload the exam.');
      }
      const article = document.createElement('article');
      article.className = 'question-card';
      article.dataset.questionId = String(question.questionId);

      const heading = document.createElement('div');
      heading.className = 'question-card-heading';
      const number = document.createElement('span');
      number.className = 'question-number';
      number.textContent = String(question.questionOrder ?? index + 1);
      const text = document.createElement('h2');
      text.className = 'h5 mb-0';
      text.textContent = question.questionText ?? 'Question';
      heading.append(number, text);
      if (question.marks !== null && question.marks !== undefined) {
        const marks = document.createElement('span');
        marks.className = 'small text-body-secondary flex-shrink-0';
        marks.textContent = `${question.marks} marks`;
        heading.append(marks);
      }
      article.append(heading);

      const options = document.createElement('div');
      options.className = 'vstack gap-2 mt-3';
      question.options.forEach((option) => {
        if (option.id === null || option.id === undefined) throw new Error('The server returned an option without an ID. Please reload the exam.');
        const label = document.createElement('label');
        label.className = 'question-option';
        const radio = document.createElement('input');
        radio.className = 'form-check-input mt-0';
        radio.type = 'radio';
        radio.name = `question-${question.questionId}`;
        radio.value = String(option.id);
        radio.setAttribute('aria-label', `${option.optionLabel ?? ''} ${option.optionText ?? ''}`.trim());
        const optionText = document.createElement('span');
        optionText.className = 'question-option-label';
        const labelText = document.createElement('strong');
        labelText.className = 'me-2';
        labelText.textContent = option.optionLabel ? `${option.optionLabel}.` : '';
        const bodyText = document.createElement('span');
        bodyText.textContent = option.optionText ?? '';
        optionText.append(labelText, bodyText);
        radio.addEventListener('change', () => saveAnswer(question.questionId, option.id, article, radio));
        label.append(radio, optionText);
        options.append(label);
      });
      article.append(options);
      return article;
    }

    async function saveAnswer(questionId, optionId, card, selectedRadio) {
      if (submitting) return;
      answerError.classList.add('d-none');
      const radios = [...card.querySelectorAll('input[type="radio"]')];
      const oldSelection = radios.find((radio) => radio.dataset.saved === 'true');
      radios.forEach((radio) => { radio.disabled = true; });
      const requestPromise = window.Api.put(
        `/api/student/attempts/${encodeURIComponent(attemptId)}/answers/${encodeURIComponent(questionId)}`,
        { optionId }
      ).then((response) => {
        if (response?.success !== true) throw new Error('The selected answer was not confirmed by the server.');
        selectedRadio.dataset.saved = 'true';
        radios.filter((radio) => radio !== selectedRadio).forEach((radio) => delete radio.dataset.saved);
        answered.add(String(questionId));
        updateAnswerCount();
      }).catch((error) => {
        if (error instanceof window.Api.ApiError && (error.status === 401 || error.status === 403)) return;
        if (oldSelection) oldSelection.checked = true;
        else selectedRadio.checked = false;
        answerErrorMessage.textContent = error instanceof window.Api.ApiError && /already been submitted/i.test(error.backendMessage)
          ? 'This attempt has already been submitted. Answers can no longer be changed.'
          : error.message || 'Unable to save this answer. Please select it again to retry.';
        answerError.classList.remove('d-none');
      }).finally(() => {
        radios.forEach((radio) => { radio.disabled = submitting; });
      });
      pendingSaves.add(requestPromise);
      await requestPromise;
      pendingSaves.delete(requestPromise);
    }

    function stopTimer() {
      if (timerId !== null) window.clearInterval(timerId);
      timerId = null;
    }

    function renderTime(remainingMs) {
      const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
      const minutes = Math.floor(seconds / 60);
      const remainder = seconds % 60;
      timerValue.textContent = `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
      timerBadge.classList.toggle('text-bg-danger', seconds <= 60);
      timerBadge.classList.toggle('text-bg-light', seconds > 60);
      timerWarning.classList.toggle('d-none', seconds > 300);
    }

    function beginTimer() {
      const startedAt = new Date(metadata.startedAt).getTime();
      const durationMs = Number(metadata.durationMinutes) * 60 * 1000;
      if (!Number.isFinite(startedAt) || !Number.isFinite(durationMs) || durationMs <= 0) {
        throw new Error('The attempt timing information is invalid. Please return to available exams.');
      }
      const endAt = startedAt + durationMs;
      timerBadge.classList.remove('d-none');
      const tick = () => {
        const remaining = endAt - Date.now();
        renderTime(remaining);
        if (remaining <= 0 && !submitting && !autoSubmitStarted) {
          autoSubmitStarted = true;
          submitAttempt(true);
        }
      };
      tick();
      timerId = window.setInterval(tick, 1000);
    }

    async function submitAttempt(automatic = false) {
      if (submitting) return;
      if (!automatic && !window.confirm('Submit this exam now? You will not be able to change your answers after submission.')) return;
      submitting = true;
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Submitting…';
      page.querySelectorAll('[data-question-list] input').forEach((input) => { input.disabled = true; });
      try {
        while (pendingSaves.size > 0) await Promise.all([...pendingSaves]);
        const response = await window.Api.post(`/api/student/exams/${encodeURIComponent(attemptId)}/submit`);
        if (response?.success !== true || !response.data || response.data.resultId === null || response.data.resultId === undefined) throw new Error('The server did not return a valid result ID for this submission.');
        const key = `${ATTEMPT_STORAGE_PREFIX}${attemptId}`;
        window.sessionStorage.removeItem(key);
        showSubmitted(response.data.resultId);
      } catch (error) {
        if (error instanceof window.Api.ApiError && (error.status === 401 || error.status === 403)) return;
        const isAlreadySubmitted = error instanceof window.Api.ApiError && /already been submitted/i.test(error.backendMessage);
        if (isAlreadySubmitted) {
          submitting = true;
          const resultId = await findResultIdForAttempt();
          showSubmitted(resultId);
        } else {
          submitting = false;
          submitButton.disabled = false;
          submitButton.innerHTML = '<i class="bi bi-send me-2" aria-hidden="true"></i>Submit exam';
          page.querySelectorAll('[data-question-list] input').forEach((input) => { input.disabled = false; });
          answerErrorMessage.textContent = automatic
            ? `Time has expired. ${submissionErrorMessage(error)}`
            : submissionErrorMessage(error);
          answerError.classList.remove('d-none');
        }
      }
    }

    submitButton.addEventListener('click', () => submitAttempt(false));

    async function loadAttempt() {
      if (!attemptId || !/^\d+$/.test(attemptId)) {
        displayError('No valid attempt ID was provided. Return to available exams to start an exam.');
        return;
      }
      try {
        const rawMetadata = window.sessionStorage.getItem(`${ATTEMPT_STORAGE_PREFIX}${attemptId}`);
        metadata = rawMetadata ? JSON.parse(rawMetadata) : null;
        if (!metadata || String(metadata.attemptId) !== attemptId || !metadata.startedAt || !Number(metadata.durationMinutes)) {
          metadata = await recoverAttemptMetadata();
          try {
            window.sessionStorage.setItem(`${ATTEMPT_STORAGE_PREFIX}${attemptId}`, JSON.stringify(metadata));
          } catch {
            // The recovered server data remains usable for this page even if sessionStorage is unavailable.
          }
        }
        if (metadata.status === 'SUBMITTED') {
          loading.classList.add('d-none');
          submittedPanel.classList.remove('d-none');
          return;
        }
        const response = await window.Api.get(`/api/student/exams/${encodeURIComponent(attemptId)}/questions`);
        if (response?.success !== true || !Array.isArray(response.data)) throw new Error('The server returned an unexpected questions response.');
        questionTotal = response.data.length;
        page.querySelector('[data-exam-title]').textContent = metadata.examTitle || 'Examination';
        page.querySelector('[data-exam-question-count]').textContent = String(questionTotal);
        page.querySelector('[data-total-count]').textContent = String(questionTotal);
        questionList.replaceChildren(...response.data.map(createQuestionCard));
        loading.classList.add('d-none');
        content.classList.remove('d-none');
        beginTimer();
      } catch (error) {
        if (error instanceof window.Api.ApiError && (error.status === 401 || error.status === 403)) return;
        const isAlreadySubmitted = error instanceof window.Api.ApiError && /already been submitted/i.test(error.backendMessage);
        displayError(isAlreadySubmitted
          ? 'This exam attempt has already been submitted and its questions can no longer be opened.'
          : error.message || 'Unable to load this examination. Please try again.');
      }
    }

    loadAttempt();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const startPage = document.querySelector('[data-exam-start]');
    const examPage = document.querySelector('[data-exam-page]');
    if (startPage) startExam(startPage);
    if (examPage) initializeExam(examPage);
  });
})();
