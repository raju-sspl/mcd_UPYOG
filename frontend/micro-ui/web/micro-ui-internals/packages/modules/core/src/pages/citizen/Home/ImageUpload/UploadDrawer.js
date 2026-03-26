import React, { useState, useEffect } from "react";
import { GalleryIcon, RemoveIcon, UploadFile } from "@nudmcdgnpm/digit-ui-react-components";
import { useTranslation } from "react-i18next";

function UploadDrawer({ setProfilePic, closeDrawer, userType, removeProfilePic ,showToast}) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [file, setFile] = useState("");
  const [error, setError] = useState(null);
  const [fileChecksum, setFileChecksum] = useState(null);
  const { t } = useTranslation();

  const selectfile = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeimg = () => {
    removeProfilePic();
    closeDrawer();
  };

  const onOverlayBodyClick = () => closeDrawer();

  // 🔐 SHA-256 checksum
  const calculateChecksum = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
          resolve(hashHex);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };


  useEffect(() => {
    (async () => {
      if (!file) return;

      setError(null);
      setFileChecksum(null);

      // Comprehensive File Validation using central utility
      const validation = Digit.Utils.fileValidation.validateFile(file, {
        type: "image",
        maxSizeMB: 1,
        sanitize: true
      });

      if (!validation.isValid) {
        let errorMessage = "CORE_COMMON_PROFILE_INVALID_FILE_INPUT";
        if (validation.error === "MAX_FILE_SIZE_EXCEEDED") errorMessage = "CORE_COMMON_PROFILE_MAXIMUM_UPLOAD_SIZE_EXCEEDED";
        if (validation.error === "INVALID_FILE_EXTENSION") errorMessage = "CORE_COMMON_PROFILE_INVALID_FILE_EXTENSION";
        if (validation.error === "MALICIOUS_FILENAME_DETECTED") errorMessage = "CORE_COMMON_PROFILE_INVALID_FILENAME";

        showToast("error", t(errorMessage));
        setError(t(errorMessage));
        return;
      }

      const validFile = validation.file;

      try {
        const checksum = await calculateChecksum(validFile);
        setFileChecksum(checksum);

        const response = await Digit.UploadServices.Filestorage(
          `${userType}-profile`,
          validFile,
          Digit.ULBService.getStateId(),
          checksum
        );

        if (response?.data?.files?.length > 0) {
          const fileStoreId = response.data.files[0].fileStoreId;
          setUploadedFile(fileStoreId);
          setProfilePic(fileStoreId);
          closeDrawer();
        } else {
          showToast("error", t("CORE_COMMON_PROFILE_FILE_UPLOAD_ERROR"));
          setError(t("CORE_COMMON_PROFILE_FILE_UPLOAD_ERROR"));
        }
      } catch (err) {
        console.error("Upload error:", err);
        showToast("error", t("CORE_COMMON_PROFILE_INVALID_FILE_INPUT"));
      }
    })();
  }, [file]);

  return (
    <React.Fragment>
      <div
        style={{
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          width: "100%",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,.5)",
          // zIndex: "9998",
        }}
        onClick={onOverlayBodyClick}
      ></div>
      <div
        style={{
          width: "100%",
          justifyContent: "space-between",
          display: "flex",
          backgroundColor: "white",
          alignItems: "center",
          position: "fixed",
          left: "0",
          right: "0",
          height: "20%",
          bottom: userType === "citizen" ? "2.5rem" : "0",
          zIndex: "2",
        }}
      >
        <div
          style={{ display: "flex", flex: "1", flexDirection: "column", width: "100%", justifyContent: "center", alignItems: "center", gap: "8px 0" }}
        >
          <label for="file" style={{ cursor: "pointer" }}>
            {" "}
            <GalleryIcon />
          </label>
          <label style={{ cursor: "pointer" }}> Gallery</label>
          <input type="file" id="file" accept="image/*, .png, .jpeg, .jpg" onChange={selectfile} style={{ display: "none" }} />
        </div>

        <div
          style={{ display: "flex", flex: "1", width: "100%", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: "8px 0" }}
        >
          <button onClick={removeimg}>
            <RemoveIcon />
          </button>
          <label style={{ cursor: "pointer" }}>Remove</label>
        </div>
      </div>
    </React.Fragment>
  );
}

export default UploadDrawer;
