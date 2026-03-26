package org.egov.filestore.validator;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class FileSignatureValidator {

    private static final Map<String, byte[]> FILE_SIGNATURES = new HashMap<>();

    static {

        // PDF
        FILE_SIGNATURES.put("pdf",
                new byte[]{0x25,0x50,0x44,0x46});

        // Images
        FILE_SIGNATURES.put("jpg",
                new byte[]{(byte)0xFF,(byte)0xD8});
        FILE_SIGNATURES.put("jpeg",
                new byte[]{(byte)0xFF,(byte)0xD8});
        FILE_SIGNATURES.put("png",
                new byte[]{(byte)0x89,0x50,0x4E,0x47});

        // MS Office old format
        FILE_SIGNATURES.put("doc",
                new byte[]{(byte)0xD0,(byte)0xCF,0x11,(byte)0xE0});
        FILE_SIGNATURES.put("xls",
                new byte[]{(byte)0xD0,(byte)0xCF,0x11,(byte)0xE0});

        // Office OpenXML (ZIP container)
        FILE_SIGNATURES.put("docx",
                new byte[]{0x50,0x4B,0x03,0x04});
        FILE_SIGNATURES.put("xlsx",
                new byte[]{0x50,0x4B,0x03,0x04});

        // OpenDocument
        FILE_SIGNATURES.put("odt",
                new byte[]{0x50,0x4B,0x03,0x04});
        FILE_SIGNATURES.put("ods",
                new byte[]{0x50,0x4B,0x03,0x04});

        // Text formats
        FILE_SIGNATURES.put("txt", new byte[]{});
        FILE_SIGNATURES.put("csv", new byte[]{});
        FILE_SIGNATURES.put("dxf", new byte[]{});
    }

    public void validateSignature(MultipartFile file, String extension) {

        if(!FILE_SIGNATURES.containsKey(extension)){
            return;
        }

        byte[] expected = FILE_SIGNATURES.get(extension);

        if(expected.length == 0){
            return; // skip signature validation for text files
        }

        try(InputStream is = file.getInputStream()){

            byte[] header = new byte[expected.length];
            int read = is.read(header);

            if(read < expected.length){
                throw new CustomException("INVALID_FILE","Invalid file header");
            }

            for(int i=0;i<expected.length;i++){
                if(header[i] != expected[i]){
                    throw new CustomException(
                            "INVALID_FILE",
                            "File signature mismatch"
                    );
                }
            }

        }catch(IOException e){
            throw new CustomException(
                    "INVALID_FILE",
                    "Unable to validate file signature"
            );
        }
    }
}