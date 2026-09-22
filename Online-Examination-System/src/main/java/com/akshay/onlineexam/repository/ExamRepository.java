package com.akshay.onlineexam.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.akshay.onlineexam.entity.Exam;

public interface ExamRepository extends JpaRepository<Exam, Long>{
	List<Exam> findBySubjectId(Long subjectId);
}
