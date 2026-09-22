package com.akshay.onlineexam.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.akshay.onlineexam.entity.AcademicProgram;

public interface AcademicProgramRepository extends JpaRepository<AcademicProgram, Long>{
	
	Optional<AcademicProgram> findByCode(String code);
	boolean existsByCode(String code);

}
