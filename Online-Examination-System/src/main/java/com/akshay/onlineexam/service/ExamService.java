package com.akshay.onlineexam.service;

import java.util.List;

import com.akshay.onlineexam.dto.exam.AvailableExamResponse;
import com.akshay.onlineexam.dto.exam.ExamRequest;
import com.akshay.onlineexam.dto.exam.ExamResponse;

public interface ExamService {

    ExamResponse createExam(ExamRequest request);

    List<ExamResponse> getAllExams();

    List<ExamResponse> getExamsBySubject(Long subjectId);

    ExamResponse getExamById(Long id);

    ExamResponse updateExam(Long id, ExamRequest request);

    void deleteExam(Long id);

    ExamResponse publishExam(Long id);

    ExamResponse closeExam(Long id);
    
    List<AvailableExamResponse> getAvailableExams();
}