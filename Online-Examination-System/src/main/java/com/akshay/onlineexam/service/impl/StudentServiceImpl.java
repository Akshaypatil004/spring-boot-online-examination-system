package com.akshay.onlineexam.service.impl;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.akshay.onlineexam.dto.student.StudentResponse;
import com.akshay.onlineexam.entity.Student;
import com.akshay.onlineexam.entity.User;
import com.akshay.onlineexam.exception.ResourceNotFoundException;
import com.akshay.onlineexam.mapper.StudentMapper;
import com.akshay.onlineexam.repository.StudentRepository;
import com.akshay.onlineexam.repository.UserRepository;
import com.akshay.onlineexam.service.StudentService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StudentServiceImpl implements StudentService {

	private final UserRepository userRepository;
	private final StudentRepository studentRepository;
	private final StudentMapper studentMapper;

	@Override
	@Transactional(readOnly = true)
	public StudentResponse getMyProfile() {

		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

		String email = authentication.getName();

		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResourceNotFoundException("User not found"));

		Student student = studentRepository.findByUserId(user.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));

		return studentMapper.toResponse(student);
	}
}