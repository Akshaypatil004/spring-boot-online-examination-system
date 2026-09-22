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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
		name="exam_attempts",
		uniqueConstraints = {
			@UniqueConstraint(
					name="uk_student_exam",
					columnNames = {"student_id","exam_id"}
			)
		}
)
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class ExamAttempt {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@ManyToOne(fetch = FetchType.LAZY,optional = false)
	@JoinColumn(name="student_id",nullable = false)
	private Student student;
	
	@ManyToOne(fetch = FetchType.LAZY,optional = false)
	@JoinColumn(name="exam_id",nullable = false)
	private Exam exam;
	
	@Column(name="started_at",nullable = false)
	private LocalDateTime startedAt;
	
	@Column(name="submitted_at")
	private LocalDateTime submittedAt;
	
	@Enumerated(EnumType.STRING)
	@Column(length = 20,nullable = false)
	private AttemptStatus status;
	
	@Column
	private Integer score;
	
	
	
	

}
