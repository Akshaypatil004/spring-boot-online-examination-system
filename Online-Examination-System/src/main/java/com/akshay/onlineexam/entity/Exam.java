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

@Table(name="exams")
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Exam {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@ManyToOne(fetch = FetchType.LAZY,optional = false)
	@JoinColumn(name="subject_id",nullable = false)
	private Subject subject;
	
	@Column(nullable = false,length = 150)
	private String title;
	
	@Column(length = 500)
	private String description;
	
	@Column(name="duration_minutes",nullable = false)
	private Integer durationMinutes;
	
	@Column(name="total_marks",nullable = false)
	private Integer totalMarks;
	
	@Column(name="passing_marks",nullable = false)
	private Integer passingMarks;
	
	@Column(name="start_time",nullable = false)
	private LocalDateTime startTime;
	
	@Column(name="end_time",nullable = false)
	private LocalDateTime endTime;
	
	@Enumerated(EnumType.STRING)
	@Column(nullable = false,length = 20)
	private ExamStatus status;
	
	@Column(name="created_at")
	private LocalDateTime createdAt;
	
	@Column(name="updated_at")
	private LocalDateTime updatedAt;

}
