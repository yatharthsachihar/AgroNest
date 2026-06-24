import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  FiUploadCloud,
  FiImage,
  FiTrash2
} from "react-icons/fi";

export default function ImageUploader({
  image,
  setImage
}) {
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];

    if (!file) return;

    setImage({
      file,
      preview: URL.createObjectURL(file)
    });
  }, [setImage]);

  const {
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({
    accept: {
      "image/*": []
    },
    maxFiles: 1,
    onDrop
  });

  return (
    <div className="image-uploader">

      <div
        {...getRootProps()}
        className={`upload-zone ${
          isDragActive ? "active" : ""
        }`}
      >
        <input {...getInputProps()} />

        <FiUploadCloud />

        <h4>
          Upload Product Image
        </h4>

        <p>
          Drag & Drop or Click
        </p>
      </div>

      {image && (
        <div className="uploaded-image">
          <img
            src={image.preview}
            alt=""
          />

          <button
            type="button"
            onClick={() => setImage(null)}
          >
            <FiTrash2 />
          </button>
        </div>
      )}

    </div>
  );
}