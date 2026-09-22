package com.akshay.onlineexam.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Table(name="students")
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Student {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id" ,nullable = false,unique = true)
	private User user;
	
	@Column(name="full_name", nullable = false,length = 100)
	private String fullName;
	
	@Column(name="roll_number", nullable = false,unique = true,length = 30)
	private String rollNumber;
	
	@ManyToOne(fetch = FetchType.LAZY,optional = false)
	@JoinColumn(name="academic_program_id",nullable = false)
	private AcademicProgram academicProgram;
	
	@Column(name="current_year",nullable = false)
	private Integer currentYear;
	
	@Column(length = 50)
	private String division;
	
	@Column(length = 15)
	private String phone;
	
	@Column(name="created_at")
	private LocalDateTime createdAt;
	
	@Column(name="updated_at")
	private LocalDateTime updatedAt;
}
