package com.akshay.onlineexam.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Table(name="academic_programs")
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class AcademicProgram {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@Column(length = 100, nullable = false)
	private String name;

	@Column(length = 20,nullable = false,unique = true)
	private String code;
	
	@Column(name="duration_years" , nullable = false)
	private Integer durationYears;
	
	@Column(length = 100)
	private String department;
	
	@Enumerated(EnumType.STRING)
	@Column(nullable = false,length = 20)
	private ProgramStatus status;
	
	@Column(name="created_at")
	private LocalDateTime createdAt;
	
	@Column(name="updated_at")
	private LocalDateTime updatedAt;
}
