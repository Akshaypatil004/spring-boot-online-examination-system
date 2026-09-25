package com.akshay.onlineexam;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.akshay.onlineexam.dto.question.OptionRequest;
import com.akshay.onlineexam.dto.question.QuestionRequest;
import com.akshay.onlineexam.entity.Exam;
import com.akshay.onlineexam.entity.ExamStatus;
import com.akshay.onlineexam.entity.Option;
import com.akshay.onlineexam.entity.Question;
import com.akshay.onlineexam.entity.QuestionStatus;
import com.akshay.onlineexam.entity.Subject;
import com.akshay.onlineexam.exception.InvalidRequestException;
import com.akshay.onlineexam.repository.ExamRepository;
import com.akshay.onlineexam.repository.OptionRepository;
import com.akshay.onlineexam.repository.QuestionRepository;
import com.akshay.onlineexam.repository.StudentRepository;
import com.akshay.onlineexam.repository.SubjectRepository;
import com.akshay.onlineexam.repository.UserRepository;
import com.akshay.onlineexam.service.impl.ExamServiceImpl;
import com.akshay.onlineexam.service.impl.OptionServiceImpl;
import com.akshay.onlineexam.service.impl.QuestionServiceImpl;

@ExtendWith(MockitoExtension.class)
class ExamIntegrityServiceTests {

    @Mock private ExamRepository examRepository;
    @Mock private QuestionRepository questionRepository;
    @Mock private SubjectRepository subjectRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private UserRepository userRepository;
    @Mock private OptionRepository optionRepository;

    private ExamServiceImpl examService;
    private QuestionServiceImpl questionService;
    private OptionServiceImpl optionService;

    @BeforeEach
    void setUp() {
        examService = new ExamServiceImpl(
            examRepository, questionRepository, subjectRepository,
            studentRepository, userRepository
        );
        questionService = new QuestionServiceImpl(questionRepository, examRepository);
        optionService = new OptionServiceImpl(optionRepository, questionRepository);
    }

    @Test
    void publishesWhenQuestionMarksEqualExamTotal() {
        Exam exam = draftExam(10);
        when(examRepository.findById(1L)).thenReturn(Optional.of(exam));
        when(questionRepository.findByExamIdOrderByQuestionOrderAsc(1L))
            .thenReturn(List.of(question(exam, 2), question(exam, 3), question(exam, 5)));
        when(examRepository.save(exam)).thenReturn(exam);

        examService.publishExam(1L);

        assertEquals(ExamStatus.PUBLISHED, exam.getStatus());
        verify(examRepository).save(exam);
    }

    @Test
    void rejectsPublishingWhenQuestionMarksDifferFromExamTotal() {
        Exam exam = draftExam(10);
        when(examRepository.findById(1L)).thenReturn(Optional.of(exam));
        when(questionRepository.findByExamIdOrderByQuestionOrderAsc(1L))
            .thenReturn(List.of(question(exam, 2), question(exam, 3), question(exam, 4)));

        assertThrows(InvalidRequestException.class, () -> examService.publishExam(1L));
    }

    @Test
    void rejectsPublishingWithoutQuestions() {
        Exam exam = draftExam(5);
        when(examRepository.findById(1L)).thenReturn(Optional.of(exam));
        when(questionRepository.findByExamIdOrderByQuestionOrderAsc(1L)).thenReturn(List.of());

        assertThrows(InvalidRequestException.class, () -> examService.publishExam(1L));
    }

    @Test
    void permitsQuestionMutationsForDraftExam() {
        Exam exam = draftExam(5);
        Question existing = question(exam, 5);
        existing.setStatus(QuestionStatus.ACTIVE);
        when(examRepository.findById(1L)).thenReturn(Optional.of(exam));
        when(questionRepository.findById(2L)).thenReturn(Optional.of(existing));
        when(questionRepository.save(org.mockito.ArgumentMatchers.any(Question.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        questionService.createQuestion(1L, questionRequest(5));
        questionService.updateQuestion(2L, questionRequest(4));
        questionService.deleteQuestion(2L);

        verify(questionRepository, org.mockito.Mockito.times(2))
            .save(org.mockito.ArgumentMatchers.any(Question.class));
        verify(questionRepository).delete(existing);
    }

    @Test
    void rejectsQuestionMutationsForPublishedExam() {
        assertQuestionMutationsRejected(ExamStatus.PUBLISHED);
    }

    @Test
    void rejectsQuestionMutationsForClosedExam() {
        assertQuestionMutationsRejected(ExamStatus.CLOSED);
    }

    @Test
    void permitsAddingOptionForDraftExam() {
        Question question = question(draftExam(5), 5);
        when(questionRepository.findById(2L)).thenReturn(Optional.of(question));
        when(optionRepository.findByQuestionId(2L)).thenReturn(List.of());
        when(optionRepository.save(org.mockito.ArgumentMatchers.any(Option.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        optionService.createOption(2L, new OptionRequest("Choice", "A", true));

        verify(optionRepository).save(org.mockito.ArgumentMatchers.any(Option.class));
    }

    @Test
    void rejectsOptionMutationsForPublishedExam() {
        assertOptionMutationsRejected(ExamStatus.PUBLISHED);
    }

    @Test
    void rejectsOptionMutationsForClosedExam() {
        assertOptionMutationsRejected(ExamStatus.CLOSED);
    }

    private void assertQuestionMutationsRejected(ExamStatus status) {
        Exam exam = draftExam(5);
        exam.setStatus(status);
        Question question = question(exam, 5);
        when(examRepository.findById(1L)).thenReturn(Optional.of(exam));
        when(questionRepository.findById(2L)).thenReturn(Optional.of(question));

        assertThrows(InvalidRequestException.class,
            () -> questionService.createQuestion(1L, questionRequest(5)));
        assertThrows(InvalidRequestException.class,
            () -> questionService.updateQuestion(2L, questionRequest(5)));
        assertThrows(InvalidRequestException.class,
            () -> questionService.deleteQuestion(2L));
    }

    private void assertOptionMutationsRejected(ExamStatus status) {
        Exam exam = draftExam(5);
        exam.setStatus(status);
        Question question = question(exam, 5);
        Option option = new Option();
        option.setQuestion(question);
        when(questionRepository.findById(2L)).thenReturn(Optional.of(question));
        when(optionRepository.findById(3L)).thenReturn(Optional.of(option));
        OptionRequest request = new OptionRequest("Choice", "A", true);

        assertThrows(InvalidRequestException.class, () -> optionService.createOption(2L, request));
        assertThrows(InvalidRequestException.class, () -> optionService.updateOption(3L, request));
        assertThrows(InvalidRequestException.class, () -> optionService.deleteOption(3L));
    }

    private Exam draftExam(int totalMarks) {
        Exam exam = new Exam();
        exam.setId(1L);
        Subject subject = new Subject();
        subject.setId(1L);
        subject.setName("Test subject");
        exam.setSubject(subject);
        exam.setTotalMarks(totalMarks);
        exam.setPassingMarks(Math.min(totalMarks, 5));
        exam.setStatus(ExamStatus.DRAFT);
        exam.setStartTime(LocalDateTime.now().plusDays(1));
        exam.setEndTime(LocalDateTime.now().plusDays(1).plusHours(1));
        return exam;
    }

    private Question question(Exam exam, int marks) {
        Question question = new Question();
        question.setId(2L);
        question.setExam(exam);
        question.setMarks(marks);
        return question;
    }

    private QuestionRequest questionRequest(int marks) {
        return new QuestionRequest("Question", marks, 1);
    }
}
