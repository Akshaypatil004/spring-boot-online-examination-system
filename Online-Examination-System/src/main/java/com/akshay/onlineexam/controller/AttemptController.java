package com.akshay.onlineexam.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.akshay.onlineexam.dto.ApiResponse;
import com.akshay.onlineexam.dto.attempt.AttemptQuestionResponse;
import com.akshay.onlineexam.dto.attempt.AttemptResponse;
import com.akshay.onlineexam.dto.result.ResultResponse;
import com.akshay.onlineexam.service.AttemptService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/student/exams")
@RequiredArgsConstructor
public class AttemptController {

    private final AttemptService attemptService;

    @PostMapping("/{examId}/attempts")
    public ResponseEntity<ApiResponse<AttemptResponse>> startAttempt(
            @PathVariable Long examId) {

        AttemptResponse attempt =
            attemptService.startAttempt(examId);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(
                new ApiResponse<>(
                    true,
                    "Exam attempt started successfully",
                    attempt
                )
            );
    }
    @GetMapping("/{attemptId}/questions")
    public ResponseEntity<ApiResponse<List<AttemptQuestionResponse>>>
            getAttemptQuestions(
                @PathVariable Long attemptId) {

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Exam questions fetched successfully",
                attemptService.getAttemptQuestions(attemptId)
            )
        );
    }
    @PostMapping("/{attemptId}/submit")
    public ResponseEntity<ApiResponse<ResultResponse>> submitAttempt(
            @PathVariable Long attemptId) {

        ResultResponse resultResponse =
                attemptService.submitAttempt(attemptId);

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Exam submitted successfully",
                resultResponse
            )
        );
    }
    
}