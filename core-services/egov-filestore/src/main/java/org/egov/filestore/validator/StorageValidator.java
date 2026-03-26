package org.egov.filestore.validator;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

import org.apache.commons.io.FilenameUtils;
import org.apache.tika.Tika;
import org.egov.filestore.config.FileStoreConfig;
import org.egov.filestore.domain.model.Artifact;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class StorageValidator {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    private static final Pattern FILE_NAME_PATTERN =
            Pattern.compile("^[a-zA-Z0-9_\\-\\.() ]+$");

    private static final Tika TIKA = new Tika();
    
    private static final Set<String> BLOCKED_EXTENSIONS = new HashSet<>();

	static {
	    BLOCKED_EXTENSIONS.add("php");
	    BLOCKED_EXTENSIONS.add("jsp");
	    BLOCKED_EXTENSIONS.add("asp");
	    BLOCKED_EXTENSIONS.add("exe");
	    BLOCKED_EXTENSIONS.add("sh");
	    BLOCKED_EXTENSIONS.add("bat");
	    BLOCKED_EXTENSIONS.add("js");
	    BLOCKED_EXTENSIONS.add("html");
	}

    private final FileStoreConfig fileStoreConfig;

    @Autowired
    private FileSignatureValidator fileSignatureValidator;
    
    @Autowired
    private FileContentValidator fileContentValidator;

    @Autowired
    public StorageValidator(FileStoreConfig fileStoreConfig) {
        this.fileStoreConfig = fileStoreConfig;
    }

    public void validate(Artifact artifact) {

        MultipartFile file = artifact.getMultipartFile();

        if (file == null || file.isEmpty()) {
            throw new CustomException(
                    "EG_FILESTORE_INVALID_INPUT",
                    "Uploaded file is empty"
            );
        }

        String originalFileName = file.getOriginalFilename();

        validateFileName(originalFileName);

        String extension =
                FilenameUtils.getExtension(originalFileName).toLowerCase();

        if(extension == null || extension.isEmpty()){
            throw new CustomException(
                    "EG_FILESTORE_INVALID_INPUT",
                    "File extension missing"
            );
        }

        validateExtension(extension);

        validateFileSize(file);

        validateMimeType(file, extension);

        validateRequestContentType(file, extension);

        // advanced protection
        fileSignatureValidator.validateSignature(file, extension);
        fileContentValidator.validateContent(file, extension);
    }


    private void validateFileName(String fileName) {

        if (fileName == null || fileName.trim().isEmpty()) {
            throw new CustomException(
                    "EG_FILESTORE_INVALID_INPUT",
                    "Filename cannot be empty"
            );
        }

        fileName = Paths.get(fileName).getFileName().toString();

        if (fileName.contains("..")
                || fileName.contains("%00")
                || fileName.contains("\0")) {

            throw new CustomException(
                    "EG_FILESTORE_INVALID_INPUT",
                    "Invalid filename detected"
            );
        }

        if (!FILE_NAME_PATTERN.matcher(fileName).matches()) {
            throw new CustomException(
                    "EG_FILESTORE_INVALID_INPUT",
                    "Filename contains invalid characters"
            );
        }

        if (fileName.split("\\.").length > 2) {
            throw new CustomException(
                    "EG_FILESTORE_INVALID_INPUT",
                    "Double extension not allowed"
            );
        }

        if (fileName.length() > 100) {
            throw new CustomException(
                    "EG_FILESTORE_INVALID_INPUT",
                    "Filename too long"
            );
        }
        
        int dotCount = fileName.length() - fileName.replace(".", "").length();

        if(dotCount != 1){
            throw new CustomException(
                    "EG_FILESTORE_INVALID_INPUT",
                    "Invalid file extension format"
            );
        }
    }


    private void validateExtension(String extension) {

    	if(BLOCKED_EXTENSIONS.contains(extension)){
    	    throw new CustomException(
    	            "EG_FILESTORE_INVALID_INPUT",
    	            "Blocked file type"
    	    );
    	}

        if (!fileStoreConfig.getAllowedFormatsMap()
                .containsKey(extension)) {

            throw new CustomException(
                    "EG_FILESTORE_INVALID_INPUT",
                    "Invalid file extension: " + extension
            );
        }
    }


    private void validateFileSize(MultipartFile file) {

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new CustomException(
                    "EG_FILESTORE_INVALID_INPUT",
                    "File exceeds allowed size (5MB)"
            );
        }
    }


    private void validateMimeType(MultipartFile file, String extension) {

        try(InputStream inputStream = file.getInputStream()){

            String detectedType = TIKA.detect(inputStream);

            if(!fileStoreConfig
                    .getAllowedFormatsMap()
                    .getOrDefault(extension, Collections.emptyList())
                    .contains(detectedType)){

                throw new CustomException(
                        "EG_FILESTORE_INVALID_INPUT",
                        "File type mismatch"
                );
            }

            // Block executable types
            if(detectedType.contains("x-msdownload")
                    || detectedType.contains("x-sh")
                    || detectedType.contains("executable")
                    || detectedType.contains("x-dosexec")
                    || detectedType.contains("x-msdos-program")){

                throw new CustomException(
                        "EG_FILESTORE_INVALID_INPUT",
                        "Executable files not allowed"
                );
            }

        }catch(IOException e){
            throw new CustomException(
                    "EG_FILESTORE_PARSING_ERROR",
                    "Unable to detect MIME type"
            );
        }
    }


    private void validateRequestContentType(
            MultipartFile file,
            String extension) {

        String requestType = file.getContentType();

        if(requestType == null){
            throw new CustomException(
                    "EG_FILESTORE_INVALID_INPUT",
                    "Content type missing"
            );
        }

        if (!fileStoreConfig
                .getAllowedFormatsMap()
                .getOrDefault(extension, Collections.emptyList())
                .contains(requestType)) {

            throw new CustomException(
                    "EG_FILESTORE_INVALID_INPUT",
                    "Invalid request content type"
            );
        }
    }
}