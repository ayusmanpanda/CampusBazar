package com.campusbazaar.dto.admin;

public class AdminDtos {
    public record BanUserRequest(boolean isBanned, String reason) {}
}
