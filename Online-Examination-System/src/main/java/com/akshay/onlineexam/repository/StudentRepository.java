package com.akshay.onlineexam.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.akshay.onlineexam.entity.Student;

public interface StudentRepository extends JpaRepository<Student, Long>{
	
	Optional<Student> findByUserId(Long userId);
	Optional<Student> findByRollNumber(String rollNumber);
	boolean existsByRollNumber(String rollNumber);

}
