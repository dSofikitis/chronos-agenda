package com.dsofikitis.chronos.config;

import com.dsofikitis.chronos.auth.JwtAuthenticationFilter;
import com.dsofikitis.chronos.auth.OAuth2SuccessHandler;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    @ConditionalOnProperty(prefix = "chronos.oauth", name = "enabled", havingValue = "true")
    SecurityFilterChain oauthChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtFilter,
            OAuth2SuccessHandler successHandler,
            @Value("${chronos.oauth.failure-redirect}") String failureRedirect)
            throws Exception {
        configureCommon(http, jwtFilter);
        http.oauth2Login(oauth -> oauth
                .successHandler(successHandler)
                .failureUrl(failureRedirect));
        return http.build();
    }

    @Bean
    @ConditionalOnProperty(
            prefix = "chronos.oauth",
            name = "enabled",
            havingValue = "false",
            matchIfMissing = true)
    SecurityFilterChain devChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtFilter) throws Exception {
        configureCommon(http, jwtFilter);
        return http.build();
    }

    private static void configureCommon(
            HttpSecurity http,
            JwtAuthenticationFilter jwtFilter) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/actuator/health",
                                "/actuator/info",
                                "/api/auth/dev-login",
                                "/api/auth/logout",
                                "/api/ics/**",
                                "/login/**",
                                "/oauth2/**",
                                "/error")
                        .permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
    }

    @Bean
    UrlBasedCorsConfigurationSource corsConfigurationSource(
            @Value("${chronos.cors.origin}") String origin) {
        var cors = new CorsConfiguration();
        cors.setAllowedOrigins(List.of(origin));
        cors.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cors.setAllowedHeaders(List.of("Content-Type", "Authorization"));
        cors.setAllowCredentials(true);
        cors.setMaxAge(600L);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", cors);
        return source;
    }

    @Bean
    WebMvcConfigurer argumentResolverConfig(
            com.dsofikitis.chronos.auth.CurrentUserIdResolver.Resolver resolver) {
        return new WebMvcConfigurer() {
            @Override
            public void addArgumentResolvers(
                    java.util.List<org.springframework.web.method.support.HandlerMethodArgumentResolver> resolvers) {
                resolvers.add(resolver);
            }

            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // CORS is handled by SecurityFilterChain via UrlBasedCorsConfigurationSource above.
            }
        };
    }
}
