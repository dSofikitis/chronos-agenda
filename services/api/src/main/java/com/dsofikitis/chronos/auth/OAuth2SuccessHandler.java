package com.dsofikitis.chronos.auth;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

/**
 * Mints a session cookie + redirects the browser to the frontend after a
 * successful Google OAuth login.
 */
@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserService users;
    private final JwtService jwt;
    private final AuthCookieWriter cookies;

    public OAuth2SuccessHandler(
            UserService users,
            JwtService jwt,
            AuthCookieWriter cookies,
            @Value("${chronos.oauth.success-redirect}") String successRedirect) {
        this.users = users;
        this.jwt = jwt;
        this.cookies = cookies;
        setDefaultTargetUrl(successRedirect);
        setAlwaysUseDefaultTargetUrl(true);
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        if (!(authentication.getPrincipal() instanceof OAuth2User oauthUser)) {
            getRedirectStrategy().sendRedirect(request, response, "/login?error=oauth-shape");
            return;
        }

        var subject = oauthUser.getAttribute("sub");
        var email = oauthUser.getAttribute("email");
        var name = oauthUser.<String>getAttribute("name");
        if (subject == null || email == null) {
            getRedirectStrategy().sendRedirect(request, response, "/login?error=oauth-claims");
            return;
        }

        var user = users.upsertGoogle(subject.toString(), email.toString(), name != null ? name : email.toString());
        cookies.writeSession(response, jwt.issue(user.getId()));
        super.onAuthenticationSuccess(request, response, authentication);
    }
}
