package com.akshay.onlineexam.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.akshay.onlineexam.entity.ExamAttempt;

public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, Long> {

	Optional<ExamAttempt> findByStudentIdAndExamId(Long studentId, Long examId);

	boolean existsByStudentIdAndExamId(Long studentId, Long examId);

}
