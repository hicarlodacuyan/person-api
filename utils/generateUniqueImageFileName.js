function generateUniqueImageFileName(file) {
  const extension = file.originalname.split(".").pop();
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileName = `${timestamp}-${randomString}.${extension}`;

  const sanitizedFileName = fileName.replace(/\s+/g, ""); // Remove spaces

  return sanitizedFileName;
}

export default generateUniqueImageFileName;
