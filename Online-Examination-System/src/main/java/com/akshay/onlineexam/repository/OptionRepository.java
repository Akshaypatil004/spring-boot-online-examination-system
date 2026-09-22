package com.akshay.onlineexam.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.akshay.onlineexam.entity.Option;
import com.akshay.onlineexam.entity.Question;

public interface OptionRepository extends JpaRepository<Option, Long>{
	List<Question> findByQuestionId(Long questionId);
}
