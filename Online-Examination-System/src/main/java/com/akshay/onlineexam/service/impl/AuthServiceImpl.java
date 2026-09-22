package com.akshay.onlineexam.service.impl;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.akshay.onlineexam.dto.auth.LoginRequest;
import com.akshay.onlineexam.dto.auth.LoginResponse;
import com.akshay.onlineexam.dto.auth.RegisterRequest;
import com.akshay.onlineexam.dto.student.StudentResponse;
import com.akshay.onlineexam.entity.AcademicProgram;
import com.akshay.onlineexam.entity.AccountStatus;
import com.akshay.onlineexam.entity.Role;
import com.akshay.onlineexam.entity.Student;
import com.akshay.onlineexam.entity.User;
import com.akshay.onlineexam.exception.DuplicateResourceException;
import com.akshay.onlineexam.exception.InvalidRequestException;
import com.akshay.onlineexam.exception.ResourceNotFoundException;
import com.akshay.onlineexam.mapper.StudentMapper;
import com.akshay.onlineexam.repository.AcademicProgramRepository;
import com.akshay.onlineexam.repository.StudentRepository;
import com.akshay.onlineexam.repository.UserRepository;
import com.akshay.onlineexam.security.JwtService;
import com.akshay.onlineexam.service.AuthService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

	private final UserRepository userRepository;
	private final StudentRepository studentRepository;
	private final AcademicProgramRepository academicProgramRepository;
	private final StudentMapper studentMapper;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final JwtService jwtService;

	@Override
	@Transactional
	public StudentResponse registerStudent(RegisterRequest request) {

		// 1. Check duplicate email
		if (userRepository.existsByEmail(request.getEmail())) {
			throw new DuplicateResourceException("Email already registered");
		}

		// 2. Check duplicate roll number
		if (studentRepository.existsByRollNumber(request.getRollNumber())) {
			throw new DuplicateResourceException("Roll number already registered");
		}

		// 3. Find academic program
		AcademicProgram academicProgram = academicProgramRepository.findById(request.getAcademicProgramId())
				.orElseThrow(() -> new ResourceNotFoundException("Academic program not found"));

		// 4. Validate current year against program duration
		if (request.getCurrentYear() > academicProgram.getDurationYears()) {
			throw new InvalidRequestException("Current year cannot exceed program duration");
		}

		// 5. Create User
		User user = new User();

		user.setEmail(request.getEmail());
		user.setPassword(passwordEncoder.encode(request.getPassword()));
		user.setRole(Role.STUDENT);
		user.setAccountStatus(AccountStatus.ACTIVE);

		User savedUser = userRepository.save(user);

		// 6. Create Student
		Student student = new Student();

		student.setUser(savedUser);
		student.setFullName(request.getFullName());
		student.setRollNumber(request.getRollNumber());
		student.setAcademicProgram(academicProgram);
		student.setCurrentYear(request.getCurrentYear());
		student.setCurrentSemester(request.getCurrentSemester());
		student.setDivision(request.getDivision());
		student.setPhone(request.getPhone());

		Student savedStudent = studentRepository.save(student);

		// 7. Convert Entity → Response DTO
		return studentMapper.toResponse(savedStudent);
	}

	@Override
	public LoginResponse login(LoginRequest request) {

	    Authentication authentication =
	            authenticationManager.authenticate(
	                    new UsernamePasswordAuthenticationToken(
	                            request.getEmail(),
	                            request.getPassword()
	                    )
	            );

	    UserDetails userDetails =
	            (UserDetails) authentication.getPrincipal();

	    String token =
	            jwtService.generateToken(userDetails);

	    String role =
	            userDetails.getAuthorities()
	                    .iterator()
	                    .next()
	                    .getAuthority()
	                    .replace("ROLE_", "");

	    return new LoginResponse(
	            token,
	            "Bearer",
	            role
	    );
	}
}