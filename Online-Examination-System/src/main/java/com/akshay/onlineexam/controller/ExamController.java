package com.akshay.onlineexam.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.akshay.onlineexam.dto.ApiResponse;
import com.akshay.onlineexam.dto.exam.ExamRequest;
import com.akshay.onlineexam.dto.exam.ExamResponse;
import com.akshay.onlineexam.service.ExamService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;

    @PostMapping
    public ResponseEntity<ApiResponse<ExamResponse>> createExam(
            @Valid @RequestBody ExamRequest request) {

        ExamResponse exam =
            examService.createExam(request);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(
                new ApiResponse<>(
                    true,
                    "Exam created successfully",
                    exam
                )
            );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getAllExams() {

        List<ExamResponse> exams =
            examService.getAllExams();

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Exams fetched successfully",
                exams
            )
        );
    }

    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<ApiResponse<List<ExamResponse>>>
            getExamsBySubject(
                @PathVariable Long subjectId) {

        List<ExamResponse> exams =
            examService.getExamsBySubject(subjectId);

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Exams fetched successfully",
                exams
            )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExamResponse>> getExamById(
            @PathVariable Long id) {

        ExamResponse exam =
            examService.getExamById(id);

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Exam fetched successfully",
                exam
            )
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExamResponse>> updateExam(
            @PathVariable Long id,
            @Valid @RequestBody ExamRequest request) {

        ExamResponse exam =
            examService.updateExam(id, request);

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Exam updated successfully",
                exam
            )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExam(
            @PathVariable Long id) {

        examService.deleteExam(id);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<ExamResponse>> publishExam(
            @PathVariable Long id) {

        ExamResponse exam =
            examService.publishExam(id);

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Exam published successfully",
                exam
            )
        );
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<ApiResponse<ExamResponse>> closeExam(
            @PathVariable Long id) {

        ExamResponse exam =
            examService.closeExam(id);

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Exam closed successfully",
                exam
            )
        );
    }
}