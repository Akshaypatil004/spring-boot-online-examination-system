package com.akshay.onlineexam.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.akshay.onlineexam.dto.ApiResponse;
import com.akshay.onlineexam.dto.auth.LoginRequest;
import com.akshay.onlineexam.dto.auth.LoginResponse;
import com.akshay.onlineexam.dto.auth.RegisterRequest;
import com.akshay.onlineexam.dto.student.StudentResponse;
import com.akshay.onlineexam.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;

	@PostMapping("/register")
	public ResponseEntity<ApiResponse<StudentResponse>> registerStudent(@Valid @RequestBody RegisterRequest request) {

		StudentResponse studentResponse = authService.registerStudent(request);

		ApiResponse<StudentResponse> response = new ApiResponse<>(true, "Student registered successfully",
				studentResponse);

		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@PostMapping("/login")
	public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {

		LoginResponse loginResponse = authService.login(request);

		ApiResponse<LoginResponse> response = new ApiResponse<>(true, "Login successful", loginResponse);

		return ResponseEntity.status(HttpStatus.OK).body(response);
	}

}
