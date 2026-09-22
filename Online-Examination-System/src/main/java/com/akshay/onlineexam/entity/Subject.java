package com.akshay.onlineexam.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Table(name="subjects")
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Subject {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@Column(nullable = false,length = 100)
	private String name;
	
	@Column(length = 500)
	private String description;
	
	@ManyToOne(fetch = FetchType.LAZY,optional = false)
	@JoinColumn(name="academic_program_id",nullable=false)
	private AcademicProgram academicProgram;
	
	@Enumerated(EnumType.STRING)
	@Column(nullable=false,length = 20)
	private SubjectStatus status;
	
	@Column(name="created_at")
	private LocalDateTime createdAt;
	
	@Column(name="updated_at")
	private LocalDateTime updatedAt;

}
