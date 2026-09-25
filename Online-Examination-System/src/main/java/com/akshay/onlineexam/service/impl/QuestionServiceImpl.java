package com.akshay.onlineexam.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.akshay.onlineexam.dto.question.QuestionRequest;
import com.akshay.onlineexam.dto.question.QuestionResponse;
import com.akshay.onlineexam.entity.Exam;
import com.akshay.onlineexam.entity.ExamStatus;
import com.akshay.onlineexam.entity.Question;
import com.akshay.onlineexam.entity.QuestionStatus;
import com.akshay.onlineexam.exception.InvalidRequestException;
import com.akshay.onlineexam.exception.ResourceNotFoundException;
import com.akshay.onlineexam.repository.ExamRepository;
import com.akshay.onlineexam.repository.QuestionRepository;
import com.akshay.onlineexam.service.QuestionService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepository;
    private final ExamRepository examRepository;

    @Override
    public QuestionResponse createQuestion(
            Long examId,
            QuestionRequest request) {

        Exam exam =
            examRepository.findById(examId)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Exam not found with id: " + examId
                    )
                );

        if (exam.getStatus() != ExamStatus.DRAFT) {
            throw new InvalidRequestException(
                "Questions can only be changed while an exam is in DRAFT status"
            );
        }

        Question question = new Question();

        question.setExam(exam);
        question.setQuestionText(request.getQuestionText());
        question.setMarks(request.getMarks());
        question.setQuestionOrder(request.getQuestionOrder());

        // Use your actual QuestionStatus enum here.
        question.setStatus(
//            question.getStatus()
            QuestionStatus.ACTIVE
        );

        Question savedQuestion =
            questionRepository.save(question);

        return toResponse(savedQuestion);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuestionResponse> getQuestionsByExam(
            Long examId) {

        if (!examRepository.existsById(examId)) {
            throw new ResourceNotFoundException(
                "Exam not found with id: " + examId
            );
        }

        return questionRepository
            .findByExamIdOrderByQuestionOrderAsc(examId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public QuestionResponse getQuestionById(Long id) {

        Question question =
            questionRepository.findById(id)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Question not found with id: " + id
                    )
                );

        return toResponse(question);
    }

    @Override
    public QuestionResponse updateQuestion(
            Long id,
            QuestionRequest request) {

        Question question =
            questionRepository.findById(id)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Question not found with id: " + id
                    )
                );

        if (question.getExam().getStatus() != ExamStatus.DRAFT) {
            throw new InvalidRequestException(
                "Questions can only be changed while an exam is in DRAFT status"
            );
        }

        question.setQuestionText(request.getQuestionText());
        question.setMarks(request.getMarks());
        question.setQuestionOrder(request.getQuestionOrder());

        Question updatedQuestion =
            questionRepository.save(question);

        return toResponse(updatedQuestion);
    }

    @Override
    public void deleteQuestion(Long id) {

        Question question =
            questionRepository.findById(id)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Question not found with id: " + id
                    )
                );

        if (question.getExam().getStatus() != ExamStatus.DRAFT) {
            throw new InvalidRequestException(
                "Questions can only be changed while an exam is in DRAFT status"
            );
        }

        questionRepository.delete(question);
    }

    private QuestionResponse toResponse(Question question) {

        return new QuestionResponse(
            question.getId(),
            question.getExam().getId(),
            question.getQuestionText(),
            question.getMarks(),
            question.getQuestionOrder(),
            question.getStatus().name()
        );
    }
}
