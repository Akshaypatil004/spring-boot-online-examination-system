package com.akshay.onlineexam.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

@Table(name="options")
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Option {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@ManyToOne(fetch = FetchType.LAZY,optional = false)
	@JoinColumn(name="question_id",nullable = false)
	private Question question;
	
	@Column(name="option_text",nullable = false,length = 500)
	private String optionText;
	
	@Column(name="option_label",nullable = false,length = 1)
	private String optionLabel;
	
	@Column(name="is_correct",nullable = false)
	private Boolean isCorrect;
}
