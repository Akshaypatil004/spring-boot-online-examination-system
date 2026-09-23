package com.akshay.onlineexam.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.akshay.onlineexam.dto.ApiResponse;
import com.akshay.onlineexam.dto.result.ResultResponse;
import com.akshay.onlineexam.service.ResultService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/results")
@RequiredArgsConstructor
public class AdminResultController {

    private final ResultService resultService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ResultResponse>>>
            getAllResults() {

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "All results fetched successfully",
                resultService.getAllResults()
            )
        );
    }

    @GetMapping("/{resultId}")
    public ResponseEntity<ApiResponse<ResultResponse>>
            getResultById(
                @PathVariable Long resultId) {

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Result fetched successfully",
                resultService.getResultById(resultId)
            )
        );
    }

    @GetMapping("/exam/{examId}")
    public ResponseEntity<ApiResponse<List<ResultResponse>>>
            getResultsByExam(
                @PathVariable Long examId) {

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Exam results fetched successfully",
                resultService.getResultsByExam(examId)
            )
        );
    }
}