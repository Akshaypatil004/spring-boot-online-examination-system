package com.akshay.onlineexam.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.akshay.onlineexam.dto.ApiResponse;
import com.akshay.onlineexam.dto.attempt.AttemptResponse;
import com.akshay.onlineexam.service.AttemptService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/student/attempts")
@RequiredArgsConstructor
public class StudentAttemptController {

    private final AttemptService attemptService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AttemptResponse>>>
            getMyAttempts() {

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Attempts fetched successfully",
                attemptService.getMyAttempts()
            )
        );
    }
}