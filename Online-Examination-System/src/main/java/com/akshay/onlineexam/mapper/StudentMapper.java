package com.akshay.onlineexam.mapper;

import org.springframework.stereotype.Component;

import com.akshay.onlineexam.dto.student.StudentResponse;
import com.akshay.onlineexam.entity.Student;

@Component
public class StudentMapper {

	public StudentResponse toResponse(Student student) {

		StudentResponse response = new StudentResponse();

		response.setId(student.getId());
		response.setEmail(student.getUser().getEmail());
		response.setFullName(student.getFullName());
		response.setRollNumber(student.getRollNumber());

		response.setAcademicProgramId(student.getAcademicProgram().getId());

		response.setAcademicProgramName(student.getAcademicProgram().getName());

		response.setCurrentYear(student.getCurrentYear());
		response.setCurrentSemester(student.getCurrentSemester());
		response.setDivision(student.getDivision());
		response.setPhone(student.getPhone());

		return response;
	}
}