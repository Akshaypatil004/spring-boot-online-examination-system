package com.akshay.onlineexam.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.akshay.onlineexam.entity.Question;

public interface QuestionRepository extends JpaRepository<Question, Long>{

    List<Question> findByExamIdOrderByQuestionOrderAsc(Long examId);
}
