package com.akshay.onlineexam.dto.student;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class StudentResponse {
	private Long id;
	private String email;
	private String fullName;
	private String rollNumber;

	private Long academicProgramId;
	private String academicProgramName;

	private Integer currentYear;
	private Integer currentSemester;

	private String division;
	private String phone;
}
