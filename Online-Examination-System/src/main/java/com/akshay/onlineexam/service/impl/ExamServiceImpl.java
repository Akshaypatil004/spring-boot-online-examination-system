package com.akshay.onlineexam.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.akshay.onlineexam.dto.exam.AvailableExamResponse;
import com.akshay.onlineexam.dto.exam.ExamRequest;
import com.akshay.onlineexam.dto.exam.ExamResponse;
import com.akshay.onlineexam.entity.Exam;
import com.akshay.onlineexam.entity.ExamStatus;
import com.akshay.onlineexam.entity.Student;
import com.akshay.onlineexam.entity.Subject;
import com.akshay.onlineexam.entity.User;
import com.akshay.onlineexam.exception.InvalidRequestException;
import com.akshay.onlineexam.exception.ResourceNotFoundException;
import com.akshay.onlineexam.repository.ExamRepository;
import com.akshay.onlineexam.repository.StudentRepository;
import com.akshay.onlineexam.repository.SubjectRepository;
import com.akshay.onlineexam.repository.UserRepository;
import com.akshay.onlineexam.service.ExamService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExamServiceImpl implements ExamService {

    private final ExamRepository examRepository;
    private final SubjectRepository subjectRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    @Override
    public ExamResponse createExam(ExamRequest request) {

        validateExamRequest(request);

        Subject subject =
            subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Subject not found with id: "
                        + request.getSubjectId()
                    )
                );

        Exam exam = new Exam();

        exam.setSubject(subject);
        exam.setTitle(request.getTitle());
        exam.setDescription(request.getDescription());
        exam.setDurationMinutes(request.getDurationMinutes());
        exam.setTotalMarks(request.getTotalMarks());
        exam.setPassingMarks(request.getPassingMarks());
        exam.setStartTime(request.getStartTime());
        exam.setEndTime(request.getEndTime());

        // Every newly created exam starts as DRAFT.
        exam.setStatus(ExamStatus.DRAFT);

        Exam savedExam =
            examRepository.save(exam);

        return toResponse(savedExam);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getAllExams() {

        return examRepository.findAll()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getExamsBySubject(Long subjectId) {

        if (!subjectRepository.existsById(subjectId)) {
            throw new ResourceNotFoundException(
                "Subject not found with id: " + subjectId
            );
        }

        return examRepository.findBySubjectId(subjectId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ExamResponse getExamById(Long id) {

        Exam exam =
            examRepository.findById(id)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Exam not found with id: " + id
                    )
                );

        return toResponse(exam);
    }

    @Override
    public ExamResponse updateExam(
            Long id,
            ExamRequest request) {

        validateExamRequest(request);

        Exam exam =
            examRepository.findById(id)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Exam not found with id: " + id
                    )
                );

        /*
         * Only DRAFT exams can be modified.
         */
        if (exam.getStatus() != ExamStatus.DRAFT) {
            throw new InvalidRequestException(
                "Only DRAFT exams can be updated"
            );
        }

        Subject subject =
            subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Subject not found with id: "
                        + request.getSubjectId()
                    )
                );

        exam.setSubject(subject);
        exam.setTitle(request.getTitle());
        exam.setDescription(request.getDescription());
        exam.setDurationMinutes(request.getDurationMinutes());
        exam.setTotalMarks(request.getTotalMarks());
        exam.setPassingMarks(request.getPassingMarks());
        exam.setStartTime(request.getStartTime());
        exam.setEndTime(request.getEndTime());

        Exam updatedExam =
            examRepository.save(exam);

        return toResponse(updatedExam);
    }

    @Override
    public void deleteExam(Long id) {

        Exam exam =
            examRepository.findById(id)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Exam not found with id: " + id
                    )
                );

        /*
         * Don't allow deletion after publishing.
         */
        if (exam.getStatus() != ExamStatus.DRAFT) {
            throw new InvalidRequestException(
                "Only DRAFT exams can be deleted"
            );
        }

        examRepository.delete(exam);
    }

    @Override
    public ExamResponse publishExam(Long id) {

        Exam exam =
            examRepository.findById(id)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Exam not found with id: " + id
                    )
                );

        if (exam.getStatus() != ExamStatus.DRAFT) {
            throw new InvalidRequestException(
                "Only DRAFT exams can be published"
            );
        }

        LocalDateTime now = LocalDateTime.now();

        if (!exam.getStartTime().isAfter(now)) {
            throw new InvalidRequestException(
                "Exam start time must be in the future"
            );
        }

        exam.setStatus(ExamStatus.PUBLISHED);

        Exam updatedExam =
            examRepository.save(exam);

        return toResponse(updatedExam);
    }

    @Override
    public ExamResponse closeExam(Long id) {

        Exam exam =
            examRepository.findById(id)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Exam not found with id: " + id
                    )
                );

        if (exam.getStatus() != ExamStatus.PUBLISHED) {
            throw new InvalidRequestException(
                "Only PUBLISHED exams can be closed"
            );
        }

        exam.setStatus(ExamStatus.CLOSED);

        Exam updatedExam =
            examRepository.save(exam);

        return toResponse(updatedExam);
    }

    private void validateExamRequest(ExamRequest request) {

        if (request.getPassingMarks() > request.getTotalMarks()) {
            throw new InvalidRequestException(
                "Passing marks cannot be greater than total marks"
            );
        }

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new InvalidRequestException(
                "Start time must be before end time"
            );
        }
    }

    private ExamResponse toResponse(Exam exam) {

        return new ExamResponse(
            exam.getId(),

            exam.getSubject().getId(),
            exam.getSubject().getName(),

            exam.getTitle(),
            exam.getDescription(),

            exam.getDurationMinutes(),
            exam.getTotalMarks(),
            exam.getPassingMarks(),

            exam.getStartTime(),
            exam.getEndTime(),

            exam.getStatus()
        );
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AvailableExamResponse> getAvailableExams() {

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

        Long programId =
            student.getAcademicProgram().getId();

        List<Exam> exams =
            examRepository
                .findBySubjectAcademicProgramIdAndStatus(
                    programId,
                    ExamStatus.PUBLISHED
                );

        return exams.stream()
            .filter(exam ->
                exam.getStartTime().isBefore(LocalDateTime.now())
                &&
                exam.getEndTime().isAfter(LocalDateTime.now())
            )
            .map(this::toAvailableExamResponse)
            .toList();
    }
    private AvailableExamResponse toAvailableExamResponse(
            Exam exam) {

        return new AvailableExamResponse(
            exam.getId(),
            exam.getTitle(),
            exam.getDescription(),
            exam.getSubject().getId(),
            exam.getSubject().getName(),
            exam.getDurationMinutes(),
            exam.getTotalMarks(),
            exam.getPassingMarks(),
            exam.getStartTime(),
            exam.getEndTime()
        );
    }
}