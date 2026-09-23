package com.akshay.onlineexam.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.akshay.onlineexam.dto.ApiResponse;
import com.akshay.onlineexam.dto.result.ResultResponse;
import com.akshay.onlineexam.service.ResultService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/student/results")
@RequiredArgsConstructor
public class StudentResultController {

    private final ResultService resultService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ResultResponse>>>
            getMyResults() {

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Results fetched successfully",
                resultService.getMyResults()
            )
        );
    }

    @GetMapping("/{resultId}")
    public ResponseEntity<ApiResponse<ResultResponse>>
            getMyResult(
                @PathVariable Long resultId) {

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Result fetched successfully",
                resultService.getMyResultById(resultId)
            )
        );
    }
}