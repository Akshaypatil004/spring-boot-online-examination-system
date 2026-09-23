package com.akshay.onlineexam.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.akshay.onlineexam.dto.ApiResponse;
import com.akshay.onlineexam.dto.question.QuestionRequest;
import com.akshay.onlineexam.dto.question.QuestionResponse;
import com.akshay.onlineexam.service.QuestionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/exams/{examId}/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping
    public ResponseEntity<ApiResponse<QuestionResponse>> createQuestion(
            @PathVariable Long examId,
            @Valid @RequestBody QuestionRequest request) {

        QuestionResponse question =
            questionService.createQuestion(examId, request);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(
                new ApiResponse<>(
                    true,
                    "Question created successfully",
                    question
                )
            );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<QuestionResponse>>>
            getQuestionsByExam(
                @PathVariable Long examId) {

        List<QuestionResponse> questions =
            questionService.getQuestionsByExam(examId);

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Questions fetched successfully",
                questions
            )
        );
    }
}