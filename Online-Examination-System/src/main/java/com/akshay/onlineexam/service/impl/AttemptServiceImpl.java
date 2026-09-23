package com.akshay.onlineexam.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.akshay.onlineexam.dto.attempt.AnswerRequest;
import com.akshay.onlineexam.dto.attempt.AnswerResponse;
import com.akshay.onlineexam.dto.attempt.AttemptOptionResponse;
import com.akshay.onlineexam.dto.attempt.AttemptQuestionResponse;
import com.akshay.onlineexam.dto.attempt.AttemptResponse;
import com.akshay.onlineexam.dto.result.ResultResponse;
import com.akshay.onlineexam.entity.AttemptStatus;
import com.akshay.onlineexam.entity.Exam;
import com.akshay.onlineexam.entity.ExamAttempt;
import com.akshay.onlineexam.entity.Option;
import com.akshay.onlineexam.entity.Question;
import com.akshay.onlineexam.entity.Result;
import com.akshay.onlineexam.entity.ResultStatus;
import com.akshay.onlineexam.entity.Student;
import com.akshay.onlineexam.entity.StudentAnswer;
import com.akshay.onlineexam.entity.User;
import com.akshay.onlineexam.exception.DuplicateResourceException;
import com.akshay.onlineexam.exception.InvalidRequestException;
import com.akshay.onlineexam.exception.ResourceNotFoundException;
import com.akshay.onlineexam.repository.ExamAttemptRepository;
import com.akshay.onlineexam.repository.ExamRepository;
import com.akshay.onlineexam.repository.OptionRepository;
import com.akshay.onlineexam.repository.QuestionRepository;
import com.akshay.onlineexam.repository.ResultRepository;
import com.akshay.onlineexam.repository.StudentAnswerRepository;
import com.akshay.onlineexam.repository.StudentRepository;
import com.akshay.onlineexam.repository.UserRepository;
import com.akshay.onlineexam.service.AttemptService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AttemptServiceImpl implements AttemptService {

    private final ExamRepository examRepository;
    private final ExamAttemptRepository attemptRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final OptionRepository optionRepository;
    private final StudentAnswerRepository studentAnswerRepository;
    private final ResultRepository resultRepository;

    @Override
    @Transactional
    public AttemptResponse startAttempt(Long examId) {

        Exam exam =
            examRepository.findById(examId)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Exam not found with id: " + examId
                    )
                );

        if (!exam.getStatus().name().equals("PUBLISHED")) {
            throw new InvalidRequestException(
                "Exam is not available"
            );
        }

        LocalDateTime now = LocalDateTime.now();

        if (now.isBefore(exam.getStartTime())
                || now.isAfter(exam.getEndTime())) {

            throw new InvalidRequestException(
                "Exam is outside the available time"
            );
        }

        Authentication authentication =
            SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User user =
            userRepository.findByEmail(email)
                .orElseThrow(() ->
                    new ResourceNotFoundException("User not found")
                );

        Student student =
            studentRepository.findByUserId(user.getId())
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Student profile not found"
                    )
                );

        if (!student.getAcademicProgram().getId()
                .equals(exam.getSubject()
                    .getAcademicProgram()
                    .getId())) {

            throw new InvalidRequestException(
                "Student is not eligible for this exam"
            );
        }

        if (attemptRepository.existsByStudentIdAndExamId(
                student.getId(),
                examId)) {

            throw new DuplicateResourceException(
                "Student has already attempted this exam"
            );
        }

        ExamAttempt attempt = new ExamAttempt();

        attempt.setStudent(student);
        attempt.setExam(exam);
        attempt.setStartedAt(now);
        attempt.setStatus(AttemptStatus.IN_PROGRESS);

        ExamAttempt savedAttempt =
            attemptRepository.save(attempt);

        return new AttemptResponse(
            savedAttempt.getId(),
            exam.getId(),
            exam.getTitle(),
            savedAttempt.getStartedAt(),
            savedAttempt.getSubmittedAt(),
            savedAttempt.getStatus().name()
        );
    }
    @Override
    @Transactional(readOnly = true)
    public List<AttemptQuestionResponse> getAttemptQuestions(
            Long attemptId) {

        ExamAttempt attempt =
            attemptRepository.findById(attemptId)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Exam attempt not found with id: " + attemptId
                    )
                );

        Student student = getAuthenticatedStudent();

        // Check ownership
        if (!attempt.getStudent().getId()
                .equals(student.getId())) {

            throw new InvalidRequestException(
                "You cannot access another student's attempt"
            );
        }

        // Check whether exam is already submitted
        if (attempt.getStatus() == AttemptStatus.SUBMITTED) {

            throw new InvalidRequestException(
                "Exam has already been submitted"
            );
        }

        List<Question> questions =
            questionRepository
                .findByExamIdOrderByQuestionOrderAsc(
                    attempt.getExam().getId()
                );

        return questions.stream()
            .map(question -> {

                List<AttemptOptionResponse> options =
                    optionRepository
                        .findByQuestionId(question.getId())
                        .stream()
                        .map(option ->
                            new AttemptOptionResponse(
                                option.getId(),
                                option.getOptionLabel(),
                                option.getOptionText()
                            )
                        )
                        .toList();

                return new AttemptQuestionResponse(
                    question.getId(),
                    question.getQuestionText(),
                    question.getMarks(),
                    question.getQuestionOrder(),
                    options
                );
            })
            .toList();
    }
    private Student getAuthenticatedStudent() {

        Authentication authentication =
            SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User user =
            userRepository.findByEmail(email)
                .orElseThrow(() ->
                    new ResourceNotFoundException("User not found")
                );

        return studentRepository.findByUserId(user.getId())
            .orElseThrow(() ->
                new ResourceNotFoundException(
                    "Student profile not found"
                )
            );
    }
    
    @Override
    @Transactional
    public AnswerResponse saveAnswer(
            Long attemptId,
            Long questionId,
            AnswerRequest request) {

        ExamAttempt attempt =
            attemptRepository.findById(attemptId)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Exam attempt not found with id: " + attemptId
                    )
                );

        Student student = getAuthenticatedStudent();

        // Make sure this attempt belongs to logged-in student
        if (!attempt.getStudent().getId()
                .equals(student.getId())) {

            throw new InvalidRequestException(
                "You cannot modify another student's attempt"
            );
        }

        // Don't allow answers after submission
        if (attempt.getStatus() == AttemptStatus.SUBMITTED) {

            throw new InvalidRequestException(
                "Exam has already been submitted"
            );
        }

        Question question =
            questionRepository.findById(questionId)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Question not found with id: " + questionId
                    )
                );

        // Make sure question belongs to this exam
        if (!question.getExam().getId()
                .equals(attempt.getExam().getId())) {

            throw new InvalidRequestException(
                "Question does not belong to this exam"
            );
        }

        Option selectedOption =
            optionRepository.findById(request.getOptionId())
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Option not found with id: "
                        + request.getOptionId()
                    )
                );

        // Make sure selected option belongs to this question
        if (!selectedOption.getQuestion().getId()
                .equals(questionId)) {

            throw new InvalidRequestException(
                "Selected option does not belong to this question"
            );
        }

        StudentAnswer studentAnswer =
            studentAnswerRepository
                .findByAttemptIdAndQuestionId(
                    attemptId,
                    questionId
                )
                .orElseGet(StudentAnswer::new);

        studentAnswer.setAttempt(attempt);
        studentAnswer.setQuestion(question);
        studentAnswer.setSelectedOption(selectedOption);
        studentAnswer.setAnsweredAt(LocalDateTime.now());

        studentAnswerRepository.save(studentAnswer);

        return new AnswerResponse(
            questionId,
            selectedOption.getId(),
            "Answer saved successfully"
        );
    }
    
    @Override
    @Transactional
    public ResultResponse submitAttempt(Long attemptId) {

        ExamAttempt attempt =
            attemptRepository.findById(attemptId)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Exam attempt not found with id: " + attemptId
                    )
                );

        Student student = getAuthenticatedStudent();

        if (!attempt.getStudent().getId()
                .equals(student.getId())) {

            throw new InvalidRequestException(
                "You cannot submit another student's attempt"
            );
        }

        if (attempt.getStatus() == AttemptStatus.SUBMITTED) {

            throw new InvalidRequestException(
                "Exam has already been submitted"
            );
        }

        /*
         * Get all questions belonging to this exam.
         */
        List<Question> questions =
            questionRepository
                .findByExamIdOrderByQuestionOrderAsc(
                    attempt.getExam().getId()
                );

        /*
         * Get answers submitted by the student.
         */
        List<StudentAnswer> answers =
            studentAnswerRepository
                .findByAttemptId(attemptId);

        int totalQuestions = questions.size();
        int attemptedQuestions = answers.size();
        int correctAnswers = 0;
        int wrongAnswers = 0;

        for (StudentAnswer answer : answers) {

            if (answer.getSelectedOption().getIsCorrect()) {
                correctAnswers++;
            } else {
                wrongAnswers++;
            }
        }

        int unansweredQuestions =
            totalQuestions - attemptedQuestions;

        int score = correctAnswers;

        BigDecimal percentage =
            totalQuestions == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(score * 100.0 / totalQuestions)
                    .setScale(2, java.math.RoundingMode.HALF_UP);

        ResultStatus resultStatus =
        	    score >= attempt.getExam().getPassingMarks()
        	        ? ResultStatus.PASS
        	        : ResultStatus.FAIL;

        /*
         * Mark attempt as submitted.
         */
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(LocalDateTime.now());

        attemptRepository.save(attempt);

        /*
         * Create result snapshot.
         */
        Result result = new Result();

        result.setAttempt(attempt);
        result.setTotalQuestions(totalQuestions);
        result.setAttemptedQuestions(attemptedQuestions);
        result.setCorrectAnswers(correctAnswers);
        result.setWrongAnswers(wrongAnswers);
        result.setUnansweredQuestions(unansweredQuestions);
        result.setScore(score);
        result.setPercentage(percentage);
        result.setResultStatus(resultStatus);
        result.setGeneratedAt(LocalDateTime.now());

        Result savedResult =
            resultRepository.save(result);

        return new ResultResponse(
        	    savedResult.getId(),
        	    attempt.getId(),
        	    totalQuestions,
        	    attemptedQuestions,
        	    correctAnswers,
        	    wrongAnswers,
        	    unansweredQuestions,
        	    score,
        	    percentage,
        	    resultStatus.name()
        	);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AttemptResponse> getMyAttempts() {

        Student student = getAuthenticatedStudent();

        return attemptRepository.findAll()
            .stream()
            .filter(attempt ->
                attempt.getStudent()
                    .getId()
                    .equals(student.getId())
            )
            .map(attempt ->
                new AttemptResponse(
                    attempt.getId(),
                    attempt.getExam().getId(),
                    attempt.getExam().getTitle(),
                    attempt.getStartedAt(),
                    attempt.getSubmittedAt(),
                    attempt.getStatus().name()
                )
            )
            .toList();
    }
}