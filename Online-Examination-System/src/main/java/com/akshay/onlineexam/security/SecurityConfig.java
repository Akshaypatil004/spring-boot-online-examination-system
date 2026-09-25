package com.akshay.onlineexam.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

	private final JwtAuthenticationFilter jwtAuthenticationFilter;

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http)
	        throws Exception {

	    http
	        .cors(cors -> {})
	        .csrf(csrf -> csrf.disable())

	        .authorizeHttpRequests(auth -> auth

	            .requestMatchers(
	                "/api/auth/register",
	                "/api/auth/login"
	            ).permitAll()

	            .requestMatchers("/api/admin/**")
	            .hasRole("ADMIN")

	            .requestMatchers("/api/student/**")
	            .hasRole("STUDENT")

	            .anyRequest()
	            .authenticated()
	        )

	        .exceptionHandling(exception -> exception
	            .authenticationEntryPoint((request, response, authException) -> {
	                response.setStatus(HttpStatus.UNAUTHORIZED.value());
	                response.setContentType("application/json");
	                response.getWriter().write(
	                    "{\"success\":false,\"message\":\"Authentication required\",\"data\":null}"
	                );
	            })
	            .accessDeniedHandler((request, response, accessDeniedException) -> {
	                response.setStatus(HttpStatus.FORBIDDEN.value());
	                response.setContentType("application/json");
	                response.getWriter().write(
	                    "{\"success\":false,\"message\":\"Access denied\",\"data\":null}"
	                );
	            })
	        )

	        .addFilterBefore(
	            jwtAuthenticationFilter,
	            UsernamePasswordAuthenticationFilter.class
	        );

	    return http.build();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
	    CorsConfiguration configuration = new CorsConfiguration();
	    configuration.setAllowedOrigins(java.util.List.of("http://127.0.0.1:5501"));
	    configuration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
	    configuration.setAllowedHeaders(java.util.List.of("Authorization", "Content-Type", "Accept"));
	    configuration.setMaxAge(3600L);

	    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
	    source.registerCorsConfiguration("/**", configuration);
	    return source;
	}
	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {

		return configuration.getAuthenticationManager();
	}

}
