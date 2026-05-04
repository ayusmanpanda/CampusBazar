package com.campusbazaar.dto.auth;

import com.campusbazaar.model.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record SignupRequest(
            @NotBlank @Size(min = 2, max = 80) String name,
            @Email @NotBlank String email,
            @Size(min = 6, max = 128) String password,
            String department,
            @Min(1) @Max(6) Integer year
    ) {}

    public record VerifyOtpRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(min = 6, max = 6) String otp
    ) {}

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    public record LogoutRequest(String refreshToken) {}

    public record AuthResponse(String accessToken, String refreshToken, UserPayload user) {
        public static AuthResponse from(String access, String refresh, User u) {
            return new AuthResponse(access, refresh, UserPayload.from(u));
        }
    }

    public record UserPayload(String id, String name, String email, String role,
                              String profilePhoto, String department, Integer year) {
        public static UserPayload from(User u) {
            return new UserPayload(u.getId(), u.getName(), u.getEmail(), u.getRole().name(),
                    u.getProfilePhoto(), u.getDepartment(), u.getYear());
        }
    }
}
