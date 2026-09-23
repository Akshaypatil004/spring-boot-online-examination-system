package com.akshay.onlineexam.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.akshay.onlineexam.dto.ApiResponse;
import com.akshay.onlineexam.dto.attempt.AnswerRequest;
import com.akshay.onlineexam.dto.attempt.AnswerResponse;
import com.akshay.onlineexam.service.AttemptService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/student/attempts")
@RequiredArgsConstructor
public class AnswerController {

    private final AttemptService attemptService;

    @PutMapping("/{attemptId}/answers/{questionId}")
    public ResponseEntity<ApiResponse<AnswerResponse>> saveAnswer(
            @PathVariable Long attemptId,
            @PathVariable Long questionId,
            @Valid @RequestBody AnswerRequest request) {

        AnswerResponse answer =
            attemptService.saveAnswer(
                attemptId,
                questionId,
                request
            );

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Answer saved successfully",
                answer
            )
        );
    }
}