package com.akshay.onlineexam.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.akshay.onlineexam.dto.ApiResponse;
import com.akshay.onlineexam.dto.question.QuestionRequest;
import com.akshay.onlineexam.dto.question.QuestionResponse;
import com.akshay.onlineexam.service.QuestionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/questions")
@RequiredArgsConstructor
public class QuestionManagementController {

    private final QuestionService questionService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuestionResponse>> getQuestion(
            @PathVariable Long id) {

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Question fetched successfully",
                questionService.getQuestionById(id)
            )
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuestionResponse>> updateQuestion(
            @PathVariable Long id,
            @Valid @RequestBody QuestionRequest request) {

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Question updated successfully",
                questionService.updateQuestion(id, request)
            )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable Long id) {

        questionService.deleteQuestion(id);

        return ResponseEntity.noContent().build();
    }
}