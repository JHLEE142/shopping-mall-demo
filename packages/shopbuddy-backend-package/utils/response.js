// 통일된 응답 포맷
export const successResponse = (res, data, message = '성공', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const errorResponse = (res, message = '오류가 발생했습니다.', statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: message
  });
};

export const paginatedResponse = (res, data, pagination, message = '성공') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination
  });
};

