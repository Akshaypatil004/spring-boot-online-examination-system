package com.akshay.onlineexam.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.akshay.onlineexam.dto.ApiResponse;
import com.akshay.onlineexam.dto.student.StudentResponse;
import com.akshay.onlineexam.service.StudentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<StudentResponse>> getMyProfile() {

        StudentResponse studentResponse =
                studentService.getMyProfile();

        ApiResponse<StudentResponse> response =
                new ApiResponse<>(
                        true,
                        "Student profile fetched successfully",
                        studentResponse
                );

        return ResponseEntity.ok(response);
    }
}