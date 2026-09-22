package com.akshay.onlineexam.entity;

import java.math.BigDecimal;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "results")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Result {
	 @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long id;

	    @OneToOne(fetch = FetchType.LAZY, optional = false)
	    @JoinColumn(name = "attempt_id", nullable = false, unique = true)
	    private ExamAttempt attempt;

	    @Column(name = "total_questions", nullable = false)
	    private Integer totalQuestions;

	    @Column(name = "attempted_questions", nullable = false)
	    private Integer attemptedQuestions;

	    @Column(name = "correct_answers", nullable = false)
	    private Integer correctAnswers;

	    @Column(name = "wrong_answers", nullable = false)
	    private Integer wrongAnswers;

	    @Column(name = "unanswered_questions", nullable = false)
	    private Integer unansweredQuestions;

	    @Column(nullable = false)
	    private Integer score;

	    @Column(nullable = false, precision = 5, scale = 2)
	    private BigDecimal percentage;

	    @Enumerated(EnumType.STRING)
	    @Column(name = "result_status", nullable = false, length = 10)
	    private ResultStatus resultStatus;

	    @Column(name = "generated_at", nullable = false)
	    private LocalDateTime generatedAt;

}
