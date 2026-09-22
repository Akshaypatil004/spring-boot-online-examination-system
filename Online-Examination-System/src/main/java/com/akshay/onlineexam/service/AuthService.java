package com.akshay.onlineexam.service;

import com.akshay.onlineexam.dto.auth.LoginRequest;
import com.akshay.onlineexam.dto.auth.LoginResponse;
import com.akshay.onlineexam.dto.auth.RegisterRequest;
import com.akshay.onlineexam.dto.student.StudentResponse;

public interface AuthService {
	StudentResponse registerStudent(RegisterRequest request);
	LoginResponse login(LoginRequest request);
}
