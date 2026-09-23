package com.akshay.onlineexam.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.akshay.onlineexam.dto.ApiResponse;
import com.akshay.onlineexam.dto.subject.SubjectRequest;
import com.akshay.onlineexam.dto.subject.SubjectResponse;
import com.akshay.onlineexam.service.SubjectService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    @PostMapping
    public ResponseEntity<ApiResponse<SubjectResponse>> createSubject(
            @Valid @RequestBody SubjectRequest request) {

        SubjectResponse subject =
            subjectService.createSubject(request);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(
                new ApiResponse<>(
                    true,
                    "Subject created successfully",
                    subject
                )
            );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubjectResponse>>> getAllSubjects() {

        List<SubjectResponse> subjects =
            subjectService.getAllSubjects();

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Subjects fetched successfully",
                subjects
            )
        );
    }

    @GetMapping("/program/{programId}")
    public ResponseEntity<ApiResponse<List<SubjectResponse>>>
            getSubjectsByProgram(
                @PathVariable Long programId) {

        List<SubjectResponse> subjects =
            subjectService.getSubjectsByProgram(programId);

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Subjects fetched successfully",
                subjects
            )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SubjectResponse>> getSubjectById(
            @PathVariable Long id) {

        SubjectResponse subject =
            subjectService.getSubjectById(id);

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Subject fetched successfully",
                subject
            )
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SubjectResponse>> updateSubject(
            @PathVariable Long id,
            @Valid @RequestBody SubjectRequest request) {

        SubjectResponse subject =
            subjectService.updateSubject(id, request);

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Subject updated successfully",
                subject
            )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubject(
            @PathVariable Long id) {

        subjectService.deleteSubject(id);

        return ResponseEntity.noContent().build();
    }
}