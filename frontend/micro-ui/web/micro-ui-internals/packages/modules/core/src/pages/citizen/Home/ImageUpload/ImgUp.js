import React, { useState, useEffect } from "react";
import { UploadFile } from '@nudmcdgnpm/digit-ui-react-components';
import { useTranslation } from "react-i18next";

const ImgUp = () => {
  const { t } = useTranslation();
  const [uploadedFile, setUploadedFile] = useState("a");
  const [file, setFile] = useState("")
  function selectfile(e) {
    setFile(e.target.files[0]);


  }
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setError(null);
      if (file) {
        // Comprehensive File Validation using central utility
        const validation = Digit.Utils.fileValidation.validateFile(file, {
          type: "all", // allow image and doc as per original .jpg,.png,.pdf
          maxSizeMB: 2,
          sanitize: true
        });

        if (!validation.isValid) {
          let errorMessage = "FILE_UPLOAD_ERROR";
          if (validation.error === "MAX_FILE_SIZE_EXCEEDED") errorMessage = "PT_MAXIMUM_UPLOAD_SIZE_EXCEEDED";
          if (validation.error === "INVALID_FILE_EXTENSION") errorMessage = "INVALID_FILE_EXTENSION";
          if (validation.error === "MALICIOUS_FILENAME_DETECTED") errorMessage = "INVALID_FILENAME";

          setError(t(errorMessage));
          return;
        }

        const validFile = validation.file;

        try {
          // TODO: change module in file storage
          const response = await Digit.UploadServices.Filestorage("citizen-profile", validFile, Digit.ULBService.getStateId());
          if (response?.data?.files?.length > 0) {
            setUploadedFile(response?.data?.files[0]?.fileStoreId);
          } else {
            setError(t("FILE_UPLOAD_ERROR"));
          }
        } catch (err) {
          setError(t("FILE_UPLOAD_ERROR"));
        }
      }
    })();
  }, [file]);

  return (
    <React.Fragment>

      <UploadFile
        extraStyleName={"propertyCreate"}
        accept=".jpg,.png,.pdf"
        onUpload={selectfile}
        onDelete={() => {
          setUploadedFile(null);
        }}

      />
    </React.Fragment>
  )
}
export default ImgUp