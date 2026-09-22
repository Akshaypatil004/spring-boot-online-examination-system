package com.akshay.onlineexam.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class RegisterRequest {

	@NotBlank
	@Email
	@Size(max = 100)
	private String email;

	@NotBlank
	@Size(min = 8, max = 100)
	private String password;

	@NotBlank
	@Size(max = 100)
	private String fullName;

	@NotBlank
	@Size(max = 30)
	private String rollNumber;

	@NotNull
	private Long academicProgramId;

	@NotNull
	@Min(1)
	@Max(10)
	private Integer currentYear;

	@NotNull
	@Min(1)
	@Max(20)
	private Integer currentSemester;

	@Size(max = 10)
	private String division;

	@Pattern(regexp = "^[0-9]{10,15}$")
	private String phone;

}