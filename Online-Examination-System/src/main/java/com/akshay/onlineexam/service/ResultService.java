package com.akshay.onlineexam.service;

import java.util.List;

import com.akshay.onlineexam.dto.result.ResultResponse;

public interface ResultService {

    List<ResultResponse> getMyResults();

    ResultResponse getMyResultById(Long resultId);

    List<ResultResponse> getResultsByExam(Long examId);

    List<ResultResponse> getAllResults();

    ResultResponse getResultById(Long resultId);
}