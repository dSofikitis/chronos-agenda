package com.dsofikitis.chronos.auth;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.UUID;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * Lets controllers declare {@code @CurrentUserId UUID userId} as a parameter
 * instead of pulling from the SecurityContext by hand on every endpoint.
 */
public final class CurrentUserIdResolver {

    @Target(ElementType.PARAMETER)
    @Retention(RetentionPolicy.RUNTIME)
    public @interface CurrentUserId {
    }

    @Component
    public static class Resolver implements HandlerMethodArgumentResolver {

        @Override
        public boolean supportsParameter(MethodParameter parameter) {
            return parameter.hasParameterAnnotation(CurrentUserId.class)
                    && UUID.class.equals(parameter.getParameterType());
        }

        @Override
        public Object resolveArgument(
                MethodParameter parameter,
                ModelAndViewContainer mavContainer,
                NativeWebRequest webRequest,
                WebDataBinderFactory binderFactory) {
            return JwtAuthenticationFilter.currentUserIdOrThrow();
        }
    }

    private CurrentUserIdResolver() {
    }
}
