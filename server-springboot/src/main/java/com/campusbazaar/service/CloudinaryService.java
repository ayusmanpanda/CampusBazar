package com.campusbazaar.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public String upload(MultipartFile file) throws IOException {
        Map<String, Object> opts = ObjectUtils.asMap(
                "folder", "campusbazaar/listings",
                "transformation", new com.cloudinary.Transformation()
                        .width(1200).height(1200).crop("limit")
        );
        Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), opts);
        return (String) result.get("secure_url");
    }

    public List<String> uploadAll(List<MultipartFile> files) {
        return files.stream().map(f -> {
            try { return upload(f); }
            catch (IOException e) { throw new RuntimeException("Image upload failed: " + e.getMessage(), e); }
        }).collect(Collectors.toList());
    }
}
