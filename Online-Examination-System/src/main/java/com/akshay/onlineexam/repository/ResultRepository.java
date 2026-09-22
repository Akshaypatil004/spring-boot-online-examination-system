package com.akshay.onlineexam.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.akshay.onlineexam.entity.Result;

public interface ResultRepository extends JpaRepository<Result, Long> {

    Optional<Result> findByAttemptId(Long attemptId);

    boolean existsByAttemptId(Long attemptId);
}
