package com.akshay.onlineexam.service;

import java.util.List;

import com.akshay.onlineexam.dto.attempt.AnswerRequest;
import com.akshay.onlineexam.dto.attempt.AnswerResponse;
import com.akshay.onlineexam.dto.attempt.AttemptQuestionResponse;
import com.akshay.onlineexam.dto.attempt.AttemptResponse;
import com.akshay.onlineexam.dto.result.ResultResponse;

public interface AttemptService {

	AttemptResponse startAttempt(Long examId);

	List<AttemptQuestionResponse> getAttemptQuestions(Long attemptId);

	AnswerResponse saveAnswer(Long attemptId, Long questionId, AnswerRequest request);

	ResultResponse submitAttempt(Long attemptId);
	
	List<AttemptResponse> getMyAttempts();
}