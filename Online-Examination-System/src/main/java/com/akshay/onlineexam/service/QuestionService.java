package com.akshay.onlineexam.service;

import java.util.List;

import com.akshay.onlineexam.dto.question.QuestionRequest;
import com.akshay.onlineexam.dto.question.QuestionResponse;

public interface QuestionService {

    QuestionResponse createQuestion(
        Long examId,
        QuestionRequest request
    );

    List<QuestionResponse> getQuestionsByExam(Long examId);

    QuestionResponse getQuestionById(Long id);

    QuestionResponse updateQuestion(
        Long id,
        QuestionRequest request
    );

    void deleteQuestion(Long id);
}