package com.akshay.onlineexam.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.akshay.onlineexam.entity.Subject;

public interface SubjectRepository extends JpaRepository<Subject, Long>{
	List<Subject> findByAcademicProgramId(Long academicProgramId);
	boolean existsByNameAndAcademicProgramId(String name,Long academicProgramId);

}
