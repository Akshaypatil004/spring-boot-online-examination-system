package com.akshay.onlineexam.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.akshay.onlineexam.dto.ApiResponse;
import com.akshay.onlineexam.dto.exam.AvailableExamResponse;
import com.akshay.onlineexam.service.ExamService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/student/exams")
@RequiredArgsConstructor
public class StudentExamController {

    private final ExamService examService;

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<AvailableExamResponse>>>
            getAvailableExams() {

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Available exams fetched successfully",
                examService.getAvailableExams()
            )
        );
    }
}